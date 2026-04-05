/**
 * Subject-aware worksheet family planner for Quick Gen.
 * Each subject exposes activity *families*; each family maps to three distinct
 * `activityType` values (options A/B/C). The backend customize-generate route
 * stays generic — this module decides which types to request.
 */

export type SubjectId =
  | "reading"
  | "writing"
  | "math"
  | "science"
  | "social"
  | "phonics"
  | "art"
  | "sel"
  | "ell"
  | "holiday"
  | "general"
  | "custom";

export type VariantId = "A" | "B" | "C";

export type QuickGenActivityPlan = {
  activityType: string;
  familyLabel: string;
};

export type ThreeOptionPlan = Record<VariantId, QuickGenActivityPlan>;

export type WorksheetFamily = {
  subjectId: SubjectId;
  familyId: string;
  label: string;
  description: string;
  /** Activity types the backend can use for this family (superset / documentation) */
  allowedActivityTypes: string[];
};

/** One plan per subject+family key */
type PlanKey = string;

function key(subjectId: SubjectId, familyId: string): PlanKey {
  return `${subjectId}:${familyId}`;
}

/** 3 distinct activity types per family (student experience differs per option). */
const PLANS: Record<PlanKey, ThreeOptionPlan> = {
  // ── Reading ──
  [key("reading", "comprehension")]: {
    A: {
      activityType: "story_map",
      familyLabel: "Story structure & comprehension",
    },
    B: { activityType: "kwl_chart", familyLabel: "K-W-L inquiry" },
    C: { activityType: "writing_prompt", familyLabel: "Text-based response" },
  },
  [key("reading", "vocabulary")]: {
    A: { activityType: "frayer_model", familyLabel: "Vocabulary deep dive" },
    B: {
      activityType: "line_matching",
      familyLabel: "Term & definition match",
    },
    C: { activityType: "word_search", familyLabel: "Word hunt" },
  },
  [key("reading", "graphic_organizer")]: {
    A: { activityType: "mind_map", familyLabel: "Mind map" },
    B: { activityType: "story_map", familyLabel: "Story organizer" },
    C: { activityType: "venn_diagram", familyLabel: "Compare ideas" },
  },
  [key("reading", "evidence")]: {
    A: {
      activityType: "writing_prompt",
      familyLabel: "Evidence-based response",
    },
    B: { activityType: "sentence_frames", familyLabel: "Academic frames" },
    C: { activityType: "kwl_chart", familyLabel: "Inquiry & reflection" },
  },
  [key("reading", "fluency")]: {
    A: { activityType: "word_search", familyLabel: "Pattern & word hunt" },
    B: {
      activityType: "sentence_frames",
      familyLabel: "Repeated reading frames",
    },
    C: {
      activityType: "writing_prompt",
      familyLabel: "Short oral-written bridge",
    },
  },

  // ── Writing ──
  [key("writing", "prompt")]: {
    A: { activityType: "writing_prompt", familyLabel: "Open writing prompt" },
    B: { activityType: "sentence_frames", familyLabel: "Scaffolded stems" },
    C: { activityType: "acrostic", familyLabel: "Poetry / word craft" },
  },
  [key("writing", "sentence_scaffold")]: {
    A: { activityType: "sentence_frames", familyLabel: "Sentence frames" },
    B: { activityType: "writing_prompt", familyLabel: "Short response" },
    C: { activityType: "mini_book", familyLabel: "Mini book panels" },
  },
  [key("writing", "paragraph")]: {
    A: { activityType: "sentence_frames", familyLabel: "Paragraph frames" },
    B: { activityType: "writing_prompt", familyLabel: "Structured prompt" },
    C: { activityType: "mind_map", familyLabel: "Plan before writing" },
  },
  [key("writing", "planner")]: {
    A: { activityType: "mind_map", familyLabel: "Prewriting web" },
    B: { activityType: "writing_prompt", familyLabel: "Draft prompt" },
    C: { activityType: "sentence_frames", familyLabel: "Transition frames" },
  },
  [key("writing", "mini_book")]: {
    A: { activityType: "mini_book", familyLabel: "Mini book" },
    B: { activityType: "writing_prompt", familyLabel: "Page prompts" },
    C: { activityType: "sentence_frames", familyLabel: "Panel frames" },
  },

  // ── Math ──
  [key("math", "practice")]: {
    A: { activityType: "math_practice", familyLabel: "Skill practice" },
    B: {
      activityType: "number_bond",
      familyLabel: "Visual model (number bonds)",
    },
    C: { activityType: "math_word_problems", familyLabel: "Word problems" },
  },
  [key("math", "word_problems")]: {
    A: { activityType: "math_word_problems", familyLabel: "Context problems" },
    B: { activityType: "math_practice", familyLabel: "Equations" },
    C: { activityType: "graph_page", familyLabel: "Data & graph" },
  },
  [key("math", "visual_model")]: {
    A: { activityType: "number_bond", familyLabel: "Number bonds" },
    B: { activityType: "ten_frame", familyLabel: "Ten frames" },
    C: { activityType: "graph_page", familyLabel: "Represent data" },
  },
  [key("math", "graph_data")]: {
    A: { activityType: "graph_page", familyLabel: "Graph & categories" },
    B: { activityType: "math_word_problems", familyLabel: "Data stories" },
    C: { activityType: "measurement", familyLabel: "Measure & record" },
  },
  [key("math", "game")]: {
    A: { activityType: "dice_activity", familyLabel: "Dice practice" },
    B: { activityType: "spinner", familyLabel: "Spinner activity" },
    C: { activityType: "math_practice", familyLabel: "Game-style problems" },
  },

  // ── Science ──
  [key("science", "diagram")]: {
    A: { activityType: "label_diagram", familyLabel: "Diagram & labeling" },
    B: { activityType: "observation_sheet", familyLabel: "Observe & record" },
    C: { activityType: "line_matching", familyLabel: "Term matching" },
  },
  [key("science", "concept")]: {
    A: {
      activityType: "science_concept_practice",
      familyLabel: "Concept & vocabulary",
    },
    B: { activityType: "frayer_model", familyLabel: "One key term" },
    C: { activityType: "line_matching", familyLabel: "Match terms" },
  },
  [key("science", "process")]: {
    A: { activityType: "sequence_chart", familyLabel: "Sequence & process" },
    B: { activityType: "label_diagram", familyLabel: "Label the cycle" },
    C: { activityType: "line_matching", familyLabel: "Stage matching" },
  },
  [key("science", "observation")]: {
    A: {
      activityType: "observation_sheet",
      familyLabel: "Hypothesis & observe",
    },
    B: { activityType: "label_diagram", familyLabel: "Label structures" },
    C: { activityType: "writing_prompt", familyLabel: "Evidence explanation" },
  },
  [key("science", "matching")]: {
    A: { activityType: "line_matching", familyLabel: "Match pairs" },
    B: { activityType: "cut_and_sort", familyLabel: "Sort into categories" },
    C: { activityType: "venn_diagram", familyLabel: "Compare concepts" },
  },

  // ── Social studies ──
  [key("social", "timeline")]: {
    A: { activityType: "timeline", familyLabel: "Timeline" },
    B: { activityType: "sequence_chart", familyLabel: "Sequence events" },
    C: { activityType: "writing_prompt", familyLabel: "Historical response" },
  },
  [key("social", "map_geo")]: {
    A: { activityType: "map_activity", familyLabel: "Map skills" },
    B: { activityType: "label_diagram", familyLabel: "Label map / region" },
    C: { activityType: "line_matching", familyLabel: "Place vocabulary" },
  },
  [key("social", "vocabulary")]: {
    A: { activityType: "frayer_model", familyLabel: "Key term" },
    B: { activityType: "line_matching", familyLabel: "Vocab match" },
    C: { activityType: "word_search", familyLabel: "Word hunt" },
  },
  [key("social", "compare")]: {
    A: { activityType: "venn_diagram", familyLabel: "Compare & contrast" },
    B: { activityType: "timeline", familyLabel: "Two eras / groups" },
    C: { activityType: "writing_prompt", familyLabel: "Compare in writing" },
  },
  [key("social", "cause_effect")]: {
    A: { activityType: "sequence_chart", familyLabel: "Cause → effect chain" },
    B: { activityType: "mind_map", familyLabel: "Cause web" },
    C: { activityType: "writing_prompt", familyLabel: "Explain relationships" },
  },

  // ── Phonics ──
  [key("phonics", "tracing")]: {
    A: { activityType: "trace_and_color", familyLabel: "Trace & color" },
    B: { activityType: "color_by_code", familyLabel: "Color by code" },
    C: { activityType: "line_matching", familyLabel: "Word match" },
  },
  [key("phonics", "sort")]: {
    A: { activityType: "cut_and_sort", familyLabel: "Sort activity" },
    B: { activityType: "picture_sort", familyLabel: "Picture sort" },
    C: { activityType: "line_matching", familyLabel: "Pattern match" },
  },
  [key("phonics", "matching")]: {
    A: { activityType: "line_matching", familyLabel: "Word families" },
    B: { activityType: "word_search", familyLabel: "Letter find" },
    C: { activityType: "color_by_code", familyLabel: "Color by sound" },
  },
  [key("phonics", "color_code")]: {
    A: { activityType: "color_by_code", familyLabel: "Color by code" },
    B: { activityType: "trace_and_color", familyLabel: "Trace & color" },
    C: { activityType: "word_search", familyLabel: "Word hunt" },
  },
  [key("phonics", "word_hunt")]: {
    A: { activityType: "word_search", familyLabel: "Word search" },
    B: { activityType: "line_matching", familyLabel: "Match-up" },
    C: { activityType: "color_by_code", familyLabel: "Decode & color" },
  },

  // ── ELL ──
  [key("ell", "frames")]: {
    A: { activityType: "sentence_frames", familyLabel: "Sentence frames" },
    B: { activityType: "writing_prompt", familyLabel: "Short response" },
    C: { activityType: "line_matching", familyLabel: "Vocabulary match" },
  },
  [key("ell", "vocab_match")]: {
    A: { activityType: "line_matching", familyLabel: "Vocab match" },
    B: { activityType: "frayer_model", familyLabel: "Frayer model" },
    C: { activityType: "word_search", familyLabel: "Word hunt" },
  },
  [key("ell", "frayer")]: {
    A: { activityType: "frayer_model", familyLabel: "Frayer" },
    B: { activityType: "sentence_frames", familyLabel: "Use the word" },
    C: { activityType: "line_matching", familyLabel: "Match meanings" },
  },
  [key("ell", "mini_book")]: {
    A: { activityType: "mini_book", familyLabel: "Mini book" },
    B: { activityType: "sentence_frames", familyLabel: "Book frames" },
    C: { activityType: "writing_prompt", familyLabel: "Short writing" },
  },
  [key("ell", "word_practice")]: {
    A: { activityType: "word_search", familyLabel: "Word hunt" },
    B: { activityType: "line_matching", familyLabel: "Match" },
    C: { activityType: "sentence_frames", familyLabel: "Sentence practice" },
  },

  // ── SEL ──
  [key("sel", "journal")]: {
    A: { activityType: "writing_prompt", familyLabel: "Journal prompt" },
    B: { activityType: "sentence_frames", familyLabel: "Feeling frames" },
    C: { activityType: "mind_map", familyLabel: "Self-reflection map" },
  },
  [key("sel", "scenario")]: {
    A: { activityType: "story_map", familyLabel: "Scenario map" },
    B: { activityType: "writing_prompt", familyLabel: "What would you do?" },
    C: { activityType: "venn_diagram", familyLabel: "Compare choices" },
  },
  [key("sel", "frames")]: {
    A: { activityType: "sentence_frames", familyLabel: "SEL frames" },
    B: { activityType: "writing_prompt", familyLabel: "Reflection" },
    C: { activityType: "mind_map", familyLabel: "Coping strategies map" },
  },
  [key("sel", "compare_feelings")]: {
    A: { activityType: "venn_diagram", familyLabel: "Compare feelings" },
    B: { activityType: "writing_prompt", familyLabel: "Compare in writing" },
    C: { activityType: "sentence_frames", familyLabel: "Empathy frames" },
  },
  [key("sel", "organizer")]: {
    A: { activityType: "mind_map", familyLabel: "Feelings organizer" },
    B: { activityType: "kwl_chart", familyLabel: "K-W-L about self" },
    C: { activityType: "writing_prompt", familyLabel: "Goal setting" },
  },

  // ── Art ──
  [key("art", "creative_visual")]: {
    A: { activityType: "coloring_page", familyLabel: "Coloring" },
    B: { activityType: "color_by_code", familyLabel: "Color by code" },
    C: { activityType: "writing_prompt", familyLabel: "Artist reflection" },
  },
  [key("art", "practice")]: {
    A: { activityType: "line_matching", familyLabel: "Match art terms" },
    B: { activityType: "word_search", familyLabel: "Vocabulary hunt" },
    C: { activityType: "writing_prompt", familyLabel: "Describe & analyze" },
  },
  [key("art", "reflection")]: {
    A: { activityType: "writing_prompt", familyLabel: "Critique / reflect" },
    B: { activityType: "sentence_frames", familyLabel: "Observation frames" },
    C: { activityType: "mind_map", familyLabel: "Elements of art" },
  },

  // ── Holiday ──
  [key("holiday", "festive_visual")]: {
    A: { activityType: "coloring_page", familyLabel: "Holiday coloring" },
    B: { activityType: "color_by_code", familyLabel: "Festive color-by-code" },
    C: { activityType: "word_search", familyLabel: "Holiday word hunt" },
  },
  [key("holiday", "word_games")]: {
    A: { activityType: "word_search", familyLabel: "Word search" },
    B: { activityType: "bingo_card", familyLabel: "Bingo" },
    C: { activityType: "line_matching", familyLabel: "Match-up" },
  },
  [key("holiday", "writing")]: {
    A: { activityType: "writing_prompt", familyLabel: "Holiday writing" },
    B: { activityType: "acrostic", familyLabel: "Acrostic" },
    C: { activityType: "mini_book", familyLabel: "Mini book" },
  },

  // ── General / Custom (flexible) ──
  [key("general", "open_response")]: {
    A: { activityType: "writing_prompt", familyLabel: "Open response" },
    B: { activityType: "mind_map", familyLabel: "Brainstorm" },
    C: { activityType: "sentence_frames", familyLabel: "Structured frames" },
  },
  [key("general", "organizer")]: {
    A: { activityType: "mind_map", familyLabel: "Graphic organizer" },
    B: { activityType: "venn_diagram", familyLabel: "Compare" },
    C: { activityType: "kwl_chart", familyLabel: "K-W-L" },
  },
  [key("general", "scaffold")]: {
    A: { activityType: "sentence_frames", familyLabel: "Frames" },
    B: { activityType: "writing_prompt", familyLabel: "Prompt" },
    C: { activityType: "story_map", familyLabel: "Organizer" },
  },

  [key("custom", "mixed")]: {
    A: { activityType: "writing_prompt", familyLabel: "Open response" },
    B: { activityType: "mind_map", familyLabel: "Organizer" },
    C: { activityType: "sentence_frames", familyLabel: "Frames" },
  },
};

