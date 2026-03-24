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
  math_word_problems: "concept_practice",
  number_bond: "concept_practice",
  ten_frame: "concept_practice",
  graph_page: "concept_practice",
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

function safeParseJSON(str: string): any | null {
  try {
    const cleaned = str
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[GEN] JSON parse failed:", e);
    return null;
  }
}

// Layout variant instructions — vary structure/focus between A/B/C
const VARIANT_INSTRUCTIONS: Record<string, string> = {
  A: "Generate the most straightforward, classic layout for this activity type. Clear structure, standard organization.",
  B: "Generate a slightly more visual/graphic layout. Add more structure boxes, use headers creatively, consider columns or visual dividers.",
  C: "Generate a more scaffolded, step-by-step layout. Break tasks into smaller sub-steps, add more guidance/sentence starters if applicable.",
};

const SCIENCE_SUBJECT_BLOCK = `
SCIENCE MODE (when subject is Science):
- Use grade-appropriate science vocabulary and accurate concepts for the topic.
- Prioritize labeling, models/diagrams, sequencing processes, observation, and short explanations using domain terms.
- Do NOT replace science tasks with unrelated narrative fiction unless the activity type explicitly requires a brief evidence-based explanation.
`;

const READING_SUBJECT_BLOCK = `
READING MODE (when subject is Reading): Align content to literacy goals—comprehension, vocabulary in context, and text-based responses appropriate to the activity type.
`;

