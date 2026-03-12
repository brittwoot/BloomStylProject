export type ClipartEntry = {
  emoji: string;
  label: string;
  category: string;
  keywords: string[];
};

export const CLIPART_CATEGORIES = [
  "school", "reading", "writing", "math",
  "science", "animals", "weather", "holidays", "classroom",
] as const;

export type ClipartCategory = typeof CLIPART_CATEGORIES[number];

export const CLIPART_DATA: ClipartEntry[] = [
  // school
  { emoji: "🎒", label: "Backpack",       category: "school",    keywords: ["school","bag","backpack"] },
  { emoji: "📚", label: "Books",          category: "school",    keywords: ["books","reading","school"] },
  { emoji: "🏫", label: "School",         category: "school",    keywords: ["school","building","classroom"] },
  { emoji: "🎓", label: "Graduation",     category: "school",    keywords: ["graduate","cap","diploma"] },
  { emoji: "📐", label: "Ruler",          category: "school",    keywords: ["ruler","measure","math"] },
  { emoji: "📏", label: "Ruler 2",        category: "school",    keywords: ["ruler","measure"] },
  { emoji: "📌", label: "Pin",            category: "school",    keywords: ["pin","push pin"] },
  { emoji: "🗂️", label: "Folder",         category: "school",    keywords: ["folder","file","organize"] },

  // reading
  { emoji: "📖", label: "Open Book",      category: "reading",   keywords: ["book","read","reading","story"] },
  { emoji: "👓", label: "Glasses",        category: "reading",   keywords: ["glasses","reading","see"] },
  { emoji: "📰", label: "Newspaper",      category: "reading",   keywords: ["newspaper","article","read"] },
  { emoji: "🔖", label: "Bookmark",       category: "reading",   keywords: ["bookmark","book","reading"] },
  { emoji: "📜", label: "Scroll",         category: "reading",   keywords: ["scroll","text","passage","story"] },
  { emoji: "💬", label: "Speech Bubble",  category: "reading",   keywords: ["speech","talk","dialogue","story"] },
  { emoji: "🗣️", label: "Speaking",       category: "reading",   keywords: ["speak","talk","read aloud"] },

  // writing
  { emoji: "✏️", label: "Pencil",         category: "writing",   keywords: ["pencil","write","writing"] },
  { emoji: "📝", label: "Notepad",        category: "writing",   keywords: ["notepad","notes","writing","worksheet"] },
  { emoji: "🖊️", label: "Pen",            category: "writing",   keywords: ["pen","write","writing"] },
  { emoji: "📄", label: "Paper",          category: "writing",   keywords: ["paper","page","document"] },
  { emoji: "✍️", label: "Writing Hand",   category: "writing",   keywords: ["write","hand","writing"] },
  { emoji: "🖋️", label: "Fountain Pen",   category: "writing",   keywords: ["pen","writing","fancy"] },
  { emoji: "📋", label: "Clipboard",      category: "writing",   keywords: ["clipboard","checklist","worksheet"] },

  // math
  { emoji: "➕", label: "Plus",           category: "math",      keywords: ["add","plus","math","addition"] },
  { emoji: "➗", label: "Divide",         category: "math",      keywords: ["divide","division","math","fractions"] },
  { emoji: "✖️", label: "Multiply",       category: "math",      keywords: ["multiply","times","math","multiplication"] },
  { emoji: "🔢", label: "Numbers",        category: "math",      keywords: ["numbers","math","count","fractions"] },
  { emoji: "📊", label: "Chart",          category: "math",      keywords: ["chart","graph","data","math"] },
  { emoji: "🍕", label: "Pizza Slice",    category: "math",      keywords: ["fractions","pizza","half","math"] },
  { emoji: "🔣", label: "Symbols",        category: "math",      keywords: ["math","symbols","equations"] },
  { emoji: "🧮", label: "Abacus",         category: "math",      keywords: ["abacus","count","math"] },
  { emoji: "📐", label: "Triangle Ruler", category: "math",      keywords: ["geometry","math","angle","ruler"] },

  // science
  { emoji: "🔬", label: "Microscope",    category: "science",   keywords: ["microscope","biology","science","cells"] },
  { emoji: "🔭", label: "Telescope",     category: "science",   keywords: ["telescope","astronomy","space","science"] },
  { emoji: "⚗️", label: "Alembic",       category: "science",   keywords: ["chemistry","lab","experiment","science"] },
  { emoji: "🧪", label: "Test Tube",     category: "science",   keywords: ["chemistry","experiment","lab","science"] },
  { emoji: "🌡️", label: "Thermometer",   category: "science",   keywords: ["temperature","heat","science","weather"] },
  { emoji: "🧬", label: "DNA",           category: "science",   keywords: ["dna","biology","genetics","science"] },
  { emoji: "💧", label: "Water Drop",    category: "science",   keywords: ["water","cycle","science","liquid"] },
  { emoji: "⚡", label: "Lightning",     category: "science",   keywords: ["electricity","energy","science"] },
  { emoji: "🌿", label: "Herb",          category: "science",   keywords: ["plant","leaf","biology","nature","plants"] },
  { emoji: "🌱", label: "Seedling",      category: "science",   keywords: ["plant","grow","nature","biology","plants"] },

  // animals
  { emoji: "🐶", label: "Dog",           category: "animals",   keywords: ["dog","pet","animal"] },
  { emoji: "🐱", label: "Cat",           category: "animals",   keywords: ["cat","pet","animal"] },
  { emoji: "🦁", label: "Lion",          category: "animals",   keywords: ["lion","wild","animal","jungle"] },
  { emoji: "🐘", label: "Elephant",      category: "animals",   keywords: ["elephant","wild","animal","Africa"] },
  { emoji: "🦋", label: "Butterfly",     category: "animals",   keywords: ["butterfly","insect","nature","animal"] },
  { emoji: "🐠", label: "Fish",          category: "animals",   keywords: ["fish","sea","water","ocean","animal"] },
  { emoji: "🦅", label: "Eagle",         category: "animals",   keywords: ["eagle","bird","fly","animal"] },
  { emoji: "🐸", label: "Frog",          category: "animals",   keywords: ["frog","amphibian","animal"] },
  { emoji: "🐝", label: "Bee",           category: "animals",   keywords: ["bee","insect","honey","pollination"] },
  { emoji: "🐢", label: "Turtle",        category: "animals",   keywords: ["turtle","reptile","animal","slow"] },

  // weather
  { emoji: "☀️", label: "Sun",           category: "weather",   keywords: ["sun","hot","summer","weather","water cycle"] },
  { emoji: "🌧️", label: "Rain",          category: "weather",   keywords: ["rain","cloud","water","weather","water cycle"] },
  { emoji: "⛅", label: "Cloud",         category: "weather",   keywords: ["cloud","weather","sky","water cycle"] },
  { emoji: "🌈", label: "Rainbow",       category: "weather",   keywords: ["rainbow","color","weather"] },
  { emoji: "❄️", label: "Snow",          category: "weather",   keywords: ["snow","cold","winter","weather","water cycle"] },
  { emoji: "🌪️", label: "Tornado",       category: "weather",   keywords: ["tornado","storm","wind","weather"] },
  { emoji: "🌊", label: "Wave",          category: "weather",   keywords: ["wave","ocean","water","weather"] },
  { emoji: "⛈️", label: "Storm",         category: "weather",   keywords: ["storm","thunder","lightning","weather"] },

  // holidays
  { emoji: "🎃", label: "Halloween",     category: "holidays",  keywords: ["halloween","fall","october"] },
  { emoji: "🎄", label: "Christmas",     category: "holidays",  keywords: ["christmas","winter","december"] },
  { emoji: "🎉", label: "Celebrate",     category: "holidays",  keywords: ["party","celebrate","holiday"] },
  { emoji: "🌸", label: "Spring",        category: "holidays",  keywords: ["spring","flower","bloom"] },
  { emoji: "🦃", label: "Thanksgiving",  category: "holidays",  keywords: ["thanksgiving","fall","november"] },
  { emoji: "🎆", label: "Fireworks",     category: "holidays",  keywords: ["fireworks","fourth of july","celebrate"] },
  { emoji: "🐰", label: "Easter",        category: "holidays",  keywords: ["easter","spring","bunny"] },

  // classroom
  { emoji: "🖥️", label: "Computer",      category: "classroom", keywords: ["computer","technology","class"] },
  { emoji: "🎨", label: "Art",           category: "classroom", keywords: ["art","color","creative","classroom"] },
  { emoji: "🖍️", label: "Crayon",        category: "classroom", keywords: ["crayon","color","draw","art"] },
  { emoji: "📌", label: "Pushpin",       category: "classroom", keywords: ["pin","board","classroom"] },
  { emoji: "🪑", label: "Chair",         category: "classroom", keywords: ["chair","desk","classroom","sit"] },
  { emoji: "🎭", label: "Drama",         category: "classroom", keywords: ["drama","theater","performance","class"] },
  { emoji: "🌍", label: "Globe",         category: "classroom", keywords: ["globe","geography","world","map"] },
  { emoji: "⭐", label: "Star",          category: "classroom", keywords: ["star","reward","good job","classroom"] },
  { emoji: "🏆", label: "Trophy",        category: "classroom", keywords: ["trophy","award","achievement","classroom"] },
];