const FAMILY_LISTS: Record<SubjectId, WorksheetFamily[]> = {
  reading: [
    {
      subjectId: "reading",
      familyId: "comprehension",
      label: "Comprehension",
      description: "Story structure, K-W-L, and written response",
      allowedActivityTypes: ["story_map", "kwl_chart", "writing_prompt"],
    },
    {
      subjectId: "reading",
      familyId: "vocabulary",
      label: "Vocabulary",
      description: "Frayer, matching, and word hunt",
      allowedActivityTypes: ["frayer_model", "line_matching", "word_search"],
    },
    {
      subjectId: "reading",
      familyId: "graphic_organizer",
      label: "Graphic organizer",
      description: "Maps, organizers, and compare",
      allowedActivityTypes: ["mind_map", "story_map", "venn_diagram"],
    },
    {
      subjectId: "reading",
      familyId: "evidence",
      label: "Evidence response",
      description: "Frames and inquiry writing",
      allowedActivityTypes: ["writing_prompt", "sentence_frames", "kwl_chart"],
    },
    {
      subjectId: "reading",
      familyId: "fluency",
      label: "Fluency & patterns",
      description: "Word patterns and short writing",
      allowedActivityTypes: [
        "word_search",
        "sentence_frames",
        "writing_prompt",
      ],
    },
  ],
  writing: [
    {
      subjectId: "writing",
      familyId: "prompt",
      label: "Prompt writing",
      description: "Prompts, frames, and poetry",
      allowedActivityTypes: ["writing_prompt", "sentence_frames", "acrostic"],
    },
    {
      subjectId: "writing",
      familyId: "sentence_scaffold",
      label: "Sentence frames",
      description: "Scaffolded sentences and mini book",
      allowedActivityTypes: ["sentence_frames", "writing_prompt", "mini_book"],
    },
    {
      subjectId: "writing",
      familyId: "paragraph",
      label: "Paragraph structure",
      description: "Frames, planning, and drafting",
      allowedActivityTypes: ["sentence_frames", "writing_prompt", "mind_map"],
    },
    {
      subjectId: "writing",
      familyId: "planner",
      label: "Planner & prewriting",
      description: "Webs and drafts",
      allowedActivityTypes: ["mind_map", "writing_prompt", "sentence_frames"],
    },
    {
      subjectId: "writing",
      familyId: "mini_book",
      label: "Mini book",
      description: "Multi-page short project",
      allowedActivityTypes: ["mini_book", "writing_prompt", "sentence_frames"],
    },
  ],
  math: [
    {
      subjectId: "math",
      familyId: "practice",
      label: "Skill practice",
      description: "Problems, number bonds, and word problems",
      allowedActivityTypes: [
        "math_practice",
        "number_bond",
        "math_word_problems",
      ],
    },
    {
      subjectId: "math",
      familyId: "word_problems",
      label: "Word problems",
      description: "Contexts, equations, and graphs",
      allowedActivityTypes: [
        "math_word_problems",
        "math_practice",
        "graph_page",
      ],
    },
    {
      subjectId: "math",
      familyId: "visual_model",
      label: "Visual models",
      description: "Bonds, ten frames, graphs",
      allowedActivityTypes: ["number_bond", "ten_frame", "graph_page"],
    },
    {
      subjectId: "math",
      familyId: "graph_data",
      label: "Graph & data",
      description: "Charts and measurement",
      allowedActivityTypes: ["graph_page", "math_word_problems", "measurement"],
    },
    {
      subjectId: "math",
      familyId: "game",
      label: "Game practice",
      description: "Dice, spinner, and practice",
      allowedActivityTypes: ["dice_activity", "spinner", "math_practice"],
    },
  ],
  science: [
    {
      subjectId: "science",
      familyId: "diagram",
      label: "Diagram & labeling",
      description: "Label diagrams, observe, match terms",
      allowedActivityTypes: [
        "label_diagram",
        "observation_sheet",
        "line_matching",
      ],
    },
    {
      subjectId: "science",
      familyId: "concept",
      label: "Concept & vocabulary",
      description: "Concept sheets, Frayer, matching",
      allowedActivityTypes: [
        "science_concept_practice",
        "frayer_model",
        "line_matching",
      ],
    },
    {
      subjectId: "science",
      familyId: "process",
      label: "Sequence & process",
      description: "Cycles, labeling, matching stages",
      allowedActivityTypes: [
        "sequence_chart",
        "label_diagram",
        "line_matching",
      ],
    },
    {
      subjectId: "science",
      familyId: "observation",
      label: "Observation",
      description: "Hypothesis, structures, explanation",
      allowedActivityTypes: [
        "observation_sheet",
        "label_diagram",
        "writing_prompt",
      ],
    },
    {
      subjectId: "science",
      familyId: "matching",
      label: "Matching & sorting",
      description: "Pairs, sorts, compare",
      allowedActivityTypes: ["line_matching", "cut_and_sort", "venn_diagram"],
    },
  ],
  social: [
    {
      subjectId: "social",
      familyId: "timeline",
      label: "Timeline",
      description: "Chronology and sequence",
      allowedActivityTypes: ["timeline", "sequence_chart", "writing_prompt"],
    },
    {
      subjectId: "social",
      familyId: "map_geo",
      label: "Map & geography",
      description: "Maps and places",
      allowedActivityTypes: ["map_activity", "label_diagram", "line_matching"],
    },
    {
      subjectId: "social",
      familyId: "vocabulary",
      label: "Vocabulary & concepts",
      description: "Terms and word work",
      allowedActivityTypes: ["frayer_model", "line_matching", "word_search"],
    },
    {
      subjectId: "social",
      familyId: "compare",
      label: "Compare & contrast",
      description: "Venn and writing",
      allowedActivityTypes: ["venn_diagram", "timeline", "writing_prompt"],
    },
    {
      subjectId: "social",
      familyId: "cause_effect",
      label: "Cause & effect",
      description: "Chains and explanations",
      allowedActivityTypes: ["sequence_chart", "mind_map", "writing_prompt"],
    },
  ],
  phonics: [
    {
      subjectId: "phonics",
      familyId: "tracing",
      label: "Tracing & color",
      description: "Trace, code, match",
      allowedActivityTypes: [
        "trace_and_color",
        "color_by_code",
        "line_matching",
      ],
    },
    {
      subjectId: "phonics",
      familyId: "sort",
      label: "Sort",
      description: "Cut-and-sort and pictures",
      allowedActivityTypes: ["cut_and_sort", "picture_sort", "line_matching"],
    },
    {
      subjectId: "phonics",
      familyId: "matching",
      label: "Matching",
      description: "Word families and hunt",
      allowedActivityTypes: ["line_matching", "word_search", "color_by_code"],
    },
    {
      subjectId: "phonics",
      familyId: "color_code",
      label: "Color by code",
      description: "Phonics coloring",
      allowedActivityTypes: ["color_by_code", "trace_and_color", "word_search"],
    },
    {
      subjectId: "phonics",
      familyId: "word_hunt",
      label: "Word hunt",
      description: "Search and match",
      allowedActivityTypes: ["word_search", "line_matching", "color_by_code"],
    },
  ],
  ell: [
    {
      subjectId: "ell",
      familyId: "frames",
      label: "Sentence frames",
      description: "Frames, writing, match",
      allowedActivityTypes: [
        "sentence_frames",
        "writing_prompt",
        "line_matching",
      ],
    },
    {
      subjectId: "ell",
      familyId: "vocab_match",
      label: "Vocabulary match",
      description: "Match and hunt",
      allowedActivityTypes: ["line_matching", "frayer_model", "word_search"],
    },
    {
      subjectId: "ell",
      familyId: "frayer",
      label: "Frayer & vocabulary",
      description: "Deep vocabulary",
      allowedActivityTypes: [
        "frayer_model",
        "sentence_frames",
        "line_matching",
      ],
    },
    {
      subjectId: "ell",
      familyId: "mini_book",
      label: "Mini book",
      description: "Short booklet",
      allowedActivityTypes: ["mini_book", "sentence_frames", "writing_prompt"],
    },
    {
      subjectId: "ell",
      familyId: "word_practice",
      label: "Word practice",
      description: "Hunt and sentences",
      allowedActivityTypes: ["word_search", "line_matching", "sentence_frames"],
    },
  ],
  sel: [
    {
      subjectId: "sel",
      familyId: "journal",
      label: "Journal",
      description: "Reflection prompts",
      allowedActivityTypes: ["writing_prompt", "sentence_frames", "mind_map"],
    },
    {
      subjectId: "sel",
      familyId: "scenario",
      label: "Scenario analysis",
      description: "Maps and decisions",
      allowedActivityTypes: ["story_map", "writing_prompt", "venn_diagram"],
    },
    {
      subjectId: "sel",
      familyId: "frames",
      label: "Sentence frames",
      description: "Social-emotional frames",
      allowedActivityTypes: ["sentence_frames", "writing_prompt", "mind_map"],
    },
    {
      subjectId: "sel",
      familyId: "compare_feelings",
      label: "Compare feelings",
      description: "Venn and writing",
      allowedActivityTypes: [
        "venn_diagram",
        "writing_prompt",
        "sentence_frames",
      ],
    },
    {
      subjectId: "sel",
      familyId: "organizer",
      label: "Organizer",
      description: "Maps and goals",
      allowedActivityTypes: ["mind_map", "kwl_chart", "writing_prompt"],
    },
  ],
  art: [
    {
      subjectId: "art",
      familyId: "creative_visual",
      label: "Creative & visual",
      description: "Color and reflect",
      allowedActivityTypes: [
        "coloring_page",
        "color_by_code",
        "writing_prompt",
      ],
    },
    {
      subjectId: "art",
      familyId: "practice",
      label: "Vocabulary & terms",
      description: "Art vocabulary",
      allowedActivityTypes: ["line_matching", "word_search", "writing_prompt"],
    },
    {
      subjectId: "art",
      familyId: "reflection",
      label: "Reflection & analysis",
      description: "Critique and elements",
      allowedActivityTypes: ["writing_prompt", "sentence_frames", "mind_map"],
    },
  ],
  holiday: [
    {
      subjectId: "holiday",
      familyId: "festive_visual",
      label: "Festive visual",
      description: "Coloring and codes",
      allowedActivityTypes: ["coloring_page", "color_by_code", "word_search"],
    },
    {
      subjectId: "holiday",
      familyId: "word_games",
      label: "Word games",
      description: "Search and bingo",
      allowedActivityTypes: ["word_search", "bingo_card", "line_matching"],
    },
    {
      subjectId: "holiday",
      familyId: "writing",
      label: "Holiday writing",
      description: "Prompts and poetry",
      allowedActivityTypes: ["writing_prompt", "acrostic", "mini_book"],
    },
  ],
  general: [
    {
      subjectId: "general",
      familyId: "open_response",
      label: "Open response",
      description: "Flexible writing and maps",
      allowedActivityTypes: ["writing_prompt", "mind_map", "sentence_frames"],
    },
    {
      subjectId: "general",
      familyId: "organizer",
      label: "Graphic organizer",
      description: "Maps and charts",
      allowedActivityTypes: ["mind_map", "venn_diagram", "kwl_chart"],
    },
    {
      subjectId: "general",
      familyId: "scaffold",
      label: "Scaffolded writing",
      description: "Frames and organizers",
      allowedActivityTypes: ["sentence_frames", "writing_prompt", "story_map"],
    },
  ],
  custom: [
    {
      subjectId: "custom",
      familyId: "mixed",
      label: "Mixed / flexible",
      description: "General trio — pick a type for option A below if needed",
      allowedActivityTypes: ["writing_prompt", "mind_map", "sentence_frames"],
    },
  ],
};

