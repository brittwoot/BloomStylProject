// ── Worksheet Type Registry ────────────────────────────────────────────────────
// All 30 worksheet types with metadata, category, and option schemas.

export type WorksheetCategory =
  | "coloring"
  | "matching"
  | "writing"
  | "organizer"
  | "math"
  | "science"
  | "games";

export type WorksheetTypeId =
  // Coloring & Visual
  | "coloring_page"
  | "color_by_code"
  | "trace_and_color"
  // Matching & Sorting
  | "cut_and_sort"
  | "line_matching"
  | "picture_sort"
  // Writing & Response
  | "writing_prompt"
  | "sentence_frames"
  | "mini_book"
  | "acrostic"
  // Graphic Organizers
  | "mind_map"
  | "venn_diagram"
  | "story_map"
  | "kwl_chart"
  | "sequence_chart"
  | "frayer_model"
  // Math
  | "number_bond"
  | "ten_frame"
  | "graph_page"
  | "clock_practice"
  | "measurement"
  // Science / Social Studies
  | "label_diagram"
  | "observation_sheet"
  | "timeline"
  | "map_activity"
  // Games & Interactive
  | "bingo_card"
  | "word_search"
  | "crossword"
  | "spinner"
  | "dice_activity";

export type WorksheetTypeOption = {
  key: string;
  label: string;
  type: "chips" | "toggle" | "text" | "number" | "select" | "textarea";
  options?: string[];
  default: string | number | boolean;
  description?: string;
};

export type WorksheetTypeDef = {
  id: WorksheetTypeId;
  label: string;
  shortLabel: string;
  category: WorksheetCategory;
  icon: string;
  description: string;
  gradeRange: string;
  previewRows: string[];
  typeOptions: WorksheetTypeOption[];
  isPrimary?: boolean;
};

export const CATEGORY_META: Record<WorksheetCategory, { label: string; color: string; bgColor: string; icon: string }> = {
  coloring:  { label: "Coloring & Visual",         color: "#f97316", bgColor: "#fff7ed", icon: "🎨" },
  matching:  { label: "Matching & Sorting",         color: "#8b5cf6", bgColor: "#f5f3ff", icon: "↔️" },
  writing:   { label: "Writing & Response",         color: "#0ea5e9", bgColor: "#f0f9ff", icon: "✏️" },
  organizer: { label: "Graphic Organizers",         color: "#10b981", bgColor: "#f0fdf4", icon: "🗂️" },
  math:      { label: "Math Activities",            color: "#3b82f6", bgColor: "#eff6ff", icon: "🔢" },
  science:   { label: "Science & Social Studies",  color: "#ec4899", bgColor: "#fdf2f8", icon: "🔬" },
  games:     { label: "Games & Interactive",       color: "#f59e0b", bgColor: "#fffbeb", icon: "🎮" },
};