/** Call inside the request handler after `topic` is known — do not use module-level templates with ${topic}. */
function buildMathSubjectBlock(topic: string): string {
  const t = (topic || "the topic").trim();
  return `
MATHEMATICS MODE (when subject is Math): Use grade-appropriate numbers and operations implied by the topic; keep problems coherent with "${t}".
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
  title: string;
  shortDescription: string;
  includedComponents: string[];
  skillFocus: string;
  pedagogicalIntent: string;
};

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

  const fallback: OptionMetadata = {
    id: lv ? `${lv}_mixed_practice` : "opt_mixed_practice",
    layoutType: layoutTypeForActivity(input.activityType),
    title,
    shortDescription: `Practice and tasks about ${t} using a ${input.activityType} layout.`,
    includedComponents: ["Multiple sections", "Topic-specific prompts", "Grade-appropriate tasks"],
    skillFocus: "Apply understanding of the topic",
    pedagogicalIntent: "Reinforce key ideas through structured practice",
  };

  const map: Record<string, OptionMetadata> = {
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
  return {
    ...base,
    layoutType,
    id: lvKey ? `${lvKey}_${input.activityType}` : base.id,
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
    } = req.body;

    if (!activityType) {
      res.status(400).json({ error: "BAD_REQUEST", message: "activityType is required" });
      return;
    }

    const optionSlot = (generationSlot ?? layoutVariant) as string | undefined;

    console.log(`[GEN] Slot ${optionSlot ?? "–"}: Starting (type=${activityType})`);

    const title = options?.title || parsedPromptData?.topic || activityType;
    const grade = options?.gradeLevel || parsedPromptData?.gradeLevel || "General";
    const topic = parsedPromptData?.topic || originalPrompt || title;
    const targetWord = parsedPromptData?.targetWord;
    const scienceMode = subjectId === "science" || String(subject || "").toLowerCase().includes("science");
    const sid = String(subjectId || "").toLowerCase();
    // Only legacy callers that send layoutVariant + structuralVariants get the old A/B/C prompt.
    // Quick Gen uses distinct activityType per slot and should omit layoutVariant / structuralVariants.
    const variantInstruction = layoutVariant
      ? structuralVariants
        ? `This is option ${layoutVariant} of THREE DIFFERENT WORKSHEET FORMATS. Follow ONLY the rules for activity type "${activityType}". Produce complete, topic-specific content. Do not substitute a different activity type.`
        : VARIANT_INSTRUCTIONS[layoutVariant] ?? ""
      : "";
    const detailsNote = details ? `\nTeacher's specific request: "${details}"` : "";
    const subjectModeBlocks: string[] = [];
    if (scienceMode) subjectModeBlocks.push(SCIENCE_SUBJECT_BLOCK);
    if (sid === "reading") subjectModeBlocks.push(READING_SUBJECT_BLOCK);
    if (sid === "math") subjectModeBlocks.push(buildMathSubjectBlock(String(topic)));
    if (sid === "social") subjectModeBlocks.push(buildSocialSubjectBlock(String(topic)));
    const subjectBlock = subjectModeBlocks.length ? `\n${subjectModeBlocks.join("\n")}\n` : "";

    // Build sections based on activity type
    const systemPrompt = `You are an expert elementary school worksheet content generator.
Given an activity type and options, generate the specific content for a worksheet.
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
${subjectBlock}
SECTION GENERATION RULES BY TYPE:

For mind_map:
Generate sections: [{ "id":"s1", "type":"mind_map", "title": "${title}", "centerTerm": "${topic}", "branches": ["branch1", "branch2", "branch3", "branch4"], "branchCount": ${options?.branchCount || 4} }]

For venn_diagram:
Generate sections: [{ "id":"s1", "type":"venn_diagram", "title":"${title}", "leftLabel": "${options?.leftLabel || 'Topic A'}", "rightLabel": "${options?.rightLabel || 'Topic B'}", "centerLabel": "${options?.centerLabel || 'Both'}", "leftItems": ["item1","item2","item3"], "rightItems": ["item1","item2","item3"], "centerItems": ["shared1","shared2"] }]

For kwl_chart:
Generate sections: [{ "id":"s1", "type":"kwl_chart", "title":"${title}", "variant": "${options?.variant || 'KWL (3 columns)'}", "knowItems": ["fact1 about ${topic}","fact2"], "wantItems": ["question1?","question2?"], "learnedItems": [], "rowCount": ${options?.rowCount || 8} }]

For sequence_chart:
Generate sections: [{ "id":"s1", "type":"sequence_chart", "title":"${title}", "steps": [{"id":"step1","number":1,"title":"Step title","content":"Description"},{"id":"step2","number":2,"title":"Step title","content":"Description"},{"id":"step3","number":3,"title":"Step title","content":"Description"},{"id":"step4","number":4,"title":"Step title","content":"Description"}] }]
If the subject is Science, steps must describe a real process or cycle (e.g., water moving through stages), not a fictional plot or story sequence.

For frayer_model:
Generate sections: [{ "id":"s1", "type":"frayer_model", "title":"${title}", "centerTerm":"${targetWord || topic}", "q1Label":"${options?.q1Label || 'Definition'}", "q2Label":"${options?.q2Label || 'Example'}", "q3Label":"${options?.q3Label || 'Non-Example'}", "q4Label":"${options?.q4Label || 'Draw It'}", "q1Content":"Clear definition of ${targetWord || topic}", "q2Content":"Example sentence or use", "q3Content":"What it is NOT", "q4Content":"" }]

For writing_prompt:
Generate sections: [
  { "id":"s1", "type":"writing_prompt_header", "title":"${title}", "prompt":"${options?.prompt || 'Generate an engaging ' + (options?.promptStyle || 'creative') + ' writing prompt about ' + topic + ' for grade ' + grade}", "lineCount":${options?.lineCount || 15}, "lineStyle":"${options?.lineStyle || 'wide ruled'}", "illustrationBox":"${options?.illustrationBox || 'None'}" },
  ${options?.wordBank ? '{ "id":"s2", "type":"word_bank", "title":"Word Bank", "words":["word1","word2","word3","word4","word5","word6"] }' : ''}
]

For acrostic:
Generate sections: [{ "id":"s1", "type":"acrostic", "title":"${title}", "acrosticWord":"${options?.acrosticWord || targetWord || topic.split(' ')[0] || 'WORD'}", "linesPerLetter":${options?.linesPerLetter || 1}, "styleHint":"${options?.styleHint || 'Phrase'}" }]

For word_search:
Generate a word list of 10-15 words related to the topic.
Generate sections: [{ "id":"s1", "type":"word_search_full", "title":"${title}", "wordList":["WORD1","WORD2","WORD3","WORD4","WORD5","WORD6","WORD7","WORD8","WORD9","WORD10"], "gridSize":"${options?.gridSize || '10×10'}", "directions":"${options?.directions || 'Horiz + Vertical'}", "showWordList":${options?.showWordList !== false} }]

For bingo_card:
Generate sections: [{ "id":"s1", "type":"bingo_card", "title":"${title}", "gridSize":"${options?.gridSize || '5×5'}", "freeSpace":${options?.freeSpace !== false}, "wordList":["WORD1","WORD2","WORD3","WORD4","WORD5","WORD6","WORD7","WORD8","WORD9","WORD10","WORD11","WORD12","WORD13","WORD14","WORD15","WORD16","WORD17","WORD18","WORD19","WORD20","WORD21","WORD22","WORD23","WORD24"] }]

For number_bond:
Generate sections: [{ "id":"s1", "type":"number_bond", "title":"${title}", "bondCount":${options?.bondCount || 6}, "focus":"${options?.focus || 'Addition'}", "bonds":[{"whole":5,"part1":2,"part2":null},{"whole":8,"part1":null,"part2":3},{"whole":10,"part1":4,"part2":null},{"whole":7,"part1":null,"part2":5},{"whole":6,"part1":2,"part2":null},{"whole":9,"part1":null,"part2":4}] }]

For ten_frame:
Generate sections: [{ "id":"s1", "type":"ten_frame", "title":"${title}", "frameCount":${options?.frameCount || 4}, "activity":"${options?.activity || 'Draw counters'}", "problems":[{"number":3},{"number":7},{"number":5},{"number":9}] }]

For coloring_page:
Generate sections: [{ "id":"s1", "type":"coloring_page", "title":"${title}", "theme":"${options?.theme || topic}", "size":"${options?.size || 'Full page'}", "addWritingLines":${options?.addWritingLines || false}, "lineCount":${options?.lineCount || 3}, "instructions":"Color the picture below." }]

For color_by_code:
Generate the color key from the topic.
Generate sections: [{ "id":"s1", "type":"color_by_code", "title":"${title}", "codeType":"${options?.codeType || 'Sight words'}", "theme":"${options?.theme || topic}", "colorKey":[{"code":"the","color":"#FFD700"},{"code":"and","color":"#87CEEB"},{"code":"can","color":"#FF6B6B"},{"code":"up","color":"#90EE90"}] }]

For label_diagram:
Generate sections: [{ "id":"s1", "type":"label_diagram", "title":"${title}", "subject":"${options?.diagramSubject || topic}", "parts":["part1","part2","part3","part4","part5","part6"], "wordBank":${options?.wordBank !== false} }]
If the subject is Science, parts must be real structures or stages for the topic (e.g., water cycle: evaporation, condensation, precipitation, collection, runoff, groundwater, energy from the sun) — not story elements.

For science_concept_practice:
Generate EXACTLY two sections (no other section types):
1) word_bank: 8-12 real science vocabulary words for the topic (strings only in "words").
2) science_short_response: 4-6 short_answer questions asking students to explain processes, compare stages, or use vocabulary — NOT creative writing, NOT a story, NOT "imagine you are...".
sections: [
  { "id":"s1", "type":"word_bank", "title":"Key vocabulary: ${topic}", "words":["term1","term2","term3","term4","term5","term6","term7","term8"] },
  { "id":"s2", "type":"science_short_response", "title":"Show what you know", "instructions":"Use the vocabulary words above. Write in complete sentences using science ideas.", "questions":[
    { "id":"q1","question_type":"short_answer","text":"Explain ...","lines":4 },
    { "id":"q2","question_type":"short_answer","text":"Compare ...","lines":4 },
    { "id":"q3","question_type":"short_answer","text":"What causes ...","lines":4 },
    { "id":"q4","question_type":"short_answer","text":"Define ... in your own words","lines":4 }
  ]}
]

For observation_sheet:
Generate sections: [{ "id":"s1", "type":"observation_sheet", "title":"${title}", "sections":["My Hypothesis:","What I Observed:","What I Learned:"], "includeDrawing":${options?.includeDrawing !== false} }]

For timeline:
Generate 5 events for the topic.
Generate sections: [{ "id":"s1", "type":"timeline", "title":"${title}", "orientation":"${options?.orientation || 'Horizontal'}", "events":[{"id":"e1","label":"Event 1","content":""},{"id":"e2","label":"Event 2","content":""},{"id":"e3","label":"Event 3","content":""},{"id":"e4","label":"Event 4","content":""},{"id":"e5","label":"Event 5","content":""}] }]

For story_map:
Generate sections: [{ "id":"s1", "type":"story_map", "title":"${title}", "layout":"Linear", "fields":[{"label":"Characters","content":""},{"label":"Setting","content":""},{"label":"Problem","content":""},{"label":"Event 1","content":""},{"label":"Event 2","content":""},{"label":"Event 3","content":""},{"label":"Solution","content":""},{"label":"Theme","content":""}] }]

For line_matching:
Generate ${options?.pairCount || 6} matching pairs for the topic.
Generate sections: [{ "id":"s1", "type":"line_matching", "title":"${title}", "matchType":"${options?.matchType || 'Word → Definition'}", "pairs":[{"left":"term1","right":"match1"},{"left":"term2","right":"match2"},{"left":"term3","right":"match3"},{"left":"term4","right":"match4"},{"left":"term5","right":"match5"},{"left":"term6","right":"match6"}] }]

For cut_and_sort:
Generate items for each category.
Generate sections: [{ "id":"s1", "type":"cut_and_sort", "title":"${title}", "categories":["${options?.categories?.split(',')[0]?.trim() || 'Category A'}","${options?.categories?.split(',')[1]?.trim() || 'Category B'}"], "items":["item1","item2","item3","item4","item5","item6","item7","item8"] }]

For sentence_frames:
Generate ${options?.frameCount || 4} sentence frames for the topic.
Generate sections: [{ "id":"s1", "type":"sentence_frames", "title":"${title}", "frames":[{"id":"f1","stem":"The ___ is important because ___"},{"id":"f2","stem":"I think ___ because ___"},{"id":"f3","stem":"One fact about ___ is ___"},{"id":"f4","stem":"I learned that ___ helps ___"}], "writingLines":${options?.writingLines || 2} }]

For mini_book:
Generate sections: [{ "id":"s1", "type":"mini_book", "title":"${title}", "panelCount":${options?.panelCount || 4}, "panels":[{"id":"p1","number":1,"label":"Page 1","prompt":""},{"id":"p2","number":2,"label":"Page 2","prompt":""},{"id":"p3","number":3,"label":"Page 3","prompt":""},{"id":"p4","number":4,"label":"Page 4","prompt":""}] }]

For clock_practice:
Generate sections: [{ "id":"s1", "type":"clock_practice", "title":"${title}", "clockCount":${options?.clockCount || 6}, "precision":"${options?.precision || 'Half hour'}", "direction":"${options?.direction || 'Draw the hands'}", "times":["1:00","2:30","3:00","4:30","5:00","6:30"] }]

For spinner:
Generate sections: [{ "id":"s1", "type":"spinner", "title":"${title}", "sections":${options?.sections || 6}, "sectionLabels":${options?.sectionLabels ? JSON.stringify(options.sectionLabels.split(',').map((s:string)=>s.trim())) : '["Option 1","Option 2","Option 3","Option 4","Option 5","Option 6"]'}, "recordSheet":${options?.recordSheet !== false} }]

For dice_activity:
Generate sections: [{ "id":"s1", "type":"dice_activity", "title":"${title}", "activityTitle":"${options?.activityTitle || 'Write'}", "faces":["⚀","⚁","⚂","⚃","⚄","⚅"], "instructions":["Action for 1","Action for 2","Action for 3","Action for 4","Action for 5","Action for 6"] }]

For graph_page:
Generate sections: [{ "id":"s1", "type":"graph_page", "title":"${title}", "graphType":"${options?.graphType || 'Bar graph'}", "xLabel":"Categories", "yLabel":"Count", "categories":["Category A","Category B","Category C","Category D"], "maxValue":${options?.maxValue || 10} }]

For measurement:
Generate sections: [{ "id":"s1", "type":"measurement", "title":"${title}", "unit":"${options?.unit || 'Inches'}", "itemCount":${options?.itemCount || 6}, "items":["pencil","crayon","eraser","book","ruler","paper clip"] }]

For math_practice:
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"<equation with blanks>","lines":3}
Equations must be solvable and reflect the operation implied by "${topic}". Use grade ${grade} for number size.
When "${topic}" is addition, use addition equations; when subtraction, use subtraction; when multiplication, use multiplication; when division, use division.

Generate sections: [{
  "id":"s1",
  "type":"math_practice",
  "title":"${title}",
  "instructions":"Solve each equation and write the answer in the blank.",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"2 + 3 = ____","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"4 + 6 = ____","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"7 + 5 = ____","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"10 + 9 = ____","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"12 + 4 = ____","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"15 + 7 = ____","lines":3 }
  ]
}]

For math_word_problems:
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"<scenario ending with answer blank>","lines":3}
Use scenario-based word problems based on "${topic}" (addition/subtraction/multiplication/division) and tune phrasing/number size to grade ${grade}.
Use subject "${subject}" to pick a context flavor when appropriate (e.g., classroom/real-life framing).

Generate sections: [{
  "id":"s1",
  "type":"math_word_problems",
  "title":"${title}",
  "instructions":"Read each scenario and solve. Write the answer in the blank.",
  "questions":[
    { "id":"q1","question_type":"short_answer","text":"Tammy has 5 apples and gets 3 more. How many apples does she have? ____","lines":3 },
    { "id":"q2","question_type":"short_answer","text":"Jamal collects 8 stickers and receives 4 more. How many stickers does he have now? ____","lines":3 },
    { "id":"q3","question_type":"short_answer","text":"There are 6 books on the table. The teacher adds 7 more books. How many books are there? ____","lines":3 },
    { "id":"q4","question_type":"short_answer","text":"Mia has 10 crayons. She buys 2 more packs with 5 crayons each. How many crayons does Mia have? ____","lines":3 },
    { "id":"q5","question_type":"short_answer","text":"A class has 9 students. 6 more students join. How many students are in the class now? ____","lines":3 },
    { "id":"q6","question_type":"short_answer","text":"Leah is making bracelets. She starts with 7 beads and adds 8 more beads. How many beads does she have? ____","lines":3 }
  ]
}]

For map_activity:
Generate sections: [{ "id":"s1", "type":"map_activity", "title":"${title}", "mapType":"${options?.mapType || 'Community'}", "includeCompass":${options?.includeCompass !== false}, "includeKey":${options?.includeKey !== false} }]

For crossword:
Generate ${options?.clueCount || 8} words with clues.
Generate sections: [{ "id":"s1", "type":"crossword", "title":"${title}", "clues":[{"number":1,"direction":"Across","clue":"clue 1","answer":"WORD1"},{"number":2,"direction":"Down","clue":"clue 2","answer":"WORD2"},{"number":3,"direction":"Across","clue":"clue 3","answer":"WORD3"}] }]

For picture_sort:
Generate sections: [{ "id":"s1", "type":"picture_sort", "title":"${title}", "categories":${JSON.stringify((options?.categories || 'Category A, Category B').split(',').map((c:string)=>c.trim()))}, "cards":["item1","item2","item3","item4","item5","item6","item7","item8"] }]

For trace_and_color:
Generate sections: [{ "id":"s1", "type":"tracing", "targetWord":"${options?.theme || targetWord || topic}", "instructions":"Trace and then color the image.", "lineCount":4 }]

For word_practice (sight word):
Generate sections for a complete sight word worksheet.
Ensure targetWord is "${targetWord || topic}".
Generate: word_practice, word_sight_row, fill_blanks, sentence_practice sections.

DEFAULT for any other type:
Generate appropriate sections based on the activity type and topic.
Include 2-4 sections with real content for the topic.

Fill in ALL placeholder content with real, grade-appropriate content for "${topic}" at grade ${grade}.
${variantInstruction}${detailsNote}
Return ONLY valid JSON.`;

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

    const userMsg = layoutVariant
      ? `Generate Layout ${layoutVariant} worksheet content. Activity: "${activityType}". Topic: "${topic}". Grade: ${grade}.${topicExtra}${scienceActivityExtra} Return ONLY valid JSON.`
      : `Generate one worksheet for activity type "${activityType}" about "${topic}". Grade: ${grade}.${topicExtra}${scienceActivityExtra} Follow the SECTION GENERATION RULES for this activity type exactly. Return ONLY valid JSON.`;

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
      result = JSON.parse(rawContent);
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
      result.worksheet.quickGenMeta = {
        ...(result.worksheet.quickGenMeta || {}),
        activityType,
        layoutType,
      };
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