export function getFamiliesForSubject(
  subjectId: SubjectId | "",
): WorksheetFamily[] {
  if (!subjectId) return [];
  return FAMILY_LISTS[subjectId] ?? FAMILY_LISTS.general;
}

export function getDefaultFamilyId(subjectId: SubjectId | ""): string {
  const list = getFamiliesForSubject(subjectId);
  return list[0]?.familyId ?? "open_response";
}

/** Map AI-suggested family id onto a configured family for this subject. */
export function resolveFamilyIdForSubject(
  subjectId: SubjectId | "",
  suggested: string,
): string {
  if (!subjectId || !suggested?.trim()) return getDefaultFamilyId(subjectId);
  const s = suggested.trim();
  const families = getFamiliesForSubject(subjectId);
  if (families.some((f) => f.familyId === s)) return s;
  const slug = s.toLowerCase().replace(/\s+/g, "_");
  const bySlug = families.find(
    (f) =>
      f.familyId === slug ||
      f.familyId.includes(slug) ||
      slug.includes(f.familyId),
  );
  return bySlug?.familyId ?? getDefaultFamilyId(subjectId);
}

/**
 * Returns the three distinct activity plans for one subject + family + topic context.
 * Topic/grade reserved for future tuning; structure is table-driven today.
 */
export function defaultThreeOptionPlan(
  subjectId: SubjectId | "",
  familyId: string,
  _topic: string,
  _grade: string,
): ThreeOptionPlan {
  if (!subjectId || subjectId === "custom") {
    const k = key("custom", familyId === "mixed" ? "mixed" : "mixed");
    if (PLANS[k]) return PLANS[k];
    return PLANS[key("general", "open_response")]!;
  }
  const k = key(subjectId as SubjectId, familyId);
  const plan = PLANS[k];
  if (plan) return plan;
  const fallback = getDefaultFamilyId(subjectId as SubjectId);
  return (
    PLANS[key(subjectId as SubjectId, fallback)] ??
    PLANS[key("general", "open_response")]!
  );
}