export const WORKSHEET_TYPES: WorksheetTypeDef[] = [

  // ── COLORING & VISUAL ──────────────────────────────────────────────────────

  {
    id: "coloring_page",
    label: "Coloring Page",
    shortLabel: "Coloring",
    category: "coloring",
    icon: "🖍️",
    description: "Full or half-page line art illustration for students to color. Pure creative activity.",
    gradeRange: "Pre-K – 6",
    previewRows: ["🖼️ Line art illustration", "Optional writing lines below"],
    isPrimary: true,
    typeOptions: [
      { key: "theme", label: "Illustration Theme", type: "text", default: "butterfly", description: "e.g. butterfly, fire truck, pumpkin, snowman" },
      { key: "complexity", label: "Complexity", type: "chips", options: ["Simple", "Medium", "Detailed"], default: "Simple" },
      { key: "size", label: "Size", type: "chips", options: ["Full page", "Half page", "Quarter page"], default: "Full page" },
      { key: "addWritingLines", label: "Add Writing Lines Below", type: "toggle", default: false },
      { key: "lineCount", label: "Number of Lines", type: "number", default: 3 },
      { key: "addInstructions", label: "Add Color Instructions", type: "toggle", default: false },
    ],
  },
  {
    id: "color_by_code",
    label: "Color by Code",
    shortLabel: "Color by Code",
    category: "coloring",
    icon: "🎨",
    description: "Central illustration with regions labeled by a code. Color key maps code to color.",
    gradeRange: "K – 3",
    previewRows: ["🖼️ Illustration with labeled regions", "🔑 Color key"],
    typeOptions: [
      { key: "codeType", label: "Code Type", type: "chips", options: ["Sight words", "Letters", "Numbers", "Math answers", "Phonics"], default: "Sight words" },
      { key: "theme", label: "Illustration Theme", type: "text", default: "butterfly", description: "e.g. butterfly, pumpkin, fish" },
      { key: "regionCount", label: "Color Regions", type: "chips", options: ["4", "6", "8", "10+"], default: "6" },
      { key: "colorCount", label: "Colors in Key", type: "chips", options: ["3", "4", "5", "6"], default: "4" },
      { key: "keyPosition", label: "Color Key Position", type: "chips", options: ["Bottom", "Right side", "Left side"], default: "Bottom" },
    ],
  },
  {
    id: "trace_and_color",
    label: "Trace and Color",
    shortLabel: "Trace & Color",
    category: "coloring",
    icon: "✏️",
    description: "Dashed outline paths for tracing, then student colors the image. Fine motor + content.",
    gradeRange: "Pre-K – 2",
    previewRows: ["✏️ Dashed trace paths", "🖍️ Coloring area"],
    typeOptions: [
      { key: "theme", label: "What to Trace", type: "text", default: "letters A B C", description: "e.g. letters, numbers, a shape, a word" },
      { key: "addColor", label: "Color After Tracing", type: "toggle", default: true },
      { key: "style", label: "Path Style", type: "chips", options: ["Dashed", "Dotted", "Arrows"], default: "Dashed" },
    ],
  },

  // ── MATCHING & SORTING ─────────────────────────────────────────────────────

  {
    id: "cut_and_sort",
    label: "Cut and Sort",
    shortLabel: "Cut & Sort",
    category: "matching",
    icon: "✂️",
    description: "Cut-out items at bottom. Category headers at top. Students cut and paste into categories.",
    gradeRange: "K – 4",
    previewRows: ["📋 Category headers", "✂️ Cut-out boxes at bottom"],
    isPrimary: true,
    typeOptions: [
      { key: "categories", label: "Category Names", type: "textarea", default: "Living, Nonliving", description: "Comma-separated category names" },
      { key: "itemCount", label: "Items to Sort", type: "chips", options: ["6", "8", "10", "12"], default: "8" },
      { key: "sortType", label: "Sort Type", type: "chips", options: ["Living/Nonliving", "Vowel/Consonant", "Odd/Even", "Season sort", "Custom"], default: "Custom" },
    ],
  },
  {
    id: "line_matching",
    label: "Draw a Line Matching",
    shortLabel: "Matching",
    category: "matching",
    icon: "↔️",
    description: "Two columns — student draws lines connecting matching pairs.",
    gradeRange: "K – 6",
    previewRows: ["Left column ←→ Right column", "Student draws connecting lines"],
    isPrimary: true,
    typeOptions: [
      { key: "pairCount", label: "Number of Pairs", type: "chips", options: ["4", "5", "6", "8", "10"], default: "6" },
      { key: "matchType", label: "Match Type", type: "chips", options: ["Word → Definition", "Word → Picture", "Cause → Effect", "Number → Quantity", "Custom"], default: "Word → Definition" },
      { key: "includeAnswerKey", label: "Include Answer Key", type: "toggle", default: false },
    ],
  },
  {
    id: "picture_sort",
    label: "Picture Sort",
    shortLabel: "Picture Sort",
    category: "matching",
    icon: "🗂️",
    description: "Image cards sorted into labeled columns. Great for phonics sorts and science classification.",
    gradeRange: "K – 4",
    previewRows: ["🏷️ Labeled columns", "🖼️ Image cards to sort"],
    typeOptions: [
      { key: "categories", label: "Sort Categories", type: "textarea", default: "Long vowel, Short vowel", description: "Comma-separated" },
      { key: "cardCount", label: "Cards to Sort", type: "chips", options: ["6", "8", "10", "12"], default: "8" },
      { key: "sortFocus", label: "Sort Focus", type: "chips", options: ["Phonics", "Science", "Math", "Social Studies", "Custom"], default: "Phonics" },
    ],
  },

  // ── WRITING & RESPONSE ─────────────────────────────────────────────────────

  {
    id: "writing_prompt",
    label: "Writing Prompt",
    shortLabel: "Writing",
    category: "writing",
    icon: "📝",
    description: "Decorative prompt at top with lined writing area. Optional illustration box or word bank.",
    gradeRange: "K – 6",
    previewRows: ["📣 Prompt header", "📋 Lined writing area"],
    isPrimary: true,
    typeOptions: [
      { key: "prompt", label: "Writing Prompt", type: "textarea", default: "", description: "Leave blank for AI to generate from your topic" },
      { key: "promptStyle", label: "Prompt Style", type: "chips", options: ["Narrative", "Opinion", "Creative", "Informational", "Sentence stems"], default: "Creative" },
      { key: "lineStyle", label: "Line Style", type: "chips", options: ["Wide ruled", "College ruled", "Dotted", "Blank"], default: "Wide ruled" },
      { key: "lineCount", label: "Number of Lines", type: "chips", options: ["10", "15", "20", "25", "30"], default: "15" },
      { key: "illustrationBox", label: "Illustration Box", type: "chips", options: ["None", "Top", "Side", "Bottom"], default: "None" },
      { key: "wordBank", label: "Word Bank Sidebar", type: "toggle", default: false },
    ],
  },
  {
    id: "sentence_frames",
    label: "Sentence Frames",
    shortLabel: "Sent. Frames",
    category: "writing",
    icon: "🔤",
    description: "Partially written sentences with blanks for students to complete from content knowledge.",
    gradeRange: "K – 6",
    previewRows: ["The ___ is _____ because...", "I think ___ because ___"],
    typeOptions: [
      { key: "frameCount", label: "Number of Frames", type: "chips", options: ["3", "4", "5", "6", "8"], default: "4" },
      { key: "frameStyle", label: "Frame Style", type: "chips", options: ["Science explanation", "SEL", "Reading response", "Math reasoning", "Custom"], default: "Reading response" },
      { key: "writingLines", label: "Lines per Frame", type: "chips", options: ["1", "2", "3"], default: "2" },
    ],
  },
  {
    id: "mini_book",
    label: "Mini Book",
    shortLabel: "Mini Book",
    category: "writing",
    icon: "📚",
    description: "Multiple panels on one page that fold into a small book. Each panel has an illustration space and writing line.",
    gradeRange: "K – 3",
    previewRows: ["📖 Panel 1 | 📖 Panel 2", "📖 Panel 3 | 📖 Panel 4"],
    typeOptions: [
      { key: "panelCount", label: "Number of Panels", type: "chips", options: ["4", "6", "8"], default: "4" },
      { key: "bookType", label: "Book Type", type: "chips", options: ["Sequencing", "Life cycle", "Counting", "Alphabet", "Story retelling", "Custom"], default: "Sequencing" },
      { key: "illustrationSpace", label: "Illustration Space", type: "toggle", default: true },
    ],
  },
  {
    id: "acrostic",
    label: "Acrostic Poem",
    shortLabel: "Acrostic",
    category: "writing",
    icon: "🔡",
    description: "A word written vertically. Student writes a word or phrase for each letter.",
    gradeRange: "1 – 6",
    previewRows: ["B — Bright and bold", "U — Unique in its way", "G — Grows in gardens"],
    typeOptions: [
      { key: "acrosticWord", label: "Acrostic Word", type: "text", default: "", description: "The word to write vertically (e.g. SPRING, MATH, BRAVE)" },
      { key: "linesPerLetter", label: "Lines per Letter", type: "chips", options: ["1", "2", "3"], default: "1" },
      { key: "styleHint", label: "Response Style", type: "chips", options: ["Single word", "Phrase", "Full sentence", "Free choice"], default: "Phrase" },
    ],
  },

  // ── GRAPHIC ORGANIZERS ─────────────────────────────────────────────────────

  {
    id: "mind_map",
    label: "Mind Map / Web",
    shortLabel: "Mind Map",
    category: "organizer",
    icon: "🕸️",
    description: "Central concept bubble with connecting branches. Students fill in related ideas.",
    gradeRange: "1 – 6",
    previewRows: ["Central bubble", "3–6 connecting branches"],
    isPrimary: true,
    typeOptions: [
      { key: "centerTerm", label: "Center Concept", type: "text", default: "", description: "The main idea in the center bubble" },
      { key: "branchCount", label: "Number of Branches", type: "chips", options: ["3", "4", "5", "6"], default: "4" },
      { key: "branchLabels", label: "Branch Labels", type: "textarea", default: "", description: "Optional — comma-separated labels for each branch" },
      { key: "linesInBubbles", label: "Writing Lines in Bubbles", type: "toggle", default: false },
    ],
  },
  {
    id: "venn_diagram",
    label: "Venn Diagram",
    shortLabel: "Venn",
    category: "organizer",
    icon: "⭕",
    description: "Two or three overlapping circles for comparing concepts, characters, or topics.",
    gradeRange: "1 – 6",
    previewRows: ["Circle A ∩ Circle B", "Left | Both | Right"],
    isPrimary: true,
    typeOptions: [
      { key: "circleCount", label: "Circles", type: "chips", options: ["2 circles", "3 circles"], default: "2 circles" },
      { key: "leftLabel", label: "Left Circle Label", type: "text", default: "Topic A" },
      { key: "rightLabel", label: "Right Circle Label", type: "text", default: "Topic B" },
      { key: "centerLabel", label: "Overlap Label", type: "text", default: "Both" },
      { key: "size", label: "Diagram Size", type: "chips", options: ["Full page", "Half page"], default: "Full page" },
    ],
  },
  {
    id: "story_map",
    label: "Story Map",
    shortLabel: "Story Map",
    category: "organizer",
    icon: "📖",
    description: "Sequential boxes for characters, setting, problem, events, solution, and theme.",
    gradeRange: "1 – 6",
    previewRows: ["Characters | Setting | Problem", "Event 1 → Event 2 → Solution"],
    typeOptions: [
      { key: "layout", label: "Layout", type: "chips", options: ["Linear", "Circular"], default: "Linear" },
      { key: "includeTheme", label: "Include Theme Box", type: "toggle", default: true },
      { key: "eventCount", label: "Event Boxes", type: "chips", options: ["2", "3", "4", "5"], default: "3" },
    ],
  },
  {
    id: "kwl_chart",
    label: "KWL Chart",
    shortLabel: "KWL",
    category: "organizer",
    icon: "📊",
    description: "Three columns: Know / Want to Know / Learned. Optional How to Find Out column.",
    gradeRange: "1 – 6",
    previewRows: ["K — What I Know", "W — Want to Know", "L — Learned"],
    isPrimary: true,
    typeOptions: [
      { key: "variant", label: "Chart Type", type: "chips", options: ["KWL (3 columns)", "KWHL (4 columns)"], default: "KWL (3 columns)" },
      { key: "topic", label: "Topic (optional)", type: "text", default: "", description: "Pre-fills the chart header" },
      { key: "rowCount", label: "Row Lines", type: "chips", options: ["5", "8", "10", "12"], default: "8" },
    ],
  },
  {
    id: "sequence_chart",
    label: "Sequence / Flow Chart",
    shortLabel: "Sequence",
    category: "organizer",
    icon: "➡️",
    description: "Numbered boxes with arrows showing steps, events, or stages in order.",
    gradeRange: "K – 6",
    previewRows: ["Step 1 → Step 2 → Step 3", "Numbered sequence boxes"],
    isPrimary: true,
    typeOptions: [
      { key: "stepCount", label: "Number of Steps", type: "chips", options: ["3", "4", "5", "6"], default: "4" },
      { key: "layout", label: "Layout", type: "chips", options: ["Horizontal", "Vertical", "Z-pattern"], default: "Vertical" },
      { key: "illustrationSpace", label: "Illustration Space per Step", type: "toggle", default: false },
      { key: "linesPerStep", label: "Lines per Step", type: "chips", options: ["2", "3", "4"], default: "3" },
    ],
  },
  {
    id: "frayer_model",
    label: "Frayer Model",
    shortLabel: "Frayer",
    category: "organizer",
    icon: "⊞",
    description: "Page divided into 4 labeled quadrants around a center term. Definition, example, non-example, picture.",
    gradeRange: "2 – 6",
    previewRows: ["Definition | Example", "Non-example | Picture/Draw"],
    isPrimary: true,
    typeOptions: [
      { key: "centerTerm", label: "Center Term", type: "text", default: "", description: "The vocabulary word or concept in the center" },
      { key: "q1Label", label: "Quadrant 1 Label", type: "text", default: "Definition" },
      { key: "q2Label", label: "Quadrant 2 Label", type: "text", default: "Example" },
      { key: "q3Label", label: "Quadrant 3 Label", type: "text", default: "Non-Example" },
      { key: "q4Label", label: "Quadrant 4 Label", type: "text", default: "Draw It" },
      { key: "linesInQuads", label: "Writing Lines in Quadrants", type: "toggle", default: true },
    ],
  },

  // ── MATH ──────────────────────────────────────────────────────────────────

  {
    id: "number_bond",
    label: "Number Bond",
    shortLabel: "Number Bond",
    category: "math",
    icon: "🔵",
    description: "Circles connected by lines showing part-part-whole relationships.",
    gradeRange: "K – 3",
    previewRows: ["○ — ◉ — ○", "Part | Whole | Part"],
    typeOptions: [
      { key: "bondCount", label: "Number of Bonds", type: "chips", options: ["4", "6", "8", "10", "12"], default: "6" },
      { key: "focus", label: "Focus", type: "chips", options: ["Addition", "Subtraction", "Mixed"], default: "Addition" },
      { key: "numberRange", label: "Number Range", type: "chips", options: ["1–5", "1–10", "1–20", "Custom"], default: "1–10" },
    ],
  },
  {
    id: "ten_frame",
    label: "Ten Frame",
    shortLabel: "Ten Frame",
    category: "math",
    icon: "🟦",
    description: "Empty ten frame grids for counting, addition, and number sense activities.",
    gradeRange: "K – 2",
    previewRows: ["[ ][ ][ ][ ][ ]", "[ ][ ][ ][ ][ ]"],
    typeOptions: [
      { key: "frameCount", label: "Frames per Page", type: "chips", options: ["1", "2", "3", "4", "5", "6"], default: "4" },
      { key: "activity", label: "Activity Type", type: "chips", options: ["Draw counters", "Fill in numbers", "Represent a number", "Compare"], default: "Draw counters" },
      { key: "numberRange", label: "Numbers", type: "chips", options: ["1–5", "1–10", "11–20"], default: "1–10" },
    ],
  },
  {
    id: "graph_page",
    label: "Graph / Data Page",
    shortLabel: "Graph",
    category: "math",
    icon: "📈",
    description: "Empty bar graph or pictograph with labeled axes. Data provided as word problem.",
    gradeRange: "1 – 5",
    previewRows: ["📊 Empty graph grid", "Labeled axes"],
    typeOptions: [
      { key: "graphType", label: "Graph Type", type: "chips", options: ["Bar graph", "Pictograph", "Line graph", "Pie chart"], default: "Bar graph" },
      { key: "categories", label: "Category Labels", type: "textarea", default: "", description: "Comma-separated axis labels" },
      { key: "maxValue", label: "Max Value on Scale", type: "chips", options: ["5", "10", "15", "20", "25", "50"], default: "10" },
    ],
  },
  {
    id: "clock_practice",
    label: "Clock / Time",
    shortLabel: "Clock",
    category: "math",
    icon: "🕐",
    description: "Analog clock faces — draw hands for given time, or write time shown.",
    gradeRange: "1 – 3",
    previewRows: ["🕐 Clock face", "Write the time: ___"],
    typeOptions: [
      { key: "clockCount", label: "Clocks per Page", type: "chips", options: ["4", "6", "8", "9", "12"], default: "6" },
      { key: "precision", label: "Time Precision", type: "chips", options: ["To the hour", "Half hour", "Quarter hour", "5 minutes", "1 minute"], default: "Half hour" },
      { key: "direction", label: "Direction", type: "chips", options: ["Draw the hands", "Write the time", "Mixed"], default: "Draw the hands" },
    ],
  },
  {
    id: "measurement",
    label: "Measurement",
    shortLabel: "Measure",
    category: "math",
    icon: "📏",
    description: "Objects with ruler images for measuring. Inches or centimeters.",
    gradeRange: "1 – 4",
    previewRows: ["📏 Ruler + object", "Measure to: ___ cm"],
    typeOptions: [
      { key: "unit", label: "Unit", type: "chips", options: ["Inches", "Centimeters", "Both"], default: "Inches" },
      { key: "itemCount", label: "Items to Measure", type: "chips", options: ["4", "6", "8"], default: "6" },
    ],
  },

  // ── SCIENCE / SOCIAL STUDIES ───────────────────────────────────────────────

  {
    id: "label_diagram",
    label: "Label the Diagram",
    shortLabel: "Label Diagram",
    category: "science",
    icon: "🔍",
    description: "Illustration with numbered blank lines pointing to parts. Optional word bank.",
    gradeRange: "1 – 6",
    previewRows: ["🖼️ Diagram with arrows", "① ___ ② ___ ③ ___"],
    isPrimary: true,
    typeOptions: [
      { key: "diagramSubject", label: "Diagram Subject", type: "text", default: "", description: "e.g. parts of a plant, human skeleton, solar system" },
      { key: "partCount", label: "Parts to Label", type: "chips", options: ["4", "6", "8", "10", "12"], default: "6" },
      { key: "wordBank", label: "Include Word Bank", type: "toggle", default: true },
    ],
  },
  {
    id: "observation_sheet",
    label: "Observation Sheet",
    shortLabel: "Observation",
    category: "science",
    icon: "🔬",
    description: "My Hypothesis / What I Observed / What I Learned. For science experiments and investigations.",
    gradeRange: "1 – 6",
    previewRows: ["🔬 My Hypothesis:", "📝 What I Observed:", "💡 What I Learned:"],
    typeOptions: [
      { key: "includeDrawing", label: "Drawing Space", type: "toggle", default: true },
      { key: "sections", label: "Sections", type: "chips", options: ["Hypothesis + Observe + Learn", "Observe + Draw + Learn", "Full scientific method"], default: "Hypothesis + Observe + Learn" },
    ],
  },
  {
    id: "timeline",
    label: "Timeline",
    shortLabel: "Timeline",
    category: "science",
    icon: "📅",
    description: "Horizontal or vertical line with evenly spaced event boxes for students to fill in.",
    gradeRange: "2 – 6",
    previewRows: ["━━●━━●━━●━━", "Event 1 → Event 2 → Event 3"],
    typeOptions: [
      { key: "orientation", label: "Orientation", type: "chips", options: ["Horizontal", "Vertical"], default: "Horizontal" },
      { key: "eventCount", label: "Event Slots", type: "chips", options: ["4", "5", "6", "7", "8"], default: "5" },
      { key: "format", label: "Format", type: "chips", options: ["Student fills in", "Pre-filled to order", "Cut and paste"], default: "Student fills in" },
    ],
  },
  {
    id: "map_activity",
    label: "Map Activity",
    shortLabel: "Map",
    category: "science",
    icon: "🗺️",
    description: "Blank or partially labeled map with compass rose, key, and title area.",
    gradeRange: "2 – 6",
    previewRows: ["🗺️ Map outline", "N↑ Compass rose + Legend"],
    typeOptions: [
      { key: "mapType", label: "Map Type", type: "chips", options: ["Classroom", "School", "Community", "State", "Country", "World"], default: "Community" },
      { key: "includeCompass", label: "Compass Rose", type: "toggle", default: true },
      { key: "includeKey", label: "Map Key", type: "toggle", default: true },
    ],
  },

  // ── GAMES & INTERACTIVE ────────────────────────────────────────────────────

  {
    id: "bingo_card",
    label: "Bingo Card",
    shortLabel: "Bingo",
    category: "games",
    icon: "🎲",
    description: "5×5 or 4×4 grid with FREE space. AI randomly places words from teacher's list.",
    gradeRange: "K – 6",
    previewRows: ["B  I  N  G  O", "[★] [  ] [  ] [FREE] [  ]"],
    isPrimary: true,
    typeOptions: [
      { key: "gridSize", label: "Grid Size", type: "chips", options: ["4×4", "5×5"], default: "5×5" },
      { key: "freeSpace", label: "FREE Space", type: "toggle", default: true },
      { key: "wordList", label: "Word / Number List", type: "textarea", default: "", description: "One per line or comma-separated. AI generates from topic if blank." },
      { key: "cardCount", label: "Unique Cards", type: "chips", options: ["1", "5", "10", "15", "30"], default: "1" },
    ],
  },
  {
    id: "word_search",
    label: "Word Search",
    shortLabel: "Word Search",
    category: "games",
    icon: "🔎",
    description: "Letter grid with hidden words. Word list below with checkboxes.",
    gradeRange: "K – 6",
    previewRows: ["P R E T T Y W S", "Grid with hidden words"],
    isPrimary: true,
    typeOptions: [
      { key: "wordList", label: "Word List", type: "textarea", default: "", description: "One per line. AI generates from topic if blank." },
      { key: "gridSize", label: "Grid Size", type: "chips", options: ["8×8", "10×10", "12×12", "15×15"], default: "10×10" },
      { key: "directions", label: "Word Directions", type: "chips", options: ["Horizontal only", "Horiz + Vertical", "All directions"], default: "Horiz + Vertical" },
      { key: "showWordList", label: "Show Word List Below", type: "toggle", default: true },
      { key: "includeAnswerKey", label: "Answer Key", type: "toggle", default: false },
    ],
  },
  {
    id: "crossword",
    label: "Crossword Puzzle",
    shortLabel: "Crossword",
    category: "games",
    icon: "🔲",
    description: "Numbered grid with Across and Down clues. AI generates from vocabulary + definitions.",
    gradeRange: "2 – 6",
    previewRows: ["[■][A][  ][ B ]", "Across: 1. ___ Down: 2. ___"],
    typeOptions: [
      { key: "clueCount", label: "Number of Words", type: "chips", options: ["6", "8", "10", "12"], default: "8" },
      { key: "difficulty", label: "Difficulty", type: "chips", options: ["Easy (short words)", "Medium", "Hard"], default: "Medium" },
    ],
  },
  {
    id: "spinner",
    label: "Spinner Activity",
    shortLabel: "Spinner",
    category: "games",
    icon: "🌀",
    description: "Circle divided into sections. Students use a pencil and paper clip as a spinner.",
    gradeRange: "K – 6",
    previewRows: ["🌀 Circle spinner", "Record results below"],
    typeOptions: [
      { key: "sections", label: "Number of Sections", type: "chips", options: ["4", "6", "8"], default: "6" },
      { key: "sectionLabels", label: "Section Labels", type: "textarea", default: "", description: "Comma-separated. AI fills from topic if blank." },
      { key: "recordSheet", label: "Tally/Record Sheet Below", type: "toggle", default: true },
    ],
  },
  {
    id: "dice_activity",
    label: "Roll and ___",
    shortLabel: "Dice Activity",
    category: "games",
    icon: "🎲",
    description: "Large dice faces to roll. Response chart based on what they roll.",
    gradeRange: "K – 4",
    previewRows: ["⚀ ⚁ ⚂ ⚃ ⚄ ⚅", "Roll: ___ | Do: ___"],
    typeOptions: [
      { key: "activityTitle", label: "Roll and ___", type: "text", default: "Write", description: "e.g. Write, Draw, Answer, Read" },
      { key: "dieFaces", label: "Die Faces", type: "chips", options: ["6-sided", "Custom faces"], default: "6-sided" },
      { key: "instructions", label: "What each face means", type: "textarea", default: "", description: "6 lines, one per face" },
    ],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export const TYPE_MAP: Record<WorksheetTypeId, WorksheetTypeDef> = Object.fromEntries(
  WORKSHEET_TYPES.map((t) => [t.id, t])
) as Record<WorksheetTypeId, WorksheetTypeDef>;

export const TYPES_BY_CATEGORY: Record<WorksheetCategory, WorksheetTypeDef[]> = {
  coloring: [],
  matching: [],
  writing: [],
  organizer: [],
  math: [],
  science: [],
  games: [],
};
WORKSHEET_TYPES.forEach((t) => TYPES_BY_CATEGORY[t.category].push(t));
