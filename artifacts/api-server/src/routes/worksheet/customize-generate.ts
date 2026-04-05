import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const ACTIVITY_TO_LAYOUT: Record<string, string> = {
  label_diagram: "diagram_label",
  observation_sheet: "diagram_label",
  sequence_chart: "sequence_organizer",
  timeline: "sequence_organizer",
  line_matching: "matching",
  cut_and_sort: "matching",
  word_search: "matching",
  bingo_card: "matching",
  science_concept_practice: "concept_practice",
  math_practice: "concept_practice",
  /** Distinct shell from equation practice — drives Quick Gen card previews and editor tone */
  math_word_problems: "word_problems",
  number_bond: "concept_practice",
  ten_frame: "concept_practice",
  graph_page: "data_representation",
  measurement: "word_problems",
  frayer_model: "concept_practice",
  kwl_chart: "concept_practice",
  mind_map: "concept_practice",
  venn_diagram: "concept_practice",
  writing_prompt: "concept_practice",
  sentence_frames: "concept_practice",
};

function layoutTypeForActivity(activityType: string | undefined): string {
  const key = String(activityType ?? "").trim();
  return ACTIVITY_TO_LAYOUT[key] || "default";
}

/** Strip markdown fences and isolate the outermost JSON object when models add prose. */
function extractJsonPayload(str: string): string {
  let t = String(str ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/s, "")
    .trim();
  if (t.startsWith("{") && t.endsWith("}")) return t;
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) return t.slice(first, last + 1);
  return t;
}

function safeParseJSON(str: string): any | null {
  try {
    return JSON.parse(extractJsonPayload(str));
  } catch (e) {
    console.error("[GEN] JSON parse failed:", e);
    return null;
  }
}

/** Prompt block: generation must put task directions in section.instructions only (see hoistInstructionalLanguageToSectionInstructions). */
const INSTRUCTIONS_VS_STUDENT_CONTENT = `
INSTRUCTIONS vs STUDENT-FACING FIELDS (CRITICAL — EVERY ACTIVITY TYPE):
- Put ALL task directions and "how to complete this" language ONLY in each section's "instructions" string (one clear directions block per section that needs it).
- Student-facing fields must contain ONLY content students interact with (question stems, vocabulary, sortable items for cut/sort activities, etc.). Do NOT pre-fill organizer student-response JSON (see BLANK ORGANIZER WORKSHEET MODE below).
- NEVER put meta-directions inside: questions[].text / prompt, cut_and_sort "items", picture_sort "cards", Frayer q1Content–q4Content (leave empty), story_map fields[].content, sequence_chart steps[].content, or observation_sheet sections[] when those should be blank for students.
- Forbidden inside student data arrays and organizer cells: phrases like "Sort these as…", "Sort these into…", "Write in the center…", "Label each part…", "Put each card…", "Draw a picture in this box" (those belong in "instructions" only).
- Do NOT duplicate the same direction sentence in both "instructions" and a question stem or item string.
- For cut_and_sort / picture_sort: "categories" are SHORT category names only (e.g. "Clues", "Not clues"). "items" / "cards" are ONLY the movable words or phrases — never a full sentence of directions.

BLANK ORGANIZER WORKSHEET MODE (STIMULUS vs STUDENT RESPONSE — CRITICAL):
- STIMULUS (AI-generated; keep filled): sequence steps[].title (stage/short labels), timeline events[].label (event captions), mind map centerTerm (main topic or title for the map), Venn leftItems/rightItems/centerItems (short sortable terms OR leave empty and add a word_bank section OR list words in section.instructions), passages, word banks, matching pairs, question stems, section titles.
- STUDENT RESPONSE (must stay blank in JSON): sequence steps[].content, timeline events[].content, story_map fields[].content, Frayer q1Content–q4Content, mind map branches ("" per slot), mini book panels[].prompt.
- Do NOT put model answers, completed paragraphs, or "example student writing" in response fields. Long explanations belong in section.instructions for teachers or in stimulus fields, not in steps[].content / events[].content.
- Venn: use short terms/phrases in item arrays as sort stimulus, OR include a separate word_bank section with 6–8 words, OR list words in instructions — students must have something to work from.
- Mind map: centerTerm = the worksheet topic or concise map title (stimulus). branches = "" only (students add ideas).
- KWL: knowItems, wantItems, learnedItems MUST each be [] (empty arrays); ruled columns are for writing.
- Frayer model: q1Content, q2Content, q3Content, q4Content MUST all be "".
- Story map: every fields[].content MUST be "" (structural labels only in "label").
- Mini book: panels[].prompt MUST be "".

SENTENCE FRAMES & WRITTEN RESPONSES:
- sentence_frames: each frames[].stem MUST be a scaffold with blanks (____ or …) or a short stem ending in an obvious fill-in — NOT a completed paragraph, model answer, or "because…" full explanation. Put rubrics or examples in section.instructions only.
- questions (short_answer, essay, fill_in_blank): "text" / "prompt" MUST be the task only. Do NOT append "Example answer:", "Sample response:", "Model answer:", or full worked examples after the question — those belong in section.instructions for teachers only.
`;

function stripQuestionDuplicateOfInstructions(
  questionText: string,
  instructions: string | undefined | null,
): string {
  const ins = (instructions ?? "").trim();
  if (!ins) return (questionText ?? "").trim();
  const qt = (questionText ?? "").trim();
  if (!qt) return "";
  if (qt === ins) return "";
  if (qt.startsWith(ins + "\n\n")) return qt.slice(ins.length + 2).trim();
  if (qt.startsWith(ins + "\n")) return qt.slice(ins.length + 1).trim();
  return questionText ?? "";
}

function mergeInstructionStrings(existing: unknown, additions: string[]): string | undefined {
  const e = typeof existing === "string" ? existing.trim() : "";
  const extra = [...new Set(additions.map((a) => a.trim()).filter(Boolean))].filter(
    (p) => p && !e.includes(p),
  );
  if (!extra.length) return e || undefined;
  const tail = extra.join("\n\n");
  if (!e) return tail;
  return `${e}\n\n${tail}`;
}

/** True when a single cell/line is clearly a direction, not vocabulary to sort or classify. */
function cellLooksLikeInstructionOnly(t: string): boolean {
  const s = t.trim();
  if (s.length < 8) return false;
  return (
    /^sort\s+these\b/i.test(s) ||
    /^write\s+in\s+the\s+(center|middle)\b/i.test(s) ||
    /^label\s+each\s+(part|picture|box|diagram|one|number)\b/i.test(s) ||
    /^put\s+each\s+(card|item|word)\b/i.test(s) ||
    /^place\s+each\s+(card|item)\b/i.test(s) ||
    /^cut\s+out\s+and\s+sort\b/i.test(s) ||
    /^circle\s+each\b/i.test(s) ||
    /^draw\s+(a|an|the)\s+picture\s+in\s+this\b/i.test(s) ||
    /^write\s+your\s+(answer|ideas|response)\s+here\b/i.test(s)
  );
}

function hoistFromStringCell(cell: string, bucket: string[]): string {
  const t = String(cell ?? "").trim();
  if (!t) return "";
  const lines = t.split(/\r?\n/);
  if (lines.length > 1) {
    const first = lines[0].trim();
    if (cellLooksLikeInstructionOnly(first)) {
      bucket.push(first);
      return lines.slice(1).join("\n").trim();
    }
    return t;
  }
  if (cellLooksLikeInstructionOnly(t)) {
    bucket.push(t);
    return "";
  }
  return t;
}

/** Narrow: only hoists common sorting/setup lines mistakenly pasted into question stems (not science/math "Draw…" tasks). */
function hoistLeadInstructionFromQuestionStem(text: string, bucket: string[]): string {
  const t = String(text ?? "").trim();
  if (!t) return "";
  const firstLine = t.split(/\r?\n/)[0]?.trim() ?? "";
  if (
    /^(sort\s+these\s+(as|into)|write\s+in\s+the\s+center|cut\s+out\s+and\s+sort|put\s+each\s+card)/i.test(
      firstLine,
    )
  ) {
    bucket.push(firstLine);
    return t.split(/\r?\n/).slice(1).join("\n").trim();
  }
  return t;
}

/**
 * Post-process AI JSON: move instructional copy out of student fields into section.instructions.
 * Does not change layout; only reassigns strings.
 */
function hoistInstructionalLanguageToSectionInstructions(worksheet: any): void {
  if (!worksheet?.sections || !Array.isArray(worksheet.sections)) return;

  for (const s of worksheet.sections) {
    if (!s || typeof s !== "object") continue;
    const bucket: string[] = [];
    let ins = typeof s.instructions === "string" ? s.instructions.trim() : "";

    const mapStrArray = (arr: unknown): unknown => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((x) => (typeof x === "string" ? hoistFromStringCell(x, bucket) : x));
    };

    if (Array.isArray(s.items)) s.items = mapStrArray(s.items) as string[];
    if (Array.isArray(s.cards)) s.cards = mapStrArray(s.cards) as string[];
    if (Array.isArray(s.leftItems)) s.leftItems = mapStrArray(s.leftItems) as string[];
    if (Array.isArray(s.rightItems)) s.rightItems = mapStrArray(s.rightItems) as string[];
    if (Array.isArray(s.centerItems)) s.centerItems = mapStrArray(s.centerItems) as string[];

    for (const key of ["q1Content", "q2Content", "q3Content", "q4Content"] as const) {
      if (typeof s[key] === "string") {
        s[key] = hoistFromStringCell(s[key], bucket);
      }
    }

    if (s.type === "story_map" && Array.isArray(s.fields)) {
      s.fields = s.fields.map((f: any) => ({
        ...f,
        content: typeof f?.content === "string" ? hoistFromStringCell(f.content, bucket) : f?.content,
      }));
    }

    if (Array.isArray(s.steps)) {
      s.steps = s.steps.map((st: any) => ({
        ...st,
        content: typeof st?.content === "string" ? hoistFromStringCell(st.content, bucket) : st?.content,
      }));
    }

    if (Array.isArray(s.events)) {
      s.events = s.events.map((ev: any) => ({
        ...ev,
        content: typeof ev?.content === "string" ? hoistFromStringCell(ev.content, bucket) : ev?.content,
      }));
    }

    if (Array.isArray(s.branches)) {
      s.branches = mapStrArray(s.branches) as string[];
    }

    if (Array.isArray(s.sections) && s.type === "observation_sheet") {
      s.sections = mapStrArray(s.sections);
    }

    if (Array.isArray(s.questions)) {
      s.questions = s.questions.map((q: any) => {
        const raw = String(q?.text ?? q?.prompt ?? "");
        let next = stripQuestionDuplicateOfInstructions(raw, ins);
        next = hoistLeadInstructionFromQuestionStem(next, bucket);
        const merged = { ...q, text: next, prompt: next };
        return merged;
      });
    }

    const merged = mergeInstructionStrings(s.instructions, bucket);
    if (merged !== undefined) s.instructions = merged;
  }
}

/** True if string looks like a definition / explanation, not a short label. */
function looksLikeTeachingParagraph(s: string): boolean {
  const t = s.trim();
  if (t.length < 36) return false;
  if (/\.\s+[A-Z]/.test(t)) return true;
  if (t.split(/\s+/).length > 16) return true;
  return false;
}

/** Stems meant for students to complete should include a blank or ellipsis scaffold. */
function sentenceFrameHasStudentBlank(stem: string): boolean {
  return /_{2,}|\.{3,}|(\[[\s_]{1,12}\])|(\s+___+\s?)/.test(stem);
}

/** Remove teacher-only example blocks often appended to question stems. */
function stripExampleBlocksFromQuestionText(text: string): string {
  const t = String(text ?? "");
  const cut = t.search(
    /\n\n\s*(Example\s+(answer|response)|Sample\s+(answer|response)|Model\s+(answer|response)|Answer\s*:|Teacher\s+note|Possible\s+response)\s*[:\-]/i,
  );
  if (cut === -1) return t;
  return t.slice(0, cut).trimEnd();
}

/** Remove trailing blocks that look like solved answers or teacher keys (conservative). */
function stripAnswerLeakSuffixes(text: string): string {
  let t = String(text ?? "");
  t = t.replace(
    /\n\n\s*(One possible answer|A possible answer|Sample solution|Correct answer|Answer key)\s*[:\-][\s\S]*$/i,
    "",
  );
  t = t.replace(/\n\n\s*(Example\s*:\s*)[^\n]+$/i, "");
  return t.trimEnd();
}

/**
 * If the last paragraph looks like a standalone declarative "model answer" (no question), drop it.
 */
function stripTrailingDeclarativeAnswerLeak(text: string): string {
  const parts = text.split(/\n\n+/);
  if (parts.length < 2) return text;
  const last = parts[parts.length - 1].trim();
  if (
    last.length >= 12 &&
    last.length < 220 &&
    !/\?/.test(last) &&
    /^[A-Z][^.!?]*\.\s*$/.test(last) &&
    /^(It|They|This|That|She|He|We|Because|Since|Therefore)\b/.test(last)
  ) {
    return parts.slice(0, -1).join("\n\n").trimEnd();
  }
  return text;
}

/** Full sanitization for student-facing question stems (no model answers in the stem). */
function sanitizeStudentFacingQuestionText(text: string): string {
  let t = stripExampleBlocksFromQuestionText(text);
  t = stripAnswerLeakSuffixes(t);
  t = stripTrailingDeclarativeAnswerLeak(t);
  return t.trim();
}

function worksheetHasNonEmptyPassage(worksheet: any): boolean {
  if (!worksheet?.sections || !Array.isArray(worksheet.sections)) return false;
  return worksheet.sections.some(
    (s: any) =>
      s &&
      s.type === "passage" &&
      typeof s.passage === "string" &&
      s.passage.trim().length > 0,
  );
}

function passageReferenceDetected(text: string): boolean {
  const t = String(text ?? "");
  if (!t.trim()) return false;
  const lower = t.toLowerCase();
  return (
    /\bpassage\b/.test(lower) ||
    /\baccording to\b/.test(lower) ||
    /\bthe story\b/.test(lower) ||
    /\bin the story\b/.test(lower) ||
    /\bfrom the story\b/.test(lower) ||
    /\bthe text\b/.test(lower) ||
    /\bin the text\b/.test(lower) ||
    /\bfrom the text\b/.test(lower) ||
    /\bread the (passage|story)\b/i.test(t) ||
    /\bwhat the (passage|story)\s+says\b/i.test(lower) ||
    /\bwhat the text\s+says\b/i.test(lower)
  );
}

