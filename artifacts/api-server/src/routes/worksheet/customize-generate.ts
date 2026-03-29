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
    /** Same activity type, different pedagogical option: Quick Gen sends layoutVariant A/B/C → Standard Practice / Interactive Exploration / Visual Application. */
    const variantInstruction = layoutVariant
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

    // Build sections based on activity type
    const systemPrompt = `${criticalAntiExampleBlock}
You are an expert elementary school worksheet content generator.
Given an activity type and options, generate the specific content for a worksheet.

OUTPUT CONTRACT (STRICT):
- Return ONLY one JSON object. No markdown fences (no \`\`\`json), no commentary before or after the JSON.
- Fill ALL placeholder fields with real, grade-appropriate content for the topic. No empty "sections" arrays. No empty "questions" arrays for math_practice or math_word_problems.
${quickGenDistinctBlock}
${quickGenContentTypeFlag}
Return ONLY valid JSON with this structure:
{
  "worksheet": {
    "worksheet_id": "${randomUUID()}",
    "title": "Worksheet title",
    "subject": "subject area",
    "gradeLevel": "${grade}",
    "language": "English",
    "template_type": "${activityType}",
    "sections": [ ... ]
  }
}

Activity type: ${activityType}
Title: ${title}
Grade: ${grade}
Topic: ${topic}
${targetWord ? `Target word: ${targetWord}` : ""}
Options: ${JSON.stringify(options || {})}
${subjectBlock}${differentiationBlock}
${mixedQuestionTypesInstruction}${questionTypesClientInstruction}
SECTION GENERATION RULES BY TYPE:
${templateCopyWarning}
${quickGenInstructionPrefixRules}

For mind_map:
Generate sections: [{ "id":"s1", "type":"mind_map", "title": "${title}", "centerTerm": "${topic}", "branches": [${jsonPlaceholderList(4)}], "branchCount": ${options?.branchCount || 4} }]

For venn_diagram:
Generate sections: [{ "id":"s1", "type":"venn_diagram", "title":"${title}", "leftLabel": "${options?.leftLabel || 'Topic A'}", "rightLabel": "${options?.rightLabel || 'Topic B'}", "centerLabel": "${options?.centerLabel || 'Both'}", "leftItems": [${jsonPlaceholderList(3)}], "rightItems": [${jsonPlaceholderList(3)}], "centerItems": [${jsonPlaceholderList(2)}] }]

For kwl_chart:
Generate sections: [{ "id":"s1", "type":"kwl_chart", "title":"${title}", "variant": "${options?.variant || 'KWL (3 columns)'}", "knowItems": [${jsonPlaceholderList(2)}], "wantItems": [${jsonPlaceholderList(2)}], "learnedItems": [], "rowCount": ${options?.rowCount || 8} }]

For sequence_chart:
Generate sections: [{ "id":"s1", "type":"sequence_chart", "title":"${title}", "steps": [{"id":"step1","number":1,"title":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"step2","number":2,"title":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"step3","number":3,"title":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"step4","number":4,"title":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"}] }]
If the subject is Science, steps must describe a real process or cycle (e.g., water moving through stages), not a fictional plot or story sequence.

For frayer_model:
Generate sections: [{ "id":"s1", "type":"frayer_model", "title":"${title}", "centerTerm":"${targetWord || topic}", "q1Label":"${options?.q1Label || 'Definition'}", "q2Label":"${options?.q2Label || 'Example'}", "q3Label":"${options?.q3Label || 'Non-Example'}", "q4Label":"${options?.q4Label || 'Draw It'}", "q1Content":"${generateContentPlaceholder}", "q2Content":"${generateContentPlaceholder}", "q3Content":"${generateContentPlaceholder}", "q4Content":"${generateContentPlaceholder}" }]

For writing_prompt:
Generate sections: [
  { "id":"s1", "type":"writing_prompt_header", "title":"${title}", "prompt":"${options?.prompt || 'Generate an engaging ' + (options?.promptStyle || 'creative') + ' writing prompt about ' + topic + ' for grade ' + grade}", "lineCount":${options?.lineCount || 15}, "lineStyle":"${options?.lineStyle || 'wide ruled'}", "illustrationBox":"${options?.illustrationBox || 'None'}" },
  ${options?.wordBank ? `{ "id":"s2", "type":"word_bank", "title":"Word Bank", "words":[${jsonPlaceholderList(6)}] }` : ''}
]

For acrostic:
Generate sections: [{ "id":"s1", "type":"acrostic", "title":"${title}", "acrosticWord":"${options?.acrosticWord || targetWord || topic.split(' ')[0] || 'WORD'}", "linesPerLetter":${options?.linesPerLetter || 1}, "styleHint":"${options?.styleHint || 'Phrase'}" }]

For word_search:
Generate a word list of 10-15 words related to the topic.
Generate sections: [{ "id":"s1", "type":"word_search_full", "title":"${title}", "wordList":[${jsonPlaceholderList(10)}], "gridSize":"${options?.gridSize || '10×10'}", "directions":"${options?.directions || 'Horiz + Vertical'}", "showWordList":${options?.showWordList !== false} }]

For bingo_card:
Generate sections: [{ "id":"s1", "type":"bingo_card", "title":"${title}", "gridSize":"${options?.gridSize || '5×5'}", "freeSpace":${options?.freeSpace !== false}, "wordList":[${jsonPlaceholderList(24)}] }]

For number_bond:
Generate sections: [{ "id":"s1", "type":"number_bond", "title":"${title}", "bondCount":${options?.bondCount || 6}, "focus":"${options?.focus || 'Addition'}", "bonds":[{"whole":null,"part1":null,"part2":null}] }]
(Generate bondCount distinct bond objects with grade-appropriate whole numbers from the topic—do not copy sample numbers from any example.)

For ten_frame:
Generate sections: [{ "id":"s1", "type":"ten_frame", "title":"${title}", "frameCount":${options?.frameCount || 4}, "activity":"${generateContentPlaceholder}", "problems":[{"number":null},{"number":null},{"number":null},{"number":null}] }]
(Replace nulls with topic-appropriate values; one object per frame in problems.)

For coloring_page:
Generate sections: [{ "id":"s1", "type":"coloring_page", "title":"${title}", "theme":"${options?.theme || topic}", "size":"${options?.size || 'Full page'}", "addWritingLines":${options?.addWritingLines || false}, "lineCount":${options?.lineCount || 3}, "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>" }]

For color_by_code:
Generate the color key from the topic.
Generate sections: [{ "id":"s1", "type":"color_by_code", "title":"${title}", "codeType":"${options?.codeType || 'Sight words'}", "theme":"${options?.theme || topic}", "colorKey":[{"code":"${generateContentPlaceholder}","color":"${generateContentPlaceholder}"},{"code":"${generateContentPlaceholder}","color":"${generateContentPlaceholder}"},{"code":"${generateContentPlaceholder}","color":"${generateContentPlaceholder}"},{"code":"${generateContentPlaceholder}","color":"${generateContentPlaceholder}"}] }]

For label_diagram:
Generate EXACTLY one section of type label_diagram with:
- "diagramLayout": one of "centered_bank_below" | "diagram_left_labels_right" | "diagram_top_callouts" — MUST match the Quick Gen layout letter for this request (see user message for the required value).
- "title", "subject", "diagramSubject" (same string as the topic shown on the diagram — usually the topic or diagramSubject from options), "parts" (6–8 real part names for the topic), "wordBank": boolean
Example shape:
{ "id":"s1", "type":"label_diagram", "diagramLayout":"centered_bank_below", "title":"${title}", "diagramSubject":"${options?.diagramSubject || topic}", "subject":"${options?.diagramSubject || topic}", "parts":[${jsonPlaceholderList(6)}], "wordBank":${options?.wordBank !== false} }
If the subject is Science, parts must be real structures or stages for the topic (e.g., water cycle: evaporation, condensation, precipitation, collection, runoff, groundwater, energy from the sun) — not story elements.

For science_concept_practice:
Generate EXACTLY two sections (no other section types):
1) word_bank: 8-12 real science vocabulary words for the topic (strings only in "words").
2) science_short_response: short_answer questions asking students to explain processes, compare stages, or use vocabulary — NOT creative writing, NOT a story, NOT "imagine you are...".
${scienceConceptSlotRuleLine}
${scienceConceptSectionRules}
Include on the science_short_response object: "layoutRhythm": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message). Vary question count and "lines" per question according to the LAYOUT STYLE block for this request (clean vs scaffolded vs compact).
sections: [
  { "id":"s1", "type":"word_bank", "title":"Key vocabulary: ${topic}", "words":[${jsonPlaceholderList(8)}] },
  { "id":"s2", "type":"science_short_response", "title":"Show what you know", "layoutRhythm":"spacious", "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>", "questions":[
    { "id":"q1","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":4 },
    { "id":"q2","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":4 },
    { "id":"q3","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":4 },
    { "id":"q4","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":4 }
  ]}
]

For observation_sheet:
Generate sections: [{ "id":"s1", "type":"observation_sheet", "title":"${title}", "sections":["${generateContentPlaceholder}","${generateContentPlaceholder}","${generateContentPlaceholder}"], "includeDrawing":${options?.includeDrawing !== false} }]

For timeline:
Generate 5 events for the topic.
Generate sections: [{ "id":"s1", "type":"timeline", "title":"${title}", "orientation":"${options?.orientation || 'Horizontal'}", "events":[{"id":"e1","label":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"e2","label":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"e3","label":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"e4","label":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"},{"id":"e5","label":"${generateContentPlaceholder}","content":"${generateContentPlaceholder}"}] }]

For story_map:
Generate sections: [{ "id":"s1", "type":"story_map", "title":"${title}", "layout":"Linear", "fields":[{"label":"Characters","content":""},{"label":"Setting","content":""},{"label":"Problem","content":""},{"label":"Event 1","content":""},{"label":"Event 2","content":""},{"label":"Event 3","content":""},{"label":"Solution","content":""},{"label":"Theme","content":""}] }]

For line_matching:
Generate ${options?.pairCount || 6} matching pairs for the topic.
Generate sections: [{ "id":"s1", "type":"line_matching", "title":"${title}", "matchType":"${options?.matchType || 'Word → Definition'}", "pairs":[{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"},{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"},{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"},{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"},{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"},{"left":"${generateContentPlaceholder}","right":"${generateContentPlaceholder}"}] }]

For cut_and_sort:
Generate items for each category.
Generate sections: [{ "id":"s1", "type":"cut_and_sort", "title":"${title}", "categories":["${options?.categories?.split(',')[0]?.trim() || 'Category A'}","${options?.categories?.split(',')[1]?.trim() || 'Category B'}"], "items":[${jsonPlaceholderList(8)}] }]

For sentence_frames:
Generate ${options?.frameCount || 4} sentence frames for the topic.
Generate sections: [{ "id":"s1", "type":"sentence_frames", "title":"${title}", "frames":[{"id":"f1","stem":"${generateContentPlaceholder}"},{"id":"f2","stem":"${generateContentPlaceholder}"},{"id":"f3","stem":"${generateContentPlaceholder}"},{"id":"f4","stem":"${generateContentPlaceholder}"}], "writingLines":${options?.writingLines || 2} }]

For mini_book:
Generate sections: [{ "id":"s1", "type":"mini_book", "title":"${title}", "panelCount":${options?.panelCount || 4}, "panels":[{"id":"p1","number":1,"label":"${generateContentPlaceholder}","prompt":"${generateContentPlaceholder}"},{"id":"p2","number":2,"label":"${generateContentPlaceholder}","prompt":"${generateContentPlaceholder}"},{"id":"p3","number":3,"label":"${generateContentPlaceholder}","prompt":"${generateContentPlaceholder}"},{"id":"p4","number":4,"label":"${generateContentPlaceholder}","prompt":"${generateContentPlaceholder}"}] }]

For clock_practice:
Generate sections: [{ "id":"s1", "type":"clock_practice", "title":"${title}", "clockCount":${options?.clockCount || 6}, "precision":"${options?.precision || 'Half hour'}", "direction":"${generateContentPlaceholder}", "times":[${jsonPlaceholderList(6)}] }]

For spinner:
Generate sections: [{ "id":"s1", "type":"spinner", "title":"${title}", "sections":${options?.sections || 6}, "sectionLabels":${options?.sectionLabels ? JSON.stringify(options.sectionLabels.split(',').map((s:string)=>s.trim())) : `[${jsonPlaceholderList(6)}]`}, "recordSheet":${options?.recordSheet !== false} }]

For dice_activity:
Generate sections: [{ "id":"s1", "type":"dice_activity", "title":"${title}", "activityTitle":"${options?.activityTitle || generateContentPlaceholder}", "faces":["⚀","⚁","⚂","⚃","⚄","⚅"], "instructions":["<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>","<GENERATE>","<GENERATE>","<GENERATE>","<GENERATE>","<GENERATE>"] }]

For graph_page:
Generate sections: [{ "id":"s1", "type":"graph_page", "title":"${title}", "graphType":"${options?.graphType || 'Bar graph'}", "xLabel":"${generateContentPlaceholder}", "yLabel":"${generateContentPlaceholder}", "categories":[${jsonPlaceholderList(4)}], "maxValue":${options?.maxValue || 10} }]

For measurement:
Generate sections: [{ "id":"s1", "type":"measurement", "title":"${title}", "unit":"${options?.unit || 'Inches'}", "itemCount":${options?.itemCount || 6}, "items":[${jsonPlaceholderList(6)}] }]

For math_practice:
${mathSlotRuleLine}
${mathPracticeThisSlotLine}
${mathSlotSectionRules}
Include "mathPracticeLayout": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message for required value).
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3}
Equations must be solvable and reflect the operation implied by "${topic}". Use grade ${grade} for number size.
When "${topic}" is addition, use addition equations; when subtraction, use subtraction; when multiplication, use multiplication; when division, use division.

Generate sections: [{
  "id":"s1",
  "type":"math_practice",
  "title":"${title}",
  "mathPracticeLayout":"spacious",
  "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 }
  ]
}]

For math_word_problems:
${mathSlotRuleLine}
${mathWordThisSlotLine}
${mathSlotSectionRules}
Include "mathPracticeLayout": one of "spacious" | "scaffolded_work_boxes" | "compact_grid" — MUST match the Quick Gen layout letter (see user message).
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3}
Use scenario-based word problems based on "${topic}" (addition/subtraction/multiplication/division) and tune phrasing/number size to grade ${grade}.
Use subject "${subject}" to pick a context flavor when appropriate (e.g., classroom/real-life framing).

Generate sections: [{
  "id":"s1",
  "type":"math_word_problems",
  "title":"${title}",
  "mathPracticeLayout":"spacious",
  "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"${generateContentPlaceholder}","lines":3 }
  ]
}]

For map_activity:
Generate sections: [{ "id":"s1", "type":"map_activity", "title":"${title}", "mapType":"${options?.mapType || 'Community'}", "includeCompass":${options?.includeCompass !== false}, "includeKey":${options?.includeKey !== false} }]

For crossword:
Generate ${options?.clueCount || 8} words with clues.
Generate sections: [{ "id":"s1", "type":"crossword", "title":"${title}", "clues":[{"number":1,"direction":"Across","clue":"${generateContentPlaceholder}","answer":"${generateContentPlaceholder}"},{"number":2,"direction":"Down","clue":"${generateContentPlaceholder}","answer":"${generateContentPlaceholder}"},{"number":3,"direction":"Across","clue":"${generateContentPlaceholder}","answer":"${generateContentPlaceholder}"}] }]

For picture_sort:
Generate sections: [{ "id":"s1", "type":"picture_sort", "title":"${title}", "categories":${JSON.stringify((options?.categories || 'Category A, Category B').split(',').map((c:string)=>c.trim()))}, "cards":[${jsonPlaceholderList(8)}] }]

For trace_and_color:
Generate sections: [{ "id":"s1", "type":"tracing", "targetWord":"${options?.theme || targetWord || topic}", "instructions":"<GENERATE BASED ON QUICK GEN RULES — DO NOT DEFAULT>", "lineCount":4 }]

For word_practice (sight word):
Generate sections for a complete sight word worksheet.
Ensure targetWord is "${targetWord || topic}".
Generate: word_practice, word_sight_row, fill_blanks, sentence_practice sections.

DEFAULT for any other type:
Generate appropriate sections based on the activity type and topic.
Include 2-4 sections with real content for the topic.

Fill in ALL placeholder content with real, grade-appropriate content for "${topic}" at grade ${grade}.
${variantInstruction}${detailsNote}
${quickGenFailsafeRule}
${criticalSectionUniqueness}
${finalSelfCheckBlock}
${mandatoryContentDiversity}
Return ONLY the JSON object — no markdown, no prose.`;

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

    const optionMetadata = buildOptionMetadata({
      activityType,
      topic,
      subject,
      subjectId,
      familyLabel: variantFamilyLabel,
      layoutVariant: optionSlot,
    });
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