const SLOT_ORDER: VariantId[] = ["A", "B", "C"];

/**
 * Which Quick Gen layout slots to run (and show). Reading graphic organizer uses template work-in-progress
 * for B/C — only A is enabled until templates exist.
 */
export function getEnabledQuickGenVariants(subjectId: SubjectId | "", familyId: string): VariantId[] {
  if (subjectId === "reading" && familyId === "graphic_organizer") {
    return ["A"];
  }
  return ["A", "B", "C"];
}

const PLAN_FALLBACK_GENERAL: ThreeOptionPlan =
  PLANS[key("general", "open_response")] ?? PLANS[key("custom", "mixed")]!;

function assertDistinctActivities(
  plan: ThreeOptionPlan,
  subject: string,
  familyId: string,
): ThreeOptionPlan {
  const types = SLOT_ORDER.map((s) => plan[s].activityType);
  if (new Set(types).size === 3) return plan;
  console.warn(
    "[quickGenFamilies] Expected 3 distinct activity types; using general fallback",
    {
      subject,
      familyId,
      types,
    },
  );
  return PLAN_FALLBACK_GENERAL;
}

/**
 * Table-driven A/B/C plan plus distinct-activity fallback — same resolution Quick Gen uses per slot.
 */
export function getResolvedThreeOptionPlan(
  subjectId: SubjectId | "",
  familyId: string,
  topic: string,
  grade: string,
): ThreeOptionPlan {
  let plan = defaultThreeOptionPlan(subjectId, familyId, topic, grade);
  plan = assertDistinctActivities(plan, subjectId || "", familyId);
  return plan;
}