/** Rewrite passage-dependent wording so questions do not assume unseen source material. */
function rewritePassageDependencyPhrases(text: string): string {
  let s = String(text ?? "");
  const pairs: [RegExp, string][] = [
    [/\baccording to the passage\b/gi, "Based on what you know about the topic"],
    [/\baccording to this passage\b/gi, "Based on what you know about the topic"],
    [/\baccording to the text\b/gi, "Based on what you know about the topic"],
    [/\baccording to the story\b/gi, "Based on what you know about the topic"],
    [/\bin the passage\b/gi, "in your response"],
    [/\bread the passage\.?\s*/gi, ""],
    [/\bread the story\.?\s*/gi, ""],
    [/\bthe passage says\b/gi, "Explain"],
    [/\bthe text says\b/gi, "Explain"],
    [/\bthe story says\b/gi, "Explain"],
    [/\bfrom the passage\b/gi, "from your learning"],
    [/\bfrom the text\b/gi, "from your learning"],
    [/\bfrom the story\b/gi, "from your learning"],
    [/\buse (details|evidence) from the passage\b/gi, "use details and examples"],
    [/\buse (details|evidence) from the text\b/gi, "use details and examples"],
    [/\buse (details|evidence) from the story\b/gi, "use details and examples"],
    [/\brefer to the passage\b/gi, "explain"],
    [/\brefer to the text\b/gi, "explain"],
    [/\bground your answer in the passage\b/gi, "support your answer with reasons"],
    [/\bground your answer in the text\b/gi, "support your answer with reasons"],
  ];
  for (const [re, repl] of pairs) {
    s = s.replace(re, repl);
  }
  return s.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

/**
 * If any instructions or questions reference a passage/story/text but no passage section exists,
 * rewrite those strings to standalone prompts (does not generate passage content).
 */
function ensurePassageIntegrityOrRewriteQuestions(worksheet: any): void {
  if (!worksheet?.sections || !Array.isArray(worksheet.sections)) return;
  if (worksheetHasNonEmptyPassage(worksheet)) return;

  for (const s of worksheet.sections) {
    if (!s || typeof s !== "object") continue;
    if (typeof s.instructions === "string" && passageReferenceDetected(s.instructions)) {
      s.instructions = rewritePassageDependencyPhrases(s.instructions);
    }
    if (Array.isArray(s.questions)) {
      s.questions = s.questions.map((q: any) => {
        const raw = String(q?.text ?? q?.prompt ?? "");
        if (!passageReferenceDetected(raw)) return q;
        const next = rewritePassageDependencyPhrases(raw);
        return { ...q, text: next, prompt: next };
      });
    }
  }
}

function sanitizeWorksheetQuestionTexts(worksheet: any): void {
  if (!worksheet?.sections || !Array.isArray(worksheet.sections)) return;
  for (const s of worksheet.sections) {
    if (!Array.isArray(s.questions)) continue;
    s.questions = s.questions.map((q: any) => {
      const raw = String(q?.text ?? q?.prompt ?? "");
      const sanitized = sanitizeStudentFacingQuestionText(raw);
      if (sanitized === raw) return q;
      return { ...q, text: sanitized, prompt: sanitized };
    });
  }
}

/**
 * Clear pre-filled content from true student-response fields only (post-AI).
 * Preserves stimulus: steps[].title, events[].label, mind map centerTerm, Venn sort terms (trimmed).
 */
function clearStudentWritingCellsFromWorksheet(worksheet: any, topic?: string): void {
  if (!worksheet?.sections || !Array.isArray(worksheet.sections)) return;

  const trimVennItem = (x: unknown): string => {
    if (typeof x !== "string") return "";
    const t = x.trim();
    if (!t) return "";
    if (looksLikeTeachingParagraph(t) || t.length > 72) return "";
    return t;
  };

  for (const s of worksheet.sections) {
    if (!s || typeof s !== "object") continue;

    if (s.type === "frayer_model") {
      for (const k of ["q1Content", "q2Content", "q3Content", "q4Content"] as const) {
        s[k] = "";
      }
    }

    if (s.type === "story_map" && Array.isArray(s.fields)) {
      s.fields = s.fields.map((f: any) => ({ ...f, content: "" }));
    }

    if (s.type === "sequence_chart" && Array.isArray(s.steps)) {
      s.steps = s.steps.map((st: any) => ({
        ...st,
        content: "",
      }));
    }

    if (s.type === "timeline" && Array.isArray(s.events)) {
      s.events = s.events.map((ev: any) => ({
        ...ev,
        content: "",
      }));
    }

    if (s.type === "mini_book" && Array.isArray(s.panels)) {
      s.panels = s.panels.map((p: any) => ({ ...p, prompt: "" }));
    }

    if (s.type === "mind_map") {
      if (Array.isArray(s.branches)) {
        s.branches = s.branches.map(() => "");
      }
    }

    if (s.type === "venn_diagram") {
      if (Array.isArray(s.leftItems)) s.leftItems = s.leftItems.map(trimVennItem);
      if (Array.isArray(s.rightItems)) s.rightItems = s.rightItems.map(trimVennItem);
      if (Array.isArray(s.centerItems)) s.centerItems = s.centerItems.map(trimVennItem);
      const hasItems =
        [...(s.leftItems || []), ...(s.rightItems || []), ...(s.centerItems || [])].some(
          (x) => typeof x === "string" && x.trim(),
        );
      const hasWordBankElsewhere = worksheet.sections.some(
        (sec: any) => sec && sec.type === "word_bank" && Array.isArray(sec.words) && sec.words.length > 0,
      );
      if (!hasItems && !hasWordBankElsewhere && topic && String(topic).trim()) {
        const t = String(topic).trim();
        const words = t.split(/\s+/).filter((w) => w.length > 1).slice(0, 8);
        const line =
          words.length > 0
            ? `Word bank: ${words.join(", ")} — sort these into the diagram.`
            : `Word bank: add 6–8 topic-related terms for students to sort into the diagram.`;
        const merged = mergeInstructionStrings(s.instructions, [line]);
        if (merged !== undefined) s.instructions = merged;
      }
    }

    if (s.type === "kwl_chart") {
      s.knowItems = [];
      s.wantItems = [];
      s.learnedItems = [];
    }

    if (s.type === "sentence_frames" && Array.isArray(s.frames)) {
      s.frames = s.frames.map((f: any) => {
        const stem = typeof f?.stem === "string" ? f.stem : "";
        const trimmed = stem.trim();
        if (
          trimmed &&
          looksLikeTeachingParagraph(trimmed) &&
          !sentenceFrameHasStudentBlank(trimmed)
        ) {
          return { ...f, stem: "" };
        }
        return f;
      });
    }
  }
}

/** Quick Gen slots A/B/C map to fixed page layouts returned to clients. */
function pageLayoutForSlot(slot: string | undefined): "standard" | "boxed" | "two_column" {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "boxed";
  if (s === "C") return "two_column";
  return "standard";
}

function pedagogicalModeForSlot(
  slot: string | undefined
): "standard_practice" | "interactive_exploration" | "visual_application" {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "interactive_exploration";
  if (s === "C") return "visual_application";
  return "standard_practice";
}

function pedagogicalTitleForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "Interactive Exploration";
  if (s === "C") return "Visual Application";
  return "Standard Practice";
}

/** Pedagogical intent — must pair with layoutVariant A/B/C (Standard / Interactive / Visual). */
function buildPedagogicalHeader(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  const layout = pageLayoutForSlot(slot);
  if (s === "B") {
    return `PEDAGOGICAL MODE — INTERACTIVE EXPLORATION (worksheet layout: "${layout}"):
- REQUIRED TONE: Use discussion- and reasoning-oriented language where the activity type allows (e.g., explain your thinking, justify with evidence, agree/disagree, compare two ideas, "what would change if…").
- Include at least one prompt that explicitly asks students to reason or explain (not only recall a fact), when compatible with the schema.
- Do NOT use partner/turn-and-talk framing as empty decoration—tie it to a real reasoning task.
- Do NOT replicate Option A with extra boxes; change the cognitive demand, not only the layout.`;
  }
  if (s === "C") {
    return `PEDAGOGICAL MODE — VISUAL APPLICATION (worksheet layout: "${layout}"):
- REQUIRED: Students must engage with something visibly spatial or organized—diagram, label, sketch, model, sort/classify into categories, chart, table, two-column organizer, or number line—whenever the activity type can support it.
- Question stems and/or section instructions should name the visual action (draw, label, sort, complete the table, represent).
- Avoid a wall of text-only short answers; restructure tasks so at least one item is inherently visual or tabular.
- Do NOT duplicate A or B with tighter spacing only—change what students produce (a picture, table, or sorted set), not only formatting.`;
  }
  return `PEDAGOGICAL MODE — STANDARD PRACTICE (worksheet layout: "${layout}"):
- Direct skill practice: efficient, straightforward prompts; students apply the skill without extra discussion framing.
- Do NOT add partner work, turn-and-talk, "discuss with a partner," or open-ended debate-style prompts (those belong in Option B).
- Keep stems concise and procedural; focus on correct application, fluency, and clarity—not metacognitive essays unless the activity type demands a brief explanation.
- Must differ from B and C in both wording and what students are asked to do (task structure), not only line count.`;
}

function buildPedagogicalShortDescription(
  layoutVariant: string | undefined,
  topic: string,
  activityType: string
): string {
  const t = (topic || "the topic").trim();
  const s = (layoutVariant || "A").toUpperCase();
  if (s === "B") {
    return `Students explain and defend ideas about ${t} (${activityType})—reasoning, evidence, and “how do you know?” prompts, not just recall.`;
  }
  if (s === "C") {
    return `Students represent ${t} visually (${activityType})—draw, label, sort, chart, or model so thinking is visible on the page.`;
  }
  return `Efficient skill work on ${t} (${activityType})—clear, direct tasks for independent practice without extra discussion framing.`;
}

function pedagogicalSkillFocusForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B")
    return "Oral and written reasoning: justify claims, compare ideas, and use evidence- or sense-making language";
  if (s === "C")
    return "Visual sense-making: organize, represent, and classify information using models, diagrams, or tables";
  return "Procedural fluency: accurate, efficient practice with straightforward expectations";
}

function pedagogicalIntentForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "Surface student thinking and discourse-ready prompts teachers can use for pairs or whole-group discussion";
  if (s === "C") return "Make abstract ideas concrete—ideal when you want drawing, sorting, or graphic organization on the worksheet";
  return "Core practice and quick checks—best for homework, stations, or a no-frills skills block";
}

/** Hidden content-type flag for Quick Gen (prompt-only; not emitted in JSON). */
function buildQuickGenContentTypeFlag(slot: string | undefined): string {
  if (!slot) return "";
  const s = (slot || "A").toUpperCase();
  if (s === "B") {
    return `
HIDDEN CONTENT-TYPE FLAG (do NOT output this label in JSON; use ONLY to guide style): reasoning_set
Generate this worksheet as a reasoning_set: metacognitive and justification-heavy compared to problem_set and visual_set.`;
  }
  if (s === "C") {
    return `
HIDDEN CONTENT-TYPE FLAG (do NOT output this label in JSON; use ONLY to guide style): visual_set
Generate this worksheet as a visual_set: at least one required visual/organizational task (draw, label, sort, table, diagram, or model) in the written prompts.`;
  }
  return `
HIDDEN CONTENT-TYPE FLAG (do NOT output this label in JSON; use ONLY to guide style): problem_set
Generate this worksheet as a problem_set: direct practice first; almost no explanation prompts (see HARD STRUCTURE RULES).`;
}

/** Slot-specific math content rules (paired with MATH_LAYOUT_VARIANTS). */
function mathContentRulesForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") {
    return `MATH CONTENT — OPTION B (REQUIRED; must differ from A and C):
- MUST include explanation/reasoning language on at least 50% of items: e.g., "Explain how you know," "Show your strategy," "Why does this work?" (sub-prompt or second line is OK).
- Word problems or equations must still be solved; reasoning is in addition, not a substitute for math.
- Do NOT reuse the same numeric setups as Option A—change values/contexts.`;
  }
  if (s === "C") {
    return `MATH CONTENT — OPTION C (REQUIRED; must differ from A and B):
- MUST include at least ONE item that explicitly requires one of: number line, table, drawn model, tape diagram, or "draw / sketch / represent" the situation—the words must appear in the question text or instructions.
- Remaining items may be symbolic or verbal, but the set must be unmistakably visual_set, not Option A in two columns.`;
  }
  return `MATH CONTENT — OPTION A (REQUIRED; must differ from B and C):
- Equations only (for math_practice) or straight solve-and-answer story problems (for math_word_problems): answer blanks and computation.
- Do NOT add explanation prompts except at most ONE optional brief "check" across the entire section; no "explain how you know" on every item.`;
}

/** Slot-specific science_concept_practice content rules (paired with SCIENCE_CONCEPT_LAYOUT_VARIANTS). */
function scienceConceptContentRulesForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") {
    return `SCIENCE CONCEPT — OPTION B (science_short_response) — REQUIRED:
- You MUST include all three stem types (use three different questions, or combine only if the activity schema forces fewer items—then prioritize these phrases in order): (1) a "Why…" question, (2) a "How do you know…" question, (3) an "Explain your reasoning…" question (exact wording may vary slightly but each phrase must appear visibly).
- At least 50% of all questions must be reasoning-oriented (not vocabulary-only).`;
  }
  if (s === "C") {
    return `SCIENCE CONCEPT — OPTION C (science_short_response + instructions) — REQUIRED:
- MUST include at least ONE task that is explicitly a sorting task OR a table to complete OR a diagram instruction (sketch, label, arrows, cycle)—state it plainly in the question text or section "instructions" field.
- Do not satisfy this with prose alone; students must produce or fill a visible structure.`;
  }
  return `SCIENCE CONCEPT — OPTION A:
- Direct short-response: recall, define, identify—no mandatory "Why/How do you know" chain on every item; at most one optional brief explanation prompt if needed.`;
}