// ── Keyword-based clipart suggestion ─────────────────────────────────────────

const KEYWORD_PHRASES: Record<string, string[]> = {
  "water cycle":    ["rain", "sun", "cloud", "snow", "wave"],
  "fractions":      ["pizza", "divide", "numbers", "math"],
  "plants":         ["seedling", "herb", "butterfly", "bee"],
  "photosynthesis": ["seedling", "herb", "sun", "leaf"],
  "animals":        ["lion", "elephant", "eagle", "turtle"],
  "reading":        ["open book", "bookmark", "glasses"],
  "writing":        ["pencil", "pen", "notepad"],
  "math":           ["abacus", "numbers", "chart"],
  "science":        ["microscope", "test tube", "dna"],
  "weather":        ["sun", "rain", "cloud", "snow"],
  "seasons":        ["sun", "snow", "rainbow", "spring"],
  "history":        ["scroll", "globe", "trumpet"],
  "geography":      ["globe", "mountain", "wave"],
  "space":          ["telescope", "star", "lightning"],
  "halloween":      ["halloween", "star"],
  "christmas":      ["christmas", "star", "celebrate"],
};

export function getSuggestedClipart(text: string): ClipartEntry[] {
  const lower = text.toLowerCase();
  const matched = new Map<string, ClipartEntry>();

  // 1. Match keyword phrases
  for (const [phrase, labels] of Object.entries(KEYWORD_PHRASES)) {
    if (lower.includes(phrase)) {
      labels.forEach((label) => {
        const item = CLIPART_DATA.find(
          (c) => c.label.toLowerCase() === label.toLowerCase()
        );
        if (item) matched.set(item.emoji, item);
      });
    }
  }

  // 2. Match individual keywords in clipart data
  const words = lower.split(/\W+/).filter((w) => w.length > 3);
  for (const word of words) {
    for (const item of CLIPART_DATA) {
      if (item.keywords.some((k) => k.toLowerCase().includes(word) || word.includes(k.toLowerCase()))) {
        if (matched.size < 12) matched.set(item.emoji, item);
      }
    }
  }

  return Array.from(matched.values()).slice(0, 8);
}