/**
 * Single slot plan for customize-generate. Uses selected family + subject only.
 */
export function getQuickGenActivityPlan(
  subject: SubjectId | "",
  slot: VariantId,
  opts: {
    familyId: string;
    topic: string;
    grade: string;
    /** Legacy: optional override for custom/general slot A */
    userPickedTypeId?: string;
  },
): QuickGenActivityPlan {
  let plan = getResolvedThreeOptionPlan(
    subject,
    opts.familyId,
    opts.topic,
    opts.grade,
  );
  if (
    (!subject || subject === "custom") &&
    opts.userPickedTypeId &&
    slot === "A"
  ) {
    return {
      activityType: opts.userPickedTypeId,
      familyLabel: plan.A.familyLabel,
    };
  }
  if (
    (subject === "general" || subject === "custom") &&
    opts.userPickedTypeId &&
    slot === "A"
  ) {
    return {
      activityType: opts.userPickedTypeId,
      familyLabel: plan.A.familyLabel,
    };
  }
  return plan[slot];
}

export function getPlanSlotList(plan: ThreeOptionPlan): QuickGenActivityPlan[] {
  return SLOT_ORDER.map((s) => plan[s]);
}

/**
 * Single activity type for Quick Gen: same worksheet type for all layout variants (A/B/C).
 * Uses planner slot A as the canonical type for the family; optional override for custom/general.
 */
export function getCanonicalActivityPlan(
  subjectId: SubjectId | "",
  familyId: string,
  topic: string,
  grade: string,
  userPickedTypeId?: string,
): QuickGenActivityPlan {
  const plan = getResolvedThreeOptionPlan(subjectId, familyId, topic, grade);
  if (
    userPickedTypeId?.trim() &&
    (subjectId === "custom" || subjectId === "general")
  ) {
    return {
      activityType: userPickedTypeId.trim(),
      familyLabel: plan.A.familyLabel,
    };
  }
  return plan.A;
}