// Layout variant instructions — same activity type, different presentation (Quick Gen A/B/C = Standard Practice / Interactive Exploration / Visual Application)
const VARIANT_INSTRUCTIONS: Record<string, string> = {
  A: `QUICK GEN — OPTION A / STANDARD LAYOUT ("standard"):
- Minimal structure: fewest boxes, borders, and labeled regions; one clear vertical flow (matches Standard Practice).
- Comfortable spacing between items; avoid redundant sub-headers unless the activity type requires them.
- Keep grouping simple (single column or one obvious grouping pattern).`,

  B: `QUICK GEN — OPTION B / BOXED LAYOUT ("boxed"):
- More structure: extra labeled boxes, step labels ("Part 1", "Step 2"), hints, or short cues beside prompts (matches Interactive Exploration).
- Clear visual grouping (bordered bands, rows, or columns) so students see where to write each part.
- Prefer guided sub-steps over a single open block when the activity type allows multiple prompts.`,

  C: `QUICK GEN — OPTION C / TWO-COLUMN LAYOUT ("two_column"):
- Tighter vertical rhythm with two-column or side-by-side organization where possible (matches Visual Application).
- Prefer denser arrangements (two columns, tables, stacked rows, or diagram + response column) when compatible with the activity type.
- Shorter writing lines / fewer lines per prompt where appropriate; maximize content per page.`,
};

/** Quick Gen: diagram activities — A/B/C must look clearly different on the page. */
const DIAGRAM_LAYOUT_VARIANTS: Record<string, string> = {
  A: `QUICK GEN DIAGRAM — OPTION A (CENTER + BANK BELOW):
- One main column. The diagram/schematic occupies the UPPER-CENTER (large, ~half the section height) with numbered markers (1–N) ON the drawing.
- Word bank in a full-width boxed row BELOW the diagram (terms may be shuffled).
- Students write labels on the diagram or on short lines directly under the diagram keyed to numbers.
- Do NOT use a side-by-side diagram + label column in this variant.`,

  B: `QUICK GEN DIAGRAM — OPTION B (DIAGRAM LEFT + LABELS RIGHT):
- Two-column layout: LEFT ~55%: diagram with numbers; RIGHT: vertical answer list "1. _____" … "N. _____".
- Word bank optional in a compact box under the right column OR spanning the bottom.
- The diagram stays LEFT; all written responses go RIGHT.`,

  C: `QUICK GEN DIAGRAM — OPTION C (TOP + CALLOUTS):
- TOP half: wide diagram with numbered CALLOUT bubbles around the TOP and SIDES (perimeter), like a cycle or process.
- BOTTOM half: lines or small table matching each number to its vocabulary term.
- Use arrows between stages when the topic is a cycle or process.`,
};

/** Quick Gen: math practice — distinct spatial rhythm for A/B/C. */
const MATH_LAYOUT_VARIANTS: Record<string, string> = {
  A: `QUICK GEN MATH — OPTION A (SPACIOUS):
- One column, generous vertical space between problems (clear separation).
- Each item: 4–6 workspace lines unless a single blank suffices.
- Avoid dense grids; prioritize readability.
- CONTENT: Straight solve; see "MATH CONTENT — OPTION A" in the same message for wording rules.`,

  B: `QUICK GEN MATH — OPTION B (SCAFFOLDED WORK BOXES):
- Wrap EACH problem in its own bordered "work box" with a small "Problem n" header and workspace lines inside the box.
- Optional brief hint under the stem for 1–2 items (smaller text).
- CONTENT: Reasoning layer; see "MATH CONTENT — OPTION B" in the same message.`,

  C: `QUICK GEN MATH — OPTION C (COMPACT GRID):
- Arrange problems in TWO columns when there are 4+ items (single column on very short content is OK).
- Tighter vertical spacing; 2–3 workspace lines per item unless the problem needs more.
- Fit more items per page without shrinking fonts below grade-appropriate readability.
- CONTENT: Visual/model phrasing; see "MATH CONTENT — OPTION C" in the same message.`,
};

/** Quick Gen: science_concept_practice — word bank + short response; must feel different by slot. */
const SCIENCE_CONCEPT_LAYOUT_VARIANTS: Record<string, string> = {
  A: `QUICK GEN SCIENCE CONCEPT — OPTION A (CLEAN):
- Word bank: one simple bordered strip (minimal internal boxes).
- Questions: 4 short-answer items, generous line counts (lines: 4–5 each), clear spacing between questions.
- No per-question boxes; keep the response area open and uncluttered.
- CONTENT: Direct science explanations; see "SCIENCE CONCEPT — OPTION A" in the same message.`,

  B: `QUICK GEN SCIENCE CONCEPT — OPTION B (SCAFFOLDED):
- Word bank: clearly boxed with a "Vocabulary" sub-header.
- Questions: 5–6 items; EACH question in its own bordered region with "Question n" label.
- Add a brief hint or vocabulary reminder line under 2–3 stems (smaller text). Use lines: 3–4 per question.
- CONTENT: At least one reasoning/discussion stem required; see "SCIENCE CONCEPT — OPTION B" in the same message.`,

  C: `QUICK GEN SCIENCE CONCEPT — OPTION C (COMPACT):
- Word bank: compact row or two-column chip layout to save vertical space.
- Questions: 6–8 shorter items; lines: 2 per question where possible; tighter spacing between items.
- Prefer a two-column layout for questions when there are 6+ items.
- CONTENT: At least one visual/modeling/classification-style task required; see "SCIENCE CONCEPT — OPTION C" in the same message.`,
};

/** Quick Gen: graphic organizers & timelines — vary density and scaffolding in JSON. */
const ORGANIZER_LAYOUT_VARIANTS: Record<string, string> = {
  A: `QUICK GEN ORGANIZER — OPTION A (CLEAN):
- Fewest boxes: prefer single main organizer with standard rowCount / branchCount (moderate).
- Light labels only; avoid extra "helper" rows beyond what the activity type needs.`,

  B: `QUICK GEN ORGANIZER — OPTION B (SCAFFOLDED):
- Add structure: extra labeled rows, "My ideas" / "Evidence" style sub-headers where appropriate.
- Higher rowCount or more branches than A; include brief printed cues in cells or step titles.`,

  C: `QUICK GEN ORGANIZER — OPTION C (COMPACT):
- Denser grid: maximize rows/branches/steps that fit; tighter spacing cues in text ("brief", "one word").
- Smaller per-cell writing expectations where the schema allows (still grade-appropriate).`,
};

/** Quick Gen: matching / sorting / games — vary pairs, grids, and scaffolding. */
const MATCHING_LAYOUT_VARIANTS: Record<string, string> = {
  A: `QUICK GEN MATCHING — OPTION A (CLEAN):
- Fewer pairs/items than other options when the activity allows (e.g. 4–5 pairs): clear columns, minimal extra labels.
- Single straightforward layout (one matching block).`,

  B: `QUICK GEN MATCHING — OPTION B (SCAFFOLDED):
- More items (e.g. 6–8 pairs) with column headers ("Term" / "Definition") and a short "How to match" line.
- Optional numbered steps at the top explaining the task.`,

  C: `QUICK GEN MATCHING — OPTION C (COMPACT):
- Maximum items that still fit (e.g. 8–10 pairs or a denser grid); tighter table-style presentation.
- Reduce empty margin language; keep instructions to one line when possible.`,
};

type LayoutVariantFamily = "diagram" | "math" | "science_concept" | "organizer" | "matching" | "default";

function layoutVariantFamily(activityType: string | undefined): LayoutVariantFamily {
  const a = String(activityType ?? "").trim();
  if (["label_diagram", "observation_sheet", "map_activity"].includes(a)) return "diagram";
  if (
    ["math_practice", "math_word_problems", "number_bond", "ten_frame", "graph_page", "measurement", "clock_practice"].includes(a)
  )
    return "math";
  if (a === "science_concept_practice") return "science_concept";
  if (
    ["sequence_chart", "timeline", "kwl_chart", "mind_map", "venn_diagram", "frayer_model", "story_map", "mini_book"].includes(a)
  )
    return "organizer";
  if (
    ["line_matching", "cut_and_sort", "word_search", "bingo_card", "picture_sort", "crossword"].includes(a)
  )
    return "matching";
  return "default";
}

function buildLayoutVariantInstruction(activityType: string | undefined, layoutVariant: string | undefined): string {
  if (!layoutVariant) return "";
  const lv = layoutVariant.toUpperCase();
  const ped = buildPedagogicalHeader(layoutVariant);
  const fam = layoutVariantFamily(activityType);
  let spatial = "";
  if (fam === "diagram") {
    spatial = DIAGRAM_LAYOUT_VARIANTS[lv] ?? VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  } else if (fam === "math") {
    spatial = MATH_LAYOUT_VARIANTS[lv] ?? VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  } else if (fam === "science_concept") {
    spatial = SCIENCE_CONCEPT_LAYOUT_VARIANTS[lv] ?? VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  } else if (fam === "organizer") {
    spatial = ORGANIZER_LAYOUT_VARIANTS[lv] ?? VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  } else if (fam === "matching") {
    spatial = MATCHING_LAYOUT_VARIANTS[lv] ?? VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  } else {
    spatial = VARIANT_INSTRUCTIONS[layoutVariant] ?? "";
  }
  return `\n${ped}\n\n${spatial}\n`;
}

function labelDiagramLayoutEnumForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "diagram_left_labels_right";
  if (s === "C") return "diagram_top_callouts";
  return "centered_bank_below";
}

function mathPracticeLayoutEnumForSlot(slot: string | undefined): string {
  const s = (slot || "A").toUpperCase();
  if (s === "B") return "scaffolded_work_boxes";
  if (s === "C") return "compact_grid";
  return "spacious";
}

/** Force layout JSON so A/B/C stay visually distinct even if the model drifts. */
function applyLayoutVariantEnforcement(worksheet: any, slot: string | undefined, topicHint?: string): void {
  if (!slot || !worksheet?.sections || !Array.isArray(worksheet.sections)) return;
  const rhythm = mathPracticeLayoutEnumForSlot(slot);
  const hint = (topicHint || "").trim();

  for (const s of worksheet.sections) {
    if (!s || typeof s !== "object") continue;

    if (s.type === "label_diagram") {
      s.diagramLayout = labelDiagramLayoutEnumForSlot(slot);
      const subj = typeof s.subject === "string" ? s.subject.trim() : "";
      if (!s.diagramSubject || !String(s.diagramSubject).trim()) {
        s.diagramSubject = subj || hint;
      }
      if (!subj && (typeof s.diagramSubject === "string" && s.diagramSubject.trim())) {
        s.subject = s.diagramSubject.trim();
      } else if (!subj && hint) {
        s.subject = hint;
      }
    }

    if (s.type === "math_practice" || s.type === "math_word_problems") {
      s.mathPracticeLayout = rhythm;
      if (Array.isArray(s.questions)) {
        s.questions = s.questions.map((q: any) => {
          const base = typeof q?.lines === "number" ? q.lines : 3;
          const lines =
            rhythm === "compact_grid"
              ? Math.min(Math.max(base, 2), 2)
              : rhythm === "spacious"
                ? Math.max(base, 4)
                : Math.min(Math.max(base, 3), 4);
          return { ...q, lines };
        });
      }
    }

    if (s.type === "science_short_response") {
      s.layoutRhythm = rhythm;
      if (Array.isArray(s.questions)) {
        s.questions = s.questions.map((q: any) => {
          const base = typeof q?.lines === "number" ? q.lines : 4;
          const lines =
            rhythm === "compact_grid"
              ? Math.min(Math.max(base, 2), 2)
              : rhythm === "spacious"
                ? Math.max(base, 5)
                : Math.min(Math.max(base, 3), 4);
          return { ...q, lines };
        });
      }
    }
  }
}

const MIN_MATH_QUESTIONS = 4;

function expandQuestionTypeFilters(types: string[]): Set<string> {
  const s = new Set<string>();
  for (const raw of types) {
    const t = String(raw).toLowerCase().trim();
    if (t === "reasoning") {
      s.add("essay");
      s.add("short_answer");
    } else if (t === "visual") {
      s.add("short_answer");
      s.add("multiple_choice");
    } else if (
      ["multiple_choice", "short_answer", "true_false", "fill_in_blank", "essay"].includes(t)
    ) {
      s.add(t);
    }
  }
  return s;
}

/** When options.questionTypes is non-empty, drop questions whose question_type is not allowed. Skips if it would violate section minimums. */
function filterWorksheetQuestionsByTypes(worksheet: any, questionTypes: string[]): void {
  const allowed = expandQuestionTypeFilters(questionTypes);
  if (allowed.size === 0 || !worksheet?.sections || !Array.isArray(worksheet.sections)) return;
  for (const sec of worksheet.sections) {
    if (!sec || !Array.isArray(sec.questions) || sec.questions.length === 0) continue;
    const filtered = sec.questions.filter((q: any) =>
      allowed.has(String(q?.question_type || "short_answer").toLowerCase())
    );
    const min =
      sec.type === "math_practice" || sec.type === "math_word_problems"
        ? MIN_MATH_QUESTIONS
        : sec.type === "science_short_response"
          ? 2
          : 1;
    if (filtered.length >= min) sec.questions = filtered;
  }
}

const REGEN_MATH_QUESTION_TEXT = "<REGENERATE IF EMPTY — DO NOT INSERT GENERIC PROBLEMS>";
const REGEN_SCIENCE_QUESTION_TEXT = "<REGENERATE SCIENCE QUESTION — DO NOT USE TEMPLATE>";
const MISSING_QUESTION_TEXT = "<MISSING CONTENT — REQUIRES AI REGEN>";
const REGEN_INSTRUCTION_PLACEHOLDER = "<REGENERATE IF EMPTY — DO NOT INSERT GENERIC INSTRUCTIONS>";
const REGEN_WORD_BANK_PLACEHOLDER = "<REGENERATE WORD BANK — DO NOT USE TEMPLATE>";

function repairMathQuestions(
  section: any,
  _topic: string,
  _grade: string,
  problemCount: number,
  _wordProblems: boolean
): void {
  const n = Math.max(MIN_MATH_QUESTIONS, Math.min(12, problemCount || 6));
  section.questions = Array.from({ length: n }, (_, i) => ({
    id: `q${i + 1}`,
    question_type: "short_answer",
    text: REGEN_MATH_QUESTION_TEXT,
    lines: 3,
  }));
}

function repairScienceShortResponse(section: any, _topic: string, count: number): void {
  const n = Math.min(Math.max(count, MIN_MATH_QUESTIONS), 8);
  section.questions = Array.from({ length: n }, (_, i) => ({
    id: `q${i + 1}`,
    question_type: "short_answer",
    text: REGEN_SCIENCE_QUESTION_TEXT,
    lines: 4,
  }));
}

/**
 * CRITICAL: This function must NOT introduce generic or template-based content.
 * It may only preserve or flag missing content, not generate new problems.
 * (Uses explicit regen/placeholder strings instead of canned stems or equations.)
 *
 * When question counts are below minimum, append placeholder rows only—never replace
 * an existing questions array (preserve AI-generated items).
 *
 * Remove sections that are empty shells; repair math/science arrays.
 */
function validateAndRepairWorksheet(
  worksheet: any,
  activityType: string,
  topic: string,
  grade: string,
  subjectId: string,
  options: Record<string, unknown> | undefined,
  layoutSlot: string | undefined
): void {
  if (!worksheet || !Array.isArray(worksheet.sections)) return;
  const probCount =
    typeof options?.problemCount === "number" && Number.isFinite(options.problemCount)
      ? (options.problemCount as number)
      : 6;
  const isMathSubject = subjectId === "math";
  const isScience = subjectId === "science";

  worksheet.sections = worksheet.sections.filter((s: any) => s && typeof s === "object");

  for (const s of worksheet.sections) {
    if (s.type === "math_practice" || s.type === "math_word_problems") {
      const wp = s.type === "math_word_problems";
      if (!Array.isArray(s.questions)) {
        repairMathQuestions(s, String(topic), String(grade), probCount, wp);
      } else if (s.questions.length < MIN_MATH_QUESTIONS) {
        const existing = s.questions;
        const missingCount = MIN_MATH_QUESTIONS - existing.length;
        const fillers = Array.from({ length: missingCount }, (_, i) => ({
          id: `q${existing.length + i + 1}`,
          question_type: "short_answer",
          text: MISSING_QUESTION_TEXT,
          lines: 3,
        }));
        s.questions = [...existing, ...fillers];
      }
      if (Array.isArray(s.questions)) {
        s.questions = s.questions.map((q: any, i: number) => ({
          id: typeof q?.id === "string" && q.id.trim() ? q.id : `q${i + 1}`,
          question_type: q?.question_type || "short_answer",
          text: typeof q?.text === "string" && q.text.trim() ? q.text : MISSING_QUESTION_TEXT,
          lines: typeof q?.lines === "number" ? q.lines : 3,
        }));
      }
      if (isMathSubject && s.instructions && typeof s.instructions === "string" && !s.instructions.trim()) {
        s.instructions = REGEN_INSTRUCTION_PLACEHOLDER;
      }
    }
    if (s.type === "science_short_response") {
      if (!Array.isArray(s.questions)) {
        repairScienceShortResponse(s, String(topic), 4);
      } else if (s.questions.length < 2) {
        const existing = s.questions;
        const missingCount = 2 - existing.length;
        const fillers = Array.from({ length: missingCount }, (_, i) => ({
          id: `q${existing.length + i + 1}`,
          question_type: "short_answer",
          text: MISSING_QUESTION_TEXT,
          lines: 4,
        }));
        s.questions = [...existing, ...fillers];
      }
      if (isScience && s.instructions && typeof s.instructions === "string" && !s.instructions.trim()) {
        s.instructions = REGEN_INSTRUCTION_PLACEHOLDER;
      }
    }
    if (s.type === "word_bank" && Array.isArray(s.words) && s.words.length === 0) {
      const tw = String(topic)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8);
      s.words = tw.length ? tw : Array.from({ length: 8 }, () => REGEN_WORD_BANK_PLACEHOLDER);
    }
  }

  worksheet.sections = worksheet.sections.filter((s: any) => {
    if (s.type === "math_practice" || s.type === "math_word_problems") {
      return Array.isArray(s.questions) && s.questions.length >= MIN_MATH_QUESTIONS;
    }
    if (s.type === "science_short_response") {
      return Array.isArray(s.questions) && s.questions.length >= 2;
    }
    if (s.type === "word_bank") {
      return Array.isArray(s.words) && s.words.length > 0;
    }
    return true;
  });

  if (worksheet.sections.length === 0) {
    console.warn(`[GEN] Slot ${layoutSlot ?? "–"}: All sections dropped; worksheet may be invalid for ${activityType}`);
  }
}

function buildDifferentiationBlock(differentiation: unknown): string {
  if (!differentiation || typeof differentiation !== "object") return "";
  const d = differentiation as Record<string, unknown>;
  const level = typeof d.level === "string" ? d.level : "standard";
  const supports = (d.supports && typeof d.supports === "object" ? d.supports : {}) as Record<string, unknown>;
  const choiceCount = typeof d.choiceCount === "number" ? d.choiceCount : 3;
  const lines: string[] = [
    `DIFFERENTIATION LEVEL: ${level} (support = easier prompts/scaffolding; standard = grade-level; challenge = stretch).`,
  ];
  if (supports.wordBank === true) lines.push("- Include a word bank where it fits this activity type.");
  if (supports.sentenceFrames === true) lines.push("- Include sentence frames or stems where appropriate.");
  if (supports.visuals === true) lines.push("- Add visual scaffolds (boxes, simple icons, labeled areas).");
  if (supports.reducedChoices === true) lines.push("- Prefer fewer answer choices per item when multiple-choice appears.");
  lines.push(`- When items use multiple-choice style, use about ${choiceCount} options per question unless the activity type dictates otherwise.`);
  return `\n${lines.join("\n")}\n`;
}

const SCIENCE_SUBJECT_BLOCK = `
SCIENCE MODE (when subject is Science):
- Focus on concepts, processes, vocabulary, models, cause-and-effect, and evidence from observations — not creative narrative writing.
- Prioritize labeling, cycles/process sequences, compare stages, predict outcomes, and short explanations using domain terms.
- Do NOT replace science tasks with unrelated story writing, diary entries, or "imagine you are..." unless the activity type is explicitly a brief evidence-based explanation tied to a phenomenon.
- Questions must ask students to use science ideas (even when the activity type includes short writing).
`;

const READING_SUBJECT_BLOCK = `
READING MODE (when subject is Reading): Align content to literacy goals—comprehension, vocabulary in context, and text-based responses appropriate to the activity type.
`;

const ELA_SUBJECT_BLOCK = `
ELA MODE (when subject is Reading, Writing, or ELL):
- Include comprehension and evidence-based prompts where the activity type supports them (cite details, explain with evidence from a text or short excerpt, main idea / key details).
- For reading-focused tasks: ask students to ground answers in the passage or prompt; avoid vague opinion-only responses when the format allows evidence.
`;

/** Call inside the request handler after `topic` is known — do not use module-level templates with ${topic}. */
function buildMathSubjectBlock(topic: string): string {
  const t = (topic || "the topic").trim();
  return `
MATHEMATICS MODE (when subject is Math):
- Every section of type math_practice or math_word_problems MUST include a non-empty "questions" array with at least 4 fully written items (no empty arrays, no placeholders like "TBD").
- Use grade-appropriate numbers and operations implied by the topic; keep problems coherent with "${t}".
- Each question object must include: id, question_type, text (full stem), and lines (number).
`;
}

function buildSocialSubjectBlock(topic: string): string {
  const t = (topic || "the topic").trim();
  return `
SOCIAL STUDIES MODE (when subject is Social Studies): Emphasize chronology, geography, civics, or historical thinking as fits "${t}" and this activity type.
`;
}

type OptionMetadata = {
  id: string;
  layoutType: string;
  /** Page layout for this Quick Gen option: standard | boxed | two_column */
  layout: "standard" | "boxed" | "two_column";
  pedagogicalMode: "standard_practice" | "interactive_exploration" | "visual_application";
  title: string;
  shortDescription: string;
  includedComponents: string[];
  skillFocus: string;
  pedagogicalIntent: string;
};

type OptionMetadataCore = Omit<OptionMetadata, "layout" | "pedagogicalMode">;

function buildOptionMetadata(input: {
  activityType: string;
  topic: string;
  subject?: string;
  subjectId?: string;
  familyLabel?: string;
  layoutVariant?: string;
}): OptionMetadata {
  const t = (input.topic || "the topic").trim();
  const title = input.familyLabel?.trim() || `Option: ${input.activityType}`;
  const sci = input.subjectId === "science";
  const lv = (input.layoutVariant || "").toUpperCase();

  const fallback: OptionMetadataCore = {
    id: lv ? `${lv}_mixed_practice` : "opt_mixed_practice",
    layoutType: layoutTypeForActivity(input.activityType),
    title,
    shortDescription: `Practice and tasks about ${t} using a ${input.activityType} layout.`,
    includedComponents: ["Multiple sections", "Topic-specific prompts", "Grade-appropriate tasks"],
    skillFocus: "Apply understanding of the topic",
    pedagogicalIntent: "Reinforce key ideas through structured practice",
  };

  const map: Record<string, OptionMetadataCore> = {
    label_diagram: {
      id: lv ? `${lv}_diagram_label` : "diagram_label",
      layoutType: "diagram_label",
      title: sci ? "Label & Diagram" : title,
      shortDescription: sci
        ? `Science diagram for ${t} with accurate parts to identify and label.`
        : `Visual diagram for ${t} with parts to label and vocabulary support.`,
      includedComponents: [
        "Diagram / model frame",
        "Word bank or part list",
        "Arrows or blanks for labels",
      ],
      skillFocus: sci
        ? "Identify structures and use domain vocabulary correctly"
        : "Connect visuals to vocabulary",
      pedagogicalIntent: "Model-based understanding",
    },
    science_concept_practice: {
      id: lv ? `${lv}_concept_practice` : "concept_practice",
      layoutType: "concept_practice",
      title: sci ? "Concept & Vocabulary" : title,
      shortDescription: sci
        ? `Key science terms and short-response questions about ${t} — no storytelling.`
        : `Vocabulary support and questions for ${t}.`,
      includedComponents: [
        "Vocabulary word bank",
        "Short-response questions",
        "Directions to use domain vocabulary",
      ],
      skillFocus: sci ? "Define terms and explain science ideas in your own words" : "Vocabulary and concept recall",
      pedagogicalIntent: "Conceptual understanding",
    },
    line_matching: {
      id: lv ? `${lv}_matching` : "matching",
      layoutType: "matching",
      title: sci ? "Vocabulary & Concepts" : title,
      shortDescription: sci
        ? `Match science terms to definitions or processes for ${t}.`
        : `Match vocabulary to meanings for ${t}.`,
      includedComponents: ["Term–definition or process pairs", "Two columns to connect", "Science-accurate wording"],
      skillFocus: sci ? "Define and apply key science terms" : "Vocabulary in context",
      pedagogicalIntent: "Concept precision",
    },
    sequence_chart: {
      id: lv ? `${lv}_sequence_organizer` : "sequence_organizer",
      layoutType: "sequence_organizer",
      title: sci ? "Sequence & Process" : title,
      shortDescription: sci
        ? `Order and explain steps of ${t} as a science process or cycle.`
        : `Sequence steps or events for ${t}.`,
      includedComponents: ["Numbered stages", "Short explanations per step", "Process reflection"],
      skillFocus: sci ? "Explain how and why the process unfolds" : "Sequencing and summarizing",
      pedagogicalIntent: "Systems thinking",
    },
    math_practice: {
      id: lv ? `${lv}_concept_practice` : "math_concept_practice",
      layoutType: "concept_practice",
      title: "Skills Practice",
      shortDescription: `Computational practice aligned to ${t}.`,
      includedComponents: ["Equations / blanks", "Workspace lines", "Clear directions"],
      skillFocus: "Fluency and accuracy",
      pedagogicalIntent: "Procedural practice",
    },
    math_word_problems: {
      id: lv ? `${lv}_word_problems` : "word_problems",
      layoutType: "word_problems",
      title: "Word Problems",
      shortDescription: `Context problems based on ${t}.`,
      includedComponents: ["Scenario prompts", "Answer blanks", "Grade-appropriate numbers"],
      skillFocus: "Model with mathematics / explain reasoning briefly",
      pedagogicalIntent: "Application",
    },
    graph_page: {
      id: lv ? `${lv}_data_representation` : "data_representation",
      layoutType: "data_representation",
      title: "Graph & Data",
      shortDescription: `Data or categories related to ${t}.`,
      includedComponents: ["Graph frame", "Categories / scale", "Prompts to interpret"],
      skillFocus: "Represent and interpret quantitative information",
      pedagogicalIntent: "Data literacy",
    },
    number_bond: {
      id: lv ? `${lv}_number_bond` : "number_bond",
      layoutType: "concept_practice",
      title: "Number Bonds",
      shortDescription: `Part–whole relationships for ${t} using bond diagrams.`,
      includedComponents: ["Bond circles", "Missing parts to solve", "Number sense prompts"],
      skillFocus: "Compose and decompose numbers",
      pedagogicalIntent: "Foundations of operations",
    },
    ten_frame: {
      id: lv ? `${lv}_ten_frame` : "ten_frame",
      layoutType: "concept_practice",
      title: "Ten Frames",
      shortDescription: `Counting and operations for ${t} on ten-frame grids.`,
      includedComponents: ["Frame grids", "Counters or numbers", "Compare or build amounts"],
      skillFocus: "Subitize and build to 10",
      pedagogicalIntent: "Visual number sense",
    },
    measurement: {
      id: lv ? `${lv}_measurement` : "measurement",
      layoutType: "word_problems",
      title: "Measurement",
      shortDescription: `Measure, compare, or estimate with ${t} in context.`,
      includedComponents: ["Units labeled", "Rulers or non-standard tools", "Recording space"],
      skillFocus: "Attend to precision with units",
      pedagogicalIntent: "Measurement reasoning",
    },
    story_map: {
      id: lv ? `${lv}_comprehension` : "comprehension",
      layoutType: "comprehension",
      title: "Story Map",
      shortDescription: `Story elements and comprehension for ${t}.`,
      includedComponents: ["Characters, setting, plot", "Problem & solution", "Reflection"],
      skillFocus: "Retell and analyze narrative structure",
      pedagogicalIntent: "Reading comprehension",
    },
    frayer_model: {
      id: lv ? `${lv}_vocabulary_review` : "vocabulary_review",
      layoutType: "vocabulary_review",
      title: "Vocabulary Deep Dive",
      shortDescription: `One key term from ${t} explored in depth.`,
      includedComponents: ["Definition", "Examples / non-examples", "Visual or sentence use"],
      skillFocus: "Precision of meaning",
      pedagogicalIntent: "Academic vocabulary",
    },
    kwl_chart: {
      id: lv ? `${lv}_inquiry_chart` : "inquiry_chart",
      layoutType: "inquiry_chart",
      title: "K-W-L",
      shortDescription: `What you know, want to know, and will learn about ${t}.`,
      includedComponents: ["K / W / L columns", "Guiding questions", "Reflection"],
      skillFocus: "Activate prior knowledge and set purpose",
      pedagogicalIntent: "Inquiry-based reading",
    },
    writing_prompt: {
      id: lv ? `${lv}_constructed_response` : "constructed_response",
      layoutType: "constructed_response",
      title: "Writing",
      shortDescription: `Written response about ${t}.`,
      includedComponents: ["Prompt", "Lined space", "Optional word bank"],
      skillFocus: "Express ideas in complete writing",
      pedagogicalIntent: "Written communication",
    },
    sentence_frames: {
      id: lv ? `${lv}_scaffolded_writing` : "scaffolded_writing",
      layoutType: "scaffolded_writing",
      title: "Sentence Frames",
      shortDescription: `Scaffolded stems for ${t}.`,
      includedComponents: ["Multiple stems", "Short writing lines", "Academic language support"],
      skillFocus: "Use academic language patterns",
      pedagogicalIntent: "Scaffolded expression",
    },
    mini_book: {
      id: lv ? `${lv}_multi_page_project` : "multi_page_project",
      layoutType: "multi_page_project",
      title: "Mini Book",
      shortDescription: `Short pages on ${t}.`,
      includedComponents: ["Panel prompts", "Illustration space", "Simple booklet layout"],
      skillFocus: "Organize ideas across pages",
      pedagogicalIntent: "Publishing format",
    },
    timeline: {
      id: lv ? `${lv}_process_explanation` : "process_explanation",
      layoutType: "process_explanation",
      title: "Timeline",
      shortDescription: `Events or stages for ${t}.`,
      includedComponents: ["Ordered events", "Dates or sequence", "Brief captions"],
      skillFocus: "Chronological reasoning",
      pedagogicalIntent: "Historical thinking",
    },
    venn_diagram: {
      id: lv ? `${lv}_compare_contrast` : "compare_contrast",
      layoutType: "compare_contrast",
      title: "Compare & Contrast",
      shortDescription: `Compare ideas related to ${t}.`,
      includedComponents: ["Two circles", "Shared and unique ideas", "Prompts"],
      skillFocus: "Analyze similarities and differences",
      pedagogicalIntent: "Comparative reasoning",
    },
    cut_and_sort: {
      id: lv ? `${lv}_sorting` : "sorting",
      layoutType: "sorting",
      title: "Cut & Sort",
      shortDescription: `Sort items for ${t} into categories.`,
      includedComponents: ["Category headers", "Items to cut/sort", "Glue or write area"],
      skillFocus: "Classify using criteria",
      pedagogicalIntent: "Categorization",
    },
    color_by_code: {
      id: lv ? `${lv}_visual_practice` : "visual_practice",
      layoutType: "visual_practice",
      title: "Color by Code",
      shortDescription: `Color-coding practice for ${t}.`,
      includedComponents: ["Code key", "Picture or grid", "Words or patterns"],
      skillFocus: "Decode and recognize patterns",
      pedagogicalIntent: "Phonics / attention to detail",
    },
    word_search: {
      id: lv ? `${lv}_word_hunt` : "word_hunt",
      layoutType: "word_hunt",
      title: "Word Search",
      shortDescription: `Find vocabulary for ${t}.`,
      includedComponents: ["Letter grid", "Word list", "Directions"],
      skillFocus: "Spelling pattern recognition",
      pedagogicalIntent: "Word form practice",
    },
    mind_map: {
      id: lv ? `${lv}_graphic_organizer` : "graphic_organizer",
      layoutType: "graphic_organizer",
      title: "Mind Map",
      shortDescription: `Branches of ideas about ${t}.`,
      includedComponents: ["Central concept", "Branches", "Child ideas"],
      skillFocus: "Organize and connect ideas",
      pedagogicalIntent: "Concept mapping",
    },
    coloring_page: {
      id: lv ? `${lv}_visual_activity` : "visual_activity",
      layoutType: "visual_activity",
      title: "Coloring",
      shortDescription: `Illustration activity for ${t}.`,
      includedComponents: ["Large outline art", "Optional short response", "Directions"],
      skillFocus: "Fine motor + topic connection",
      pedagogicalIntent: "Engagement",
    },
    bingo_card: {
      id: lv ? `${lv}_game_grid` : "game_grid",
      layoutType: "game_grid",
      title: "Bingo",
      shortDescription: `Game grid for ${t}.`,
      includedComponents: ["5×5 grid", "Call list", "Rules"],
      skillFocus: "Review vocabulary or facts",
      pedagogicalIntent: "Gamified review",
    },
  };

  const base = map[input.activityType] ?? fallback;
  const lvKey = (input.layoutVariant || "").toUpperCase();
  /** Canonical editor shell — always derived from activityType, not from copy-pasted map rows. */
  const layoutType = layoutTypeForActivity(input.activityType);
  const usePed = Boolean(lvKey);
  const pedMode = pedagogicalModeForSlot(input.layoutVariant);
  return {
    ...base,
    layoutType,
    layout: pageLayoutForSlot(input.layoutVariant),
    pedagogicalMode: pedMode,
    title: usePed ? pedagogicalTitleForSlot(input.layoutVariant) : base.title,
    shortDescription: usePed ? buildPedagogicalShortDescription(input.layoutVariant, t, input.activityType) : base.shortDescription,
    skillFocus: usePed ? pedagogicalSkillFocusForSlot(input.layoutVariant) : base.skillFocus,
    pedagogicalIntent: usePed ? pedagogicalIntentForSlot(input.layoutVariant) : base.pedagogicalIntent,
    id: lvKey ? `${lvKey}_${input.activityType}_${pedMode}` : base.id,
  };
}

/** Readable names for worksheet JSON section.type values (factual preview copy). */
const SECTION_TYPE_DISPLAY: Record<string, string> = {
  passage: "Reading passage",
  vocabulary: "Vocabulary list",
  questions: "Questions",
  directions: "Directions",
  math_practice: "Math practice",
  math_word_problems: "Word problems",
  science_short_response: "Short response",
  word_bank: "Word bank",
  label_diagram: "Label diagram",
  mind_map: "Mind map",
  venn_diagram: "Venn diagram",
  kwl_chart: "K-W-L chart",
  sequence_chart: "Sequence / process chart",
  story_map: "Story map",
  frayer_model: "Frayer model",
  line_matching: "Line matching",
  cut_and_sort: "Cut and sort",
  picture_sort: "Picture sort",
  word_search: "Word search",
  word_search_full: "Word search",
  writing_prompt: "Writing prompt",
  writing_prompt_header: "Writing prompt",
  sentence_frames: "Sentence frames",
  mini_book: "Mini book",
  acrostic: "Acrostic",
  timeline: "Timeline",
  observation_sheet: "Observation sheet",
  map_activity: "Map activity",
  coloring_page: "Coloring page",
  color_by_code: "Color by code",
  tracing: "Tracing",
  word_practice: "Word practice",
  word_sight_row: "Sight word row",
  fill_blanks: "Fill in blanks",
  sentence_practice: "Sentence practice",
  coloring_activity: "Coloring activity",
  number_bond: "Number bonds",
  ten_frame: "Ten frames",
  graph_page: "Graph",
  measurement: "Measurement",
  clock_practice: "Clock practice",
  dice_activity: "Dice activity",
  spinner: "Spinner",
  bingo_card: "Bingo",
  crossword: "Crossword",
};

function displaySectionType(type: string | undefined): string {
  const t = String(type ?? "").trim();
  if (!t) return "Section";
  return SECTION_TYPE_DISPLAY[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Summarize one section for preview "Includes" — counts and structure only, no marketing.
 */
function describeSectionStructure(s: any, index: number): string {
  const label = displaySectionType(s?.type);
  const bits: string[] = [`${index + 1}. ${label}`];

  const nq = Array.isArray(s?.questions) ? s.questions.length : 0;
  if (nq > 0) bits.push(`${nq} question${nq === 1 ? "" : "s"}`);

  const nw = Array.isArray(s?.words) ? s.words.length : 0;
  if (nw > 0) bits.push(`${nw} word-bank term${nw === 1 ? "" : "s"}`);

  const nv = Array.isArray(s?.vocabulary) ? s.vocabulary.length : 0;
  if (nv > 0) bits.push(`${nv} vocabulary item${nv === 1 ? "" : "s"}`);

  const ni = Array.isArray(s?.items) ? s.items.length : 0;
  if (ni > 0) bits.push(`${ni} sort item${ni === 1 ? "" : "s"}`);

  const nc = Array.isArray(s?.cards) ? s.cards.length : 0;
  if (nc > 0) bits.push(`${nc} card${nc === 1 ? "" : "s"}`);

  const np = Array.isArray(s?.pairs) ? s.pairs.length : 0;
  if (np > 0) bits.push(`${np} match pair${np === 1 ? "" : "s"}`);

  const nb = Array.isArray(s?.bonds) ? s.bonds.length : 0;
  if (nb > 0) bits.push(`${nb} bond${nb === 1 ? "" : "s"}`);

  const nf = Array.isArray(s?.frames) ? s.frames.length : 0;
  if (nf > 0) bits.push(`${nf} frame${nf === 1 ? "" : "s"}`);

  const ncl = Array.isArray(s?.clues) ? s.clues.length : 0;
  if (ncl > 0) bits.push(`${ncl} clue${ncl === 1 ? "" : "s"}`);

  const nbr = Array.isArray(s?.branches) ? s.branches.length : 0;
  if (nbr > 0) bits.push(`${nbr} branch${nbr === 1 ? "" : "es"}`);

  const nst = Array.isArray(s?.steps) ? s.steps.length : 0;
  if (nst > 0) bits.push(`${nst} step${nst === 1 ? "" : "s"}`);

  const nev = Array.isArray(s?.events) ? s.events.length : 0;
  if (nev > 0) bits.push(`${nev} event${nev === 1 ? "" : "s"}`);

  const nwl = Array.isArray(s?.wordList) ? s.wordList.length : 0;
  if (nwl > 0) bits.push(`${nwl} list word${nwl === 1 ? "" : "s"}`);

  if (typeof s?.passage === "string" && s.passage.trim().length > 0) {
    bits.push("passage text");
  }

  return bits.join(" — ");
}

type DerivedWorksheetPreview = {
  title: string;
  shortDescription: string;
  includedComponents: string[];
};

/**
 * Build Quick Gen card copy from the actual worksheet.sections array (post-repair).
 */
function deriveOptionMetadataFromWorksheet(
  worksheet: any,
  topicFallback: string,
): DerivedWorksheetPreview {
  const sections = Array.isArray(worksheet?.sections)
    ? worksheet.sections.filter((x: any) => x && typeof x === "object")
    : [];
  const wt = typeof worksheet?.title === "string" ? worksheet.title.trim() : "";
  const tf = (topicFallback || "this topic").trim();

  if (sections.length === 0) {
    return {
      title: wt || "Worksheet (empty)",
      shortDescription: "No sections in the generated worksheet JSON.",
      includedComponents: ["No sections"],
    };
  }

  const includedComponents = sections.map((s: any, i: number) => describeSectionStructure(s, i));

  const typeNames = sections.map((s: any) => displaySectionType(s?.type));
  const uniqueTypes = [...new Set(typeNames)];
  const structurePhrase =
    uniqueTypes.length === 1
      ? `one ${uniqueTypes[0].toLowerCase()} section`
      : `${sections.length} sections (${uniqueTypes.join(", ")})`;

  const shortDescription = `Generated worksheet: ${structurePhrase} for ${tf}.`;

  const title =
    wt ||
    (sections.length === 1
      ? `${displaySectionType(sections[0]?.type)}`
      : `${sections.length} sections: ${typeNames.join(" · ")}`);

  return {
    title,
    shortDescription,
    includedComponents,
  };
}

/** Fields for the large worksheet system prompt template (generic vs reading differ only in selected parts). */
interface WorksheetSystemPromptParts {
  criticalAntiExampleBlock: string;
  quickGenDistinctBlock: string;
  quickGenContentTypeFlag: string;
  grade: string;
  activityType: string;
  title: string;
  topic: string;
  /** Request body subject (e.g. math_word_problems context line). */
  subject: string | undefined;
  targetWord: string | undefined;
  options: Record<string, unknown> | undefined;
  subjectBlock: string;
  differentiationBlock: string;
  mixedQuestionTypesInstruction: string;
  questionTypesClientInstruction: string;
  templateCopyWarning: string;
  quickGenInstructionPrefixRules: string;
  variantInstruction: string;
  generateContentPlaceholder: string;
  jsonPlaceholderList: (n: number) => string;
  scienceConceptSlotRuleLine: string;
  scienceConceptSectionRules: string;
  mathSlotRuleLine: string;
  mathPracticeThisSlotLine: string;
  mathSlotSectionRules: string;
  mathWordThisSlotLine: string;
  detailsNote: string;
  quickGenFailsafeRule: string;
  criticalSectionUniqueness: string;
  finalSelfCheckBlock: string;
  mandatoryContentDiversity: string;
}

function assembleWorksheetSystemPrompt(p: WorksheetSystemPromptParts): string {
  const o = p.options;
  return `${p.criticalAntiExampleBlock}
You are an expert elementary school worksheet content generator.
Given an activity type and options, generate the specific content for a worksheet.

OUTPUT CONTRACT (STRICT):
- Return ONLY one JSON object. No markdown fences (no \`\`\`json), no commentary before or after the JSON.
- Generate real, grade-appropriate stimulus (titles, passages, word banks, step titles, event labels, Venn sort terms or word banks, questions, math problems, etc.). Only STUDENT RESPONSE fields in SECTION GENERATION RULES stay blank (e.g. steps[].content, mind map branches). No empty "sections" array. No empty "questions" arrays for math_practice or math_word_problems.
${p.quickGenDistinctBlock}
${p.quickGenContentTypeFlag}
Return ONLY valid JSON with this structure:
{
  "worksheet": {
    "worksheet_id": "${randomUUID()}",
    "title": "Worksheet title",
    "subject": "subject area",
    "gradeLevel": "${p.grade}",
    "language": "English",
    "template_type": "${p.activityType}",
    "sections": [ ... ]
  }
}

Activity type: ${p.activityType}
Title: ${p.title}
Grade: ${p.grade}
Topic: ${p.topic}
${p.targetWord ? `Target word: ${p.targetWord}` : ""}
Options: ${JSON.stringify(o || {})}
${p.subjectBlock}${p.differentiationBlock}
${p.mixedQuestionTypesInstruction}${p.questionTypesClientInstruction}
SECTION GENERATION RULES BY TYPE:
${INSTRUCTIONS_VS_STUDENT_CONTENT}
${p.templateCopyWarning}
${p.quickGenInstructionPrefixRules}

For mind_map:
Generate sections: [{ "id":"s1", "type":"mind_map", "title": "${p.title}", "centerTerm": "${p.topic}", "branches": [${Array.from({ length: (o as { branchCount?: number })?.branchCount ?? 4 }).map(() => '""').join(",")}], "branchCount": ${(o as { branchCount?: number })?.branchCount || 4} }]
centerTerm is the topic/stimulus for the map; branches must be "" only.

For venn_diagram:
Generate sections: [{ "id":"s1", "type":"venn_diagram", "title":"${p.title}", "leftLabel": "${(o as { leftLabel?: string })?.leftLabel || 'Topic A'}", "rightLabel": "${(o as { rightLabel?: string })?.rightLabel || 'Topic B'}", "centerLabel": "${(o as { centerLabel?: string })?.centerLabel || 'Both'}", "leftItems": [], "rightItems": [], "centerItems": [] }]
Put short sortable terms (words or 2–4 word phrases) in leftItems/rightItems/centerItems as stimulus, OR add a second section { "type":"word_bank", "words":[...] } with 6–8 words, OR list words in section.instructions.

For kwl_chart:
Generate sections: [{ "id":"s1", "type":"kwl_chart", "title":"${p.title}", "variant": "${(o as { variant?: string })?.variant || 'KWL (3 columns)'}", "knowItems": [], "wantItems": [], "learnedItems": [], "rowCount": ${(o as { rowCount?: number })?.rowCount || 8} }]
knowItems, wantItems, and learnedItems MUST remain [] — do not add strings.

For sequence_chart:
Generate sections: [{ "id":"s1", "type":"sequence_chart", "title":"${p.title}", "steps": [{"id":"step1","number":1,"title":"${p.generateContentPlaceholder}","content":""},{"id":"step2","number":2,"title":"${p.generateContentPlaceholder}","content":""},{"id":"step3","number":3,"title":"${p.generateContentPlaceholder}","content":""},{"id":"step4","number":4,"title":"${p.generateContentPlaceholder}","content":""}] }]
Use real stage or step names in steps[].title (stimulus). steps[].content must be "". For Science, stage names may appear in title; longer context in section.instructions.

For frayer_model:
Generate sections: [{ "id":"s1", "type":"frayer_model", "title":"${p.title}", "centerTerm":"${p.targetWord || p.topic}", "q1Label":"${(o as { q1Label?: string })?.q1Label || 'Definition'}", "q2Label":"${(o as { q2Label?: string })?.q2Label || 'Example'}", "q3Label":"${(o as { q3Label?: string })?.q3Label || 'Non-Example'}", "q4Label":"${(o as { q4Label?: string })?.q4Label || 'Draw It'}", "q1Content":"", "q2Content":"", "q3Content":"", "q4Content":"" }]

For writing_prompt:
Generate sections: [
  { "id":"s1", "type":"writing_prompt_header", "title":"${p.title}", "prompt":"${(o as { prompt?: string })?.prompt || 'Generate an engaging ' + ((o as { promptStyle?: string })?.promptStyle || 'creative') + ' writing prompt about ' + p.topic + ' for grade ' + p.grade}", "lineCount":${(o as { lineCount?: number })?.lineCount || 15}, "lineStyle":"${(o as { lineStyle?: string })?.lineStyle || 'wide ruled'}", "illustrationBox":"${(o as { illustrationBox?: string })?.illustrationBox || 'None'}" },
  ${(o as { wordBank?: boolean })?.wordBank ? `{ "id":"s2", "type":"word_bank", "title":"Word Bank", "words":[${p.jsonPlaceholderList(6)}] }` : ''}
]

For acrostic:
Generate sections: [{ "id":"s1", "type":"acrostic", "title":"${p.title}", "acrosticWord":"${(o as { acrosticWord?: string })?.acrosticWord || p.targetWord || p.topic.split(' ')[0] || 'WORD'}", "linesPerLetter":${(o as { linesPerLetter?: number })?.linesPerLetter || 1}, "styleHint":"${(o as { styleHint?: string })?.styleHint || 'Phrase'}" }]

For word_search:
Generate a word list of 10-15 words related to the topic.
Generate sections: [{ "id":"s1", "type":"word_search_full", "title":"${p.title}", "wordList":[${p.jsonPlaceholderList(10)}], "gridSize":"${(o as { gridSize?: string })?.gridSize || '10×10'}", "directions":"${(o as { directions?: string })?.directions || 'Horiz + Vertical'}", "showWordList":${(o as { showWordList?: boolean })?.showWordList !== false} }]

For bingo_card:
Generate sections: [{ "id":"s1", "type":"bingo_card", "title":"${p.title}", "gridSize":"${(o as { gridSize?: string })?.gridSize || '5×5'}", "freeSpace":${(o as { freeSpace?: boolean })?.freeSpace !== false}, "wordList":[${p.jsonPlaceholderList(24)}] }]

For number_bond:
Generate sections: [{ "id":"s1", "type":"number_bond", "title":"${p.title}", "bondCount":${(o as { bondCount?: number })?.bondCount || 6}, "focus":"${(o as { focus?: string })?.focus || 'Addition'}", "bonds":[{"whole":null,"part1":null,"part2":null}] }]
(Generate bondCount distinct bond objects with grade-appropriate whole numbers from the topic—do not copy sample numbers from any example.)

For ten_frame:
Generate sections: [{ "id":"s1", "type":"ten_frame", "title":"${p.title}", "frameCount":${(o as { frameCount?: number })?.frameCount || 4}, "activity":"${p.generateContentPlaceholder}", "problems":[{"number":null},{"number":null},{"number":null},{"number":null}] }]
(Replace nulls with topic-appropriate values; one object per frame in problems.)

For coloring_page:
Generate sections: [{ "id":"s1", "type":"coloring_page", "title":"${p.title}", "theme":"${(o as { theme?: string })?.theme || p.topic}", "size":"${(o as { size?: string })?.size || 'Full page'}", "addWritingLines":${(o as { addWritingLines?: boolean })?.addWritingLines || false}, "lineCount":${(o as { lineCount?: number })?.lineCount || 3}, "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>" }]

For color_by_code:
Generate the color key from the topic.
Generate sections: [{ "id":"s1", "type":"color_by_code", "title":"${p.title}", "codeType":"${(o as { codeType?: string })?.codeType || 'Sight words'}", "theme":"${(o as { theme?: string })?.theme || p.topic}", "colorKey":[{"code":"${p.generateContentPlaceholder}","color":"${p.generateContentPlaceholder}"},{"code":"${p.generateContentPlaceholder}","color":"${p.generateContentPlaceholder}"},{"code":"${p.generateContentPlaceholder}","color":"${p.generateContentPlaceholder}"},{"code":"${p.generateContentPlaceholder}","color":"${p.generateContentPlaceholder}"}] }]

For label_diagram:
Generate EXACTLY one section of type label_diagram with:
- "diagramLayout": one of "centered_bank_below" | "diagram_left_labels_right" | "diagram_top_callouts" — MUST match the Quick Gen layout letter for this request (see user message for the required value).
- "title", "subject", "diagramSubject" (same string as the topic shown on the diagram — usually the topic or diagramSubject from options), "parts" (6–8 real part names for the topic), "wordBank": boolean
Example shape:
{ "id":"s1", "type":"label_diagram", "diagramLayout":"centered_bank_below", "title":"${p.title}", "diagramSubject":"${(o as { diagramSubject?: string })?.diagramSubject || p.topic}", "subject":"${(o as { diagramSubject?: string })?.diagramSubject || p.topic}", "parts":[${p.jsonPlaceholderList(6)}], "wordBank":${(o as { wordBank?: boolean })?.wordBank !== false} }
If the subject is Science, parts must be real structures or stages for the topic (e.g., water cycle: evaporation, condensation, precipitation, collection, runoff, groundwater, energy from the sun) — not story elements.

For science_concept_practice:
Generate EXACTLY two sections (no other section types):
1) word_bank: 8-12 real science vocabulary words for the topic (strings only in "words").
2) science_short_response: short_answer questions asking students to explain processes, compare stages, or use vocabulary — NOT creative writing, NOT a story, NOT "imagine you are...".
${p.scienceConceptSlotRuleLine}
${p.scienceConceptSectionRules}
Include on the science_short_response object: "layoutRhythm": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message). Vary question count and "lines" per question according to the LAYOUT STYLE block for this request (clean vs scaffolded vs compact).
sections: [
  { "id":"s1", "type":"word_bank", "title":"Key vocabulary: ${p.topic}", "words":[${p.jsonPlaceholderList(8)}] },
  { "id":"s2", "type":"science_short_response", "title":"Show what you know", "layoutRhythm":"spacious", "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>", "questions":[
    { "id":"q1","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":4 },
    { "id":"q2","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":4 },
    { "id":"q3","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":4 },
    { "id":"q4","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":4 }
  ]}
]

For observation_sheet:
Generate sections: [{ "id":"s1", "type":"observation_sheet", "title":"${p.title}", "sections":["Hypothesis","Observation","What I learned"], "includeDrawing":${(o as { includeDrawing?: boolean })?.includeDrawing !== false} }]

For timeline:
Generate sections: [{ "id":"s1", "type":"timeline", "title":"${p.title}", "orientation":"${(o as { orientation?: string })?.orientation || 'Horizontal'}", "events":[{"id":"e1","label":"${p.generateContentPlaceholder}","content":""},{"id":"e2","label":"${p.generateContentPlaceholder}","content":""},{"id":"e3","label":"${p.generateContentPlaceholder}","content":""},{"id":"e4","label":"${p.generateContentPlaceholder}","content":""},{"id":"e5","label":"${p.generateContentPlaceholder}","content":""}] }]
Use short topic-appropriate labels in events[].label (stimulus). events[].content must be "".

For story_map:
Generate sections: [{ "id":"s1", "type":"story_map", "title":"${p.title}", "layout":"Linear", "fields":[{"label":"Characters","content":""},{"label":"Setting","content":""},{"label":"Problem","content":""},{"label":"Event 1","content":""},{"label":"Event 2","content":""},{"label":"Event 3","content":""},{"label":"Solution","content":""},{"label":"Theme","content":""}] }]

For line_matching:
Generate ${(o as { pairCount?: number })?.pairCount || 6} matching pairs for the topic.
Generate sections: [{ "id":"s1", "type":"line_matching", "title":"${p.title}", "matchType":"${(o as { matchType?: string })?.matchType || 'Word → Definition'}", "pairs":[{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"},{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"},{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"},{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"},{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"},{"left":"${p.generateContentPlaceholder}","right":"${p.generateContentPlaceholder}"}] }]

For cut_and_sort:
Generate items for each category.
Generate sections: [{ "id":"s1", "type":"cut_and_sort", "title":"${p.title}", "categories":["${(o as { categories?: string })?.categories?.split(',')[0]?.trim() || 'Category A'}","${(o as { categories?: string })?.categories?.split(',')[1]?.trim() || 'Category B'}"], "items":[${p.jsonPlaceholderList(8)}] }]

For sentence_frames:
Generate ${(o as { frameCount?: number })?.frameCount || 4} sentence frames for the topic. Each "stem" MUST include blanks (____) or dotted omissions for students — never a finished paragraph or model answer.
Generate sections: [{ "id":"s1", "type":"sentence_frames", "title":"${p.title}", "frames":[{"id":"f1","stem":"${p.generateContentPlaceholder}"},{"id":"f2","stem":"${p.generateContentPlaceholder}"},{"id":"f3","stem":"${p.generateContentPlaceholder}"},{"id":"f4","stem":"${p.generateContentPlaceholder}"}], "writingLines":${(o as { writingLines?: number })?.writingLines || 2} }]

For mini_book:
Generate sections: [{ "id":"s1", "type":"mini_book", "title":"${p.title}", "panelCount":${(o as { panelCount?: number })?.panelCount || 4}, "panels":[{"id":"p1","number":1,"label":"${p.generateContentPlaceholder}","prompt":""},{"id":"p2","number":2,"label":"${p.generateContentPlaceholder}","prompt":""},{"id":"p3","number":3,"label":"${p.generateContentPlaceholder}","prompt":""},{"id":"p4","number":4,"label":"${p.generateContentPlaceholder}","prompt":""}] }]

For clock_practice:
Generate sections: [{ "id":"s1", "type":"clock_practice", "title":"${p.title}", "clockCount":${(o as { clockCount?: number })?.clockCount || 6}, "precision":"${(o as { precision?: string })?.precision || 'Half hour'}", "direction":"${p.generateContentPlaceholder}", "times":[${p.jsonPlaceholderList(6)}] }]

For spinner:
Generate sections: [{ "id":"s1", "type":"spinner", "title":"${p.title}", "sections":${(o as { sections?: number })?.sections || 6}, "sectionLabels":${(o as { sectionLabels?: string })?.sectionLabels ? JSON.stringify((o as { sectionLabels: string }).sectionLabels.split(',').map((s: string) => s.trim())) : `[${p.jsonPlaceholderList(6)}]`}, "recordSheet":${(o as { recordSheet?: boolean })?.recordSheet !== false} }]

For dice_activity:
Generate sections: [{ "id":"s1", "type":"dice_activity", "title":"${p.title}", "activityTitle":"${(o as { activityTitle?: string })?.activityTitle || p.generateContentPlaceholder}", "faces":["⚀","⚁","⚂","⚃","⚄","⚅"], "instructions":["<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>","<GENERATE>","<GENERATE>","<GENERATE>","<GENERATE>","<GENERATE>"] }]

For graph_page:
Generate sections: [{ "id":"s1", "type":"graph_page", "title":"${p.title}", "graphType":"${(o as { graphType?: string })?.graphType || 'Bar graph'}", "xLabel":"${p.generateContentPlaceholder}", "yLabel":"${p.generateContentPlaceholder}", "categories":[${p.jsonPlaceholderList(4)}], "maxValue":${(o as { maxValue?: number })?.maxValue || 10} }]

For measurement:
Generate sections: [{ "id":"s1", "type":"measurement", "title":"${p.title}", "unit":"${(o as { unit?: string })?.unit || 'Inches'}", "itemCount":${(o as { itemCount?: number })?.itemCount || 6}, "items":[${p.jsonPlaceholderList(6)}] }]

For math_practice:
${p.mathSlotRuleLine}
${p.mathPracticeThisSlotLine}
${p.mathSlotSectionRules}
Include "mathPracticeLayout": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message for required value).
Generate EXACTLY ${(o as { problemCount?: number })?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3}
Equations must be solvable and reflect the operation implied by "${p.topic}". Use grade ${p.grade} for number size.
When "${p.topic}" is addition, use addition equations; when subtraction, use subtraction; when multiplication, use multiplication; when division, use division.

Generate sections: [{
  "id":"s1",
  "type":"math_practice",
  "title":"${p.title}",
  "mathPracticeLayout":"spacious",
  "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 }
  ]
}]

For math_word_problems:
${p.mathSlotRuleLine}
${p.mathWordThisSlotLine}
${p.mathSlotSectionRules}
Include "mathPracticeLayout": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message).
Generate EXACTLY ${(o as { problemCount?: number })?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3}
Use scenario-based word problems based on "${p.topic}" (addition/subtraction/multiplication/division) and tune phrasing/number size to grade ${p.grade}.
Use subject "${p.subject ?? ""}" to pick a context flavor when appropriate (e.g., classroom/real-life framing).

Generate sections: [{
  "id":"s1",
  "type":"math_word_problems",
  "title":"${p.title}",
  "mathPracticeLayout":"spacious",
  "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"${p.generateContentPlaceholder}","lines":3 }
  ]
}]

For map_activity:
Generate sections: [{ "id":"s1", "type":"map_activity", "title":"${p.title}", "mapType":"${(o as { mapType?: string })?.mapType || 'Community'}", "includeCompass":${(o as { includeCompass?: boolean })?.includeCompass !== false}, "includeKey":${(o as { includeKey?: boolean })?.includeKey !== false} }]

For crossword:
Generate ${(o as { clueCount?: number })?.clueCount || 8} words with clues.
Generate sections: [{ "id":"s1", "type":"crossword", "title":"${p.title}", "clues":[{"number":1,"direction":"Across","clue":"${p.generateContentPlaceholder}","answer":"${p.generateContentPlaceholder}"},{"number":2,"direction":"Down","clue":"${p.generateContentPlaceholder}","answer":"${p.generateContentPlaceholder}"},{"number":3,"direction":"Across","clue":"${p.generateContentPlaceholder}","answer":"${p.generateContentPlaceholder}"}] }]

For picture_sort:
Generate sections: [{ "id":"s1", "type":"picture_sort", "title":"${p.title}", "categories":${JSON.stringify(((o as { categories?: string })?.categories || 'Category A, Category B').split(',').map((c: string) => c.trim()))}, "cards":[${p.jsonPlaceholderList(8)}] }]

For trace_and_color:
Generate sections: [{ "id":"s1", "type":"tracing", "targetWord":"${(o as { theme?: string })?.theme || p.targetWord || p.topic}", "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>", "lineCount":4 }]

For word_practice (sight word):
Generate sections for a complete sight word worksheet.
Ensure targetWord is "${p.targetWord || p.topic}".
Generate: word_practice, word_sight_row, fill_blanks, sentence_practice sections.

DEFAULT for any other type:
Generate appropriate sections based on the activity type and topic.
Include 2-4 sections with real content for the topic.

Fill in ALL placeholder content with real, grade-appropriate content for "${p.topic}" at grade ${p.grade}.
${p.variantInstruction}${p.detailsNote}
${p.quickGenFailsafeRule}
${p.criticalSectionUniqueness}
${p.finalSelfCheckBlock}
${p.mandatoryContentDiversity}
Return ONLY the JSON object — no markdown, no prose.`;
}

/** Non-reading: full Quick Gen / organizer-variant scaffolding (existing behavior). */
function buildGenericWorksheetSystemPrompt(parts: WorksheetSystemPromptParts): string {
  return assembleWorksheetSystemPrompt(parts);
}

/**
 * Reading subject: same JSON contract and section rules as generic, but without Quick Gen STEM blocks,
 * organizer layout improvisation (buildLayoutVariantInstruction), or option-prefix rules that target math/science.
 */
function buildReadingWorksheetSystemPrompt(parts: WorksheetSystemPromptParts): string {
  return assembleWorksheetSystemPrompt(parts);
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      activityType,
      options,
      originalPrompt,
      parsedPromptData,
      layoutVariant,
      /** Quick Gen option label (A/B/C) — used for metadata ids only; not structural prompts */
      generationSlot,
      subject,
      details,
      subjectId,
      structuralVariants,
      variantFamilyLabel,
      differentiation,
      topic: topicBody,
      grade: gradeBody,
    } = req.body;

    if (!activityType) {
      res.status(400).json({ error: "BAD_REQUEST", message: "activityType is required" });
      return;
    }

    const optionSlot = (generationSlot ?? layoutVariant) as string | undefined;

    console.log(`[GEN] Slot ${optionSlot ?? "–"}: Starting (type=${activityType})`);

    const title = options?.title || parsedPromptData?.topic || activityType;
    const grade =
      (typeof gradeBody === "string" && gradeBody.trim()
        ? gradeBody.trim()
        : null) ??
      options?.gradeLevel ??
      parsedPromptData?.gradeLevel ??
      "General";
    const topic =
      (typeof topicBody === "string" && topicBody.trim()
        ? topicBody.trim()
        : null) ??
      parsedPromptData?.topic ??
      originalPrompt ??
      title;
    const targetWord = parsedPromptData?.targetWord;
    const optRecord = (options || {}) as Record<string, unknown>;
    const rawQt = optRecord.questionTypes;
    const questionTypesFromClient = Array.isArray(rawQt)
      ? (rawQt as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const useCustomTypes = questionTypesFromClient.length > 0;
    const scienceMode = subjectId === "science" || String(subject || "").toLowerCase().includes("science");
    const sid = String(subjectId || "").toLowerCase();
    const isReading = sid === "reading";
    /** Same activity type, different pedagogical option: Quick Gen sends layoutVariant A/B/C → Standard Practice / Interactive Exploration / Visual Application. */
    const variantInstructionGeneric = layoutVariant
      ? [
          structuralVariants
            ? `This is option ${layoutVariant} of THREE DISTINCT WORKSHEET OPTIONS (A=Standard Practice, B=Interactive Exploration, C=Visual Application). Follow ONLY activity type "${activityType}". Produce complete, topic-specific content; do not substitute a different activity type.`
            : `OPTION ${layoutVariant} of three: A=Standard Practice (layout "standard"), B=Interactive Exploration (layout "boxed"), C=Visual Application (layout "two_column"). Same activity type "${activityType}"; instructional style MUST match this letter and MUST differ from the other two in task wording and scaffolding.`,
          buildLayoutVariantInstruction(activityType, layoutVariant),
          activityType === "math_practice" || activityType === "math_word_problems"
            ? mathContentRulesForSlot(optionSlot)
            : "",
          activityType === "science_concept_practice" ? scienceConceptContentRulesForSlot(optionSlot) : "",
        ]
          .filter((s) => String(s).trim().length > 0)
          .join("\n\n")
      : "";
    /** Reading: same A/B/C intro + math/science slot rules when applicable, but no buildLayoutVariantInstruction (organizer/matching/diagram improvisation). */
    const variantInstructionReading = layoutVariant
      ? [
          structuralVariants
            ? `This is option ${layoutVariant} of THREE DISTINCT WORKSHEET OPTIONS (A=Standard Practice, B=Interactive Exploration, C=Visual Application). Follow ONLY activity type "${activityType}". Produce complete, topic-specific content; do not substitute a different activity type.`
            : `OPTION ${layoutVariant} of three: A=Standard Practice (layout "standard"), B=Interactive Exploration (layout "boxed"), C=Visual Application (layout "two_column"). Same activity type "${activityType}"; instructional style MUST match this letter and MUST differ from the other two in task wording and scaffolding.`,
          activityType === "math_practice" || activityType === "math_word_problems"
            ? mathContentRulesForSlot(optionSlot)
            : "",
          activityType === "science_concept_practice" ? scienceConceptContentRulesForSlot(optionSlot) : "",
        ]
          .filter((s) => String(s).trim().length > 0)
          .join("\n\n")
      : "";
    const differentiationBlock = buildDifferentiationBlock(differentiation);
    const detailsNote = details ? `\nTeacher's specific request: "${details}"` : "";
    const subjectModeBlocks: string[] = [];
    if (scienceMode) subjectModeBlocks.push(SCIENCE_SUBJECT_BLOCK);
    if (sid === "reading") subjectModeBlocks.push(READING_SUBJECT_BLOCK);
    if (["reading", "writing", "ell"].includes(sid)) subjectModeBlocks.push(ELA_SUBJECT_BLOCK);
    if (sid === "math") subjectModeBlocks.push(buildMathSubjectBlock(String(topic)));
    if (sid === "social") subjectModeBlocks.push(buildSocialSubjectBlock(String(topic)));
    const subjectBlock = subjectModeBlocks.length ? `\n${subjectModeBlocks.join("\n")}\n` : "";

    const quickGenDistinctBlock = layoutVariant
      ? `
QUICK GEN — HARD STRUCTURE DIFFERENTIATION (REQUIRED — NOT OPTIONAL):
- Option A (problem_set): MUST be ONLY direct practice. No explanation / "how do you know" / justify prompts except at most ONE optional brief explanation across the ENTIRE worksheet (or zero if the activity is pure drill). No partner or discussion framing.
- Option B (reasoning_set): MUST include reasoning-style prompts on AT LEAST 50% of all scored questions or items (count every question in math sections, science_short_response, and comparable short-answer items; round up). Generic recall alone is insufficient for B.
- Option C (visual_set): MUST include at least ONE required task that explicitly uses one of: draw, label, sort, table, diagram, or model—in the question text OR section instructions (layout alone does not count).

QUICK GEN — STEM VARIATION (REQUIRED):
- Each option MUST use different sentence stems and different section instruction openers. Do not recycle the same opening phrase across A, B, and C for the same purpose.
- Option A (problem_set): Do NOT default to "Solve…", "Explain…", or "What is…" as the dominant pattern—prefer "Compute…", "Find…", "Determine…", "Write the equation…".
- Option B (reasoning_set): MUST use explanation/reasoning language (including "Explain your reasoning…" / "How do you know…" where required)—this is an exception to avoiding generic "Explain…" on A/C.
- Option C (visual_set): Lead with visual/organizational verbs: "Sketch…", "Label…", "Sort…", "Complete the table…", "Draw…", "Use a number line…".
- Never paste identical section instructions (e.g., the same "Solve each problem" line) across A/B/C without rewriting into a different structure.

QUICK GEN — ANTI-DUPLICATION (STRICT):
- Do not reuse question stems, scenario setups, or parallel word problems across A/B/C. Do not lightly reword one worksheet three times—change task TYPE and stems, not only numbers.
- Never return markdown code fences or any text outside the JSON object.
`
      : "";

    const quickGenContentTypeFlag = buildQuickGenContentTypeFlag(optionSlot);
    const quickGenFailsafeRule = layoutVariant
      ? `
FINAL FAILSAFE RULE: If this worksheet could be confused with another Quick Gen variant (A, B, or C), mentally regenerate it with a different structure before outputting JSON.`
      : "";

    const lvForPrompt = String(layoutVariant || "").toUpperCase();
    const mathSlotRuleLine =
      layoutVariant && (activityType === "math_practice" || activityType === "math_word_problems")
        ? `
When this request is Quick Gen: follow the "MATH CONTENT — OPTION ${lvForPrompt}" block in VARIANT INSTRUCTIONS at the end of this prompt. Stems and scenarios must differ from the other two options for this topic.`
        : "";
    const scienceConceptSlotRuleLine =
      layoutVariant && activityType === "science_concept_practice"
        ? `
When this request is Quick Gen: follow the "SCIENCE CONCEPT — OPTION ${lvForPrompt}" block in VARIANT INSTRUCTIONS at the end of this prompt. Option B MUST include "Why…", "How do you know…", and "Explain your reasoning…" across items; Option C MUST include a sorting task OR table OR diagram instruction.`
        : "";

    const mathPracticeThisSlotLine =
      layoutVariant && activityType === "math_practice"
        ? lvForPrompt === "B"
          ? `
THIS REQUEST IS OPTION B ONLY (reasoning_set): Explanation/reasoning language on ≥50% of items; do not use the same stems as Option A; obey HARD STRUCTURE + STEM VARIATION rules above.`
          : lvForPrompt === "C"
            ? `
THIS REQUEST IS OPTION C ONLY (visual_set): At least one item MUST explicitly require number line, table, draw, or model per MATH CONTENT — OPTION C; obey STEM VARIATION rules above.`
            : `
THIS REQUEST IS OPTION A ONLY (problem_set): Equations only in question text—no explanation prompts except at most ONE optional brief check for the whole section.`
        : "";

    const mathWordThisSlotLine =
      layoutVariant && activityType === "math_word_problems"
        ? lvForPrompt === "B"
          ? `
THIS REQUEST IS OPTION B ONLY (reasoning_set): Must include explanation language on ≥50% of word problems; obey HARD STRUCTURE + STEM VARIATION rules above.`
          : lvForPrompt === "C"
            ? `
THIS REQUEST IS OPTION C ONLY (visual_set): At least one problem MUST explicitly require draw/table/number line/model per MATH CONTENT — OPTION C; obey STEM VARIATION rules above.`
            : `
THIS REQUEST IS OPTION A ONLY (problem_set): Straight solve-and-answer scenarios—equations-only style prompts where applicable; at most ONE optional reasoning line for the entire section.`
        : "";

    /** Section-level math rules: different question/instruction content per A/B/C (not only global prompt text). */
    const mathSlotSectionRules =
      layoutVariant && (activityType === "math_practice" || activityType === "math_word_problems")
        ? (lvForPrompt === "A"
            ? `
SECTION-LEVEL OVERRIDES (Quick Gen Option A — math_practice / math_word_problems):
- The section "instructions" string MUST be direct and MUST start with one of: "Compute", "Find", or "Determine" (first word, after trimming).
- NO explanation prompts inside ANY question "text" field—no "Explain…", "Show how you know", "Why", or "reasoning" in question text. Only the problem/equation/scenario and answer blank.`
            : lvForPrompt === "B"
              ? `
SECTION-LEVEL OVERRIDES (Quick Gen Option B — math_practice / math_word_problems):
- At least 50% of questions MUST include a second sentence IN the question "text" field (same string): append either "Explain your reasoning." OR "Show how you know." (exactly one of these two sentences per qualifying question). This MUST appear inside "text", not only in section "instructions".`
              : `
SECTION-LEVEL OVERRIDES (Quick Gen Option C — math_practice / math_word_problems):
- At least ONE question "text" MUST explicitly contain one of these phrases (verbatim): "Draw", "Model", "Use a number line", OR "Complete the table" (choose one clear imperative per that item).`)
        : "";

    const scienceConceptSectionRules =
      layoutVariant && activityType === "science_concept_practice"
        ? lvForPrompt === "B"
          ? `
SECTION-LEVEL OVERRIDES (Quick Gen Option B — science_short_response):
- At least 3 questions MUST each explicitly include one of these in the question "text" (spread across items): a "Why…" prompt, a "How do you know…" prompt, and an "Explain your reasoning…" prompt (three distinct questions, visible wording).`
          : lvForPrompt === "C"
            ? `
SECTION-LEVEL OVERRIDES (Quick Gen Option C — science_short_response):
- REQUIRED: Either the science_short_response "instructions" field OR at least one question "text" MUST explicitly include one of: "Draw and label", OR "Sort into categories", OR "Complete the table" (verbatim phrase).`
            : ""
        : "";

    const quickGenInstructionPrefixRules = layoutVariant
      ? `
QUICK GEN — OPTION-SPECIFIC "instructions" GENERATION (REQUIRED; applies to math_practice, math_word_problems, science_short_response):
- Apply ONLY the row for THIS request's layoutVariant (A, B, or C). The FIRST WORD of the section "instructions" string MUST comply with that row.
- Option A (Standard): MUST start with: Compute, Find, or Determine. Do NOT use explanation language in "instructions" (no explain, justify, why, how do you know, reasoning, or describe your thinking).
- Option B (Interactive): MUST start with: Explain, Describe, or Justify. "instructions" MUST include reasoning prompts (direct students to explain thinking, show how they know, or justify)—and question-level rules below still apply.
- Option C (Visual): MUST start with: Draw, Model, Organize, or Sort. "instructions" MUST require at least one visual/modeling/organizational task on the worksheet.
`
      : "";

    const criticalSectionUniqueness = layoutVariant
      ? `
CRITICAL: If the sections or questions could appear in another option (A, B, or C) with only small wording changes, regenerate them with a DIFFERENT task structure.`
      : "";

    const templateCopyWarning = `
IMPORTANT: Do NOT copy example instructions or wording below. You MUST generate fresh instructions and stems from the Quick Gen rules above (and VARIANT INSTRUCTIONS at the end of this prompt). Example JSON blocks are STRUCTURE ONLY. DO NOT reuse, imitate, or adapt ANY example wording, numbers, or phrasing. Doing so is a failure.
`;

    const finalSelfCheckBlock = layoutVariant
      ? `
FINAL SELF-CHECK (MANDATORY BEFORE OUTPUT):
- Are instructions clearly different across A, B, and C?
- Are question types different (not just numbers)?
- Does Option B include reasoning prompts?
- Does Option C include a visual/modeling task?
- If ANY answer is NO → regenerate internally before returning JSON.
`
      : "";

    const generateContentPlaceholder = "<GENERATE ORIGINAL CONTENT BASED ON RULES — DO NOT COPY EXAMPLES>";
    const jsonPlaceholderList = (n: number) =>
      Array.from({ length: n }, () => JSON.stringify(generateContentPlaceholder)).join(",");

    const criticalAntiExampleBlock = `
CRITICAL: You MUST NOT reuse or imitate any example content shown in this prompt. All question text, instructions, and wording must be newly generated and unique to this request.
`;

    const mandatoryContentDiversity = `
MANDATORY: Each worksheet must feel like it was written independently. If any section resembles a template example or another option (A, B, or C), regenerate it with completely different wording and structure.`;

    const mixedQuestionTypesInstruction = !useCustomTypes
      ? `
MIXED QUESTION TYPES (when options.questionTypes is empty or omitted):
If no question types are specified in options:
- Generate a mix of question types across the worksheet where the activity schema includes "questions" arrays:
  - multiple choice
  - short answer
  - reasoning (essay or short explanation prompts)
  - visual (when applicable: draw, label, diagram, table)
- Do NOT generate only one question type for the entire worksheet when multiple types are possible for this activity.
`
      : "";

    const questionTypesClientInstruction = useCustomTypes
      ? `
CLIENT QUESTION TYPE FILTER (options.questionTypes is set):
The teacher limited question types to: ${JSON.stringify(questionTypesFromClient)}.
Use only "question_type" values that fit these selections (standard values: multiple_choice, short_answer, true_false, fill_in_blank, essay). Map "reasoning" to essay or short_answer with explanation-style stems; map "visual" to items that require drawing, labeling, diagrams, or tables where the schema allows.
`
      : "";

    const optRecordForPrompt = (options || {}) as Record<string, unknown>;
    const sharedPromptParts: Omit<
      WorksheetSystemPromptParts,
      | "quickGenDistinctBlock"
      | "quickGenInstructionPrefixRules"
      | "variantInstruction"
      | "quickGenFailsafeRule"
      | "criticalSectionUniqueness"
      | "finalSelfCheckBlock"
    > = {
      criticalAntiExampleBlock,
      quickGenContentTypeFlag,
      grade,
      activityType,
      title,
      topic,
      subject: typeof subject === "string" ? subject : undefined,
      targetWord,
      options: optRecordForPrompt,
      subjectBlock,
      differentiationBlock,
      mixedQuestionTypesInstruction,
      questionTypesClientInstruction,
      templateCopyWarning,
      generateContentPlaceholder,
      jsonPlaceholderList,
      scienceConceptSlotRuleLine,
      scienceConceptSectionRules,
      mathSlotRuleLine,
      mathPracticeThisSlotLine,
      mathSlotSectionRules,
      mathWordThisSlotLine,
      detailsNote,
      mandatoryContentDiversity,
    };

    const genericParts: WorksheetSystemPromptParts = {
      ...sharedPromptParts,
      quickGenDistinctBlock,
      quickGenInstructionPrefixRules,
      variantInstruction: variantInstructionGeneric,
      quickGenFailsafeRule,
      criticalSectionUniqueness,
      finalSelfCheckBlock,
    };

    const readingParts: WorksheetSystemPromptParts = {
      ...sharedPromptParts,
      quickGenDistinctBlock: "",
      quickGenInstructionPrefixRules: "",
      variantInstruction: variantInstructionReading,
      quickGenFailsafeRule: "",
      criticalSectionUniqueness: "",
      finalSelfCheckBlock: "",
    };

    const systemPrompt = isReading
      ? buildReadingWorksheetSystemPrompt(readingParts)
      : buildGenericWorksheetSystemPrompt(genericParts);

    const topicExtra =
      scienceMode && /water\s*cycle/i.test(String(topic))
        ? " Emphasize evaporation, condensation, precipitation, collection/runoff, energy from the sun, water vapor, and changes of state; use those terms in labels, vocabulary, and process steps."
        : "";

    const scienceActivityExtra =
      scienceMode && activityType === "science_concept_practice"
        ? " Word bank must use real domain terms. Questions must require science explanations only—no narrative or story prompts."
        : scienceMode && activityType === "sequence_chart"
        ? " Steps must be science process stages, not story events or characters."
        : scienceMode && activityType === "label_diagram"
        ? " Diagram parts must be scientifically accurate for the topic."
        : "";

    let layoutSlotHints = "";
    if (layoutVariant && activityType === "label_diagram") {
      layoutSlotHints += ` Required JSON field: diagramLayout="${labelDiagramLayoutEnumForSlot(String(optionSlot))}".`;
    }
    if (layoutVariant && (activityType === "math_practice" || activityType === "math_word_problems")) {
      layoutSlotHints += ` Required JSON field on the math section: mathPracticeLayout="${mathPracticeLayoutEnumForSlot(String(optionSlot))}".`;
    }
    if (layoutVariant && activityType === "science_concept_practice") {
      layoutSlotHints += ` Required on science_short_response: layoutRhythm="${mathPracticeLayoutEnumForSlot(String(optionSlot))}"; vary spacing and question count per the LAYOUT STYLE rules.`;
    }

    const userMsg = layoutVariant
      ? `Generate option ${layoutVariant} worksheet content. Activity: "${activityType}". Topic: "${topic}". Grade: ${grade}.${topicExtra}${scienceActivityExtra}${layoutSlotHints}
REMINDER FOR THIS SLOT: A = problem_set (direct practice only). B = reasoning_set (≥50% reasoning prompts). C = visual_set (one required draw/label/sort/table/diagram/model task). Obey STEM VARIATION: do not use the same openers as you would for the other two options ("Solve…"/"Explain…"/"What is…" patterns must differ structurally).
ANTI-DUPLICATION: Invent fresh stems and scenarios for THIS option only—do not reuse or lightly reword content meant for the other two parallel generations; change task structure, not only layout.
Return ONLY raw JSON (no markdown).`
      : `Generate one worksheet for activity type "${activityType}" about "${topic}". Grade: ${grade}.${topicExtra}${scienceActivityExtra} Follow the SECTION GENERATION RULES for this activity type exactly. Return ONLY raw JSON (no markdown).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      console.error(`[GEN] Slot ${optionSlot ?? "–"}: No content from AI`);
      res.status(500).json({ error: "AI_ERROR", message: "No response from AI" });
      return;
    }

    console.log(`[GEN] Slot ${optionSlot ?? "–"}: Parsing response...`);
    let result: any;
    try {
      result = JSON.parse(extractJsonPayload(rawContent));
    } catch {
      result = safeParseJSON(rawContent);
    }
    if (!result) {
      console.error(`[GEN] Slot ${optionSlot ?? "–"}: JSON parse failed`);
      res.status(500).json({ error: "PARSE_FAILED", message: "AI returned malformed JSON" });
      return;
    }

    // Ensure worksheet_id and section ids
    if (result.worksheet) {
      validateAndRepairWorksheet(
        result.worksheet,
        activityType,
        String(topic),
        grade,
        sid,
        (options || {}) as Record<string, unknown>,
        optionSlot
      );
      hoistInstructionalLanguageToSectionInstructions(result.worksheet);
      ensurePassageIntegrityOrRewriteQuestions(result.worksheet);
      sanitizeWorksheetQuestionTexts(result.worksheet);
      clearStudentWritingCellsFromWorksheet(result.worksheet, String(topic));
      if (useCustomTypes) {
        filterWorksheetQuestionsByTypes(result.worksheet, questionTypesFromClient);
      }
      if (optionSlot) {
        applyLayoutVariantEnforcement(result.worksheet, optionSlot, String(topic));
      }
      result.worksheet.worksheet_id = result.worksheet.worksheet_id || randomUUID();
      if (Array.isArray(result.worksheet.sections)) {
        result.worksheet.sections = result.worksheet.sections.map((s: any, i: number) => ({
          ...s,
          id: s.id || `section_${i + 1}`,
        }));
      }
      // Merge options into worksheet for the editor
      result.worksheet.settings = {
        templateType: activityType,
        theme: "clean",
        includeName: options?.includeName ?? true,
        includeDate: options?.includeDate ?? true,
        generateAnswerKey: false,
        fontStyle: options?.fontStyle || "clean",
        borderStyle: options?.borderStyle || "none",
        colorScheme: options?.colorScheme || "black & white",
        orientation: options?.orientation || "portrait",
        gradeLevel: grade,
        teacherInfo: options?.teacherInfo || "",
      };
    }

    const baseOptionMetadata = buildOptionMetadata({
      activityType,
      topic,
      subject,
      subjectId,
      familyLabel: variantFamilyLabel,
      layoutVariant: optionSlot,
    });
    const optionMetadata =
      result.worksheet
        ? {
            ...baseOptionMetadata,
            ...deriveOptionMetadataFromWorksheet(result.worksheet, String(topic)),
          }
        : baseOptionMetadata;
    if (result.worksheet) {
      const layoutType = ACTIVITY_TO_LAYOUT[activityType] || "default";
      const pg = pageLayoutForSlot(optionSlot);
      result.worksheet.quickGenMeta = {
        ...(result.worksheet.quickGenMeta || {}),
        activityType,
        layoutType,
        layoutVariant: optionSlot,
        pageLayout: pg,
      };
      result.worksheet.layout = pg;
      result.worksheet.description = optionMetadata.shortDescription;
    }
    result.optionMetadata = optionMetadata;

    console.log(`[GEN] Slot ${optionSlot ?? "–"}: Done ✓`);
    res.json(result);
  } catch (err) {
    const lv = (req as Request).body?.layoutVariant;
    console.error(`[GEN] Layout ${lv ?? "–"}: Error —`, err);
    res.status(500).json({ error: "GENERATION_FAILED", message: "Failed to generate worksheet" });
  }
});

export default router;
