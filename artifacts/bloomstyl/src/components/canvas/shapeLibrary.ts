import type { ShapeDefinition, ContentBlockDefinition } from "./canvasTypes";

export const SHAPES: ShapeDefinition[] = [
  { id: "rect", label: "Rectangle", category: "basic", fabricType: "rect", defaultWidth: 160, defaultHeight: 100 },
  { id: "rounded-rect", label: "Rounded Rect", category: "basic", fabricType: "rect", defaultWidth: 160, defaultHeight: 100 },
  { id: "circle", label: "Circle", category: "basic", fabricType: "circle", defaultWidth: 100, defaultHeight: 100 },
  { id: "oval", label: "Oval", category: "basic", fabricType: "circle", defaultWidth: 140, defaultHeight: 90 },
  { id: "triangle", label: "Triangle", category: "basic", fabricType: "triangle", defaultWidth: 120, defaultHeight: 100 },
  {
    id: "diamond", label: "Diamond", category: "basic",
    svgPath: "M 50 5 L 95 50 L 50 95 L 5 50 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "pentagon", label: "Pentagon", category: "basic",
    svgPath: "M 50 5 L 96 34 L 78 95 L 22 95 L 4 34 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "hexagon", label: "Hexagon", category: "basic",
    svgPath: "M 50 5 L 95 27 L 95 73 L 50 95 L 5 73 L 5 27 Z",
    defaultWidth: 110, defaultHeight: 100,
  },
  {
    id: "octagon", label: "Octagon", category: "basic",
    svgPath: "M 30 5 L 70 5 L 95 30 L 95 70 L 70 95 L 30 95 L 5 70 L 5 30 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "star-5", label: "Star (5pt)", category: "basic",
    svgPath: "M 50 5 L 61 35 L 95 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 5 35 L 39 35 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "star-4", label: "Star (4pt)", category: "basic",
    svgPath: "M 50 5 L 57 43 L 95 50 L 57 57 L 50 95 L 43 57 L 5 50 L 43 43 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "star-6", label: "Star (6pt)", category: "basic",
    svgPath: "M 50 5 L 58 35 L 85 18 L 72 47 L 97 50 L 72 53 L 85 82 L 58 65 L 50 95 L 42 65 L 15 82 L 28 53 L 3 50 L 28 47 L 15 18 L 42 35 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "star-8", label: "Star (8pt)", category: "basic",
    svgPath: "M 50 5 L 55 36 L 73 15 L 64 44 L 88 30 L 72 54 L 97 54 L 74 67 L 88 88 L 64 72 L 73 95 L 55 78 L 50 95 L 45 78 L 27 95 L 36 72 L 12 88 L 26 67 L 3 54 L 28 54 L 12 30 L 36 44 L 27 15 L 45 36 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "heart", label: "Heart", category: "basic",
    svgPath: "M 50 85 C 10 60 0 35 15 20 C 25 6 40 10 50 25 C 60 10 75 6 85 20 C 100 35 90 60 50 85 Z",
    defaultWidth: 100, defaultHeight: 90,
  },
  {
    id: "arrow-right", label: "Arrow Right", category: "basic",
    svgPath: "M 5 35 L 55 35 L 55 15 L 95 50 L 55 85 L 55 65 L 5 65 Z",
    defaultWidth: 120, defaultHeight: 70,
  },
  {
    id: "arrow-left", label: "Arrow Left", category: "basic",
    svgPath: "M 95 35 L 45 35 L 45 15 L 5 50 L 45 85 L 45 65 L 95 65 Z",
    defaultWidth: 120, defaultHeight: 70,
  },
  {
    id: "arrow-up", label: "Arrow Up", category: "basic",
    svgPath: "M 65 95 L 65 45 L 85 45 L 50 5 L 15 45 L 35 45 L 35 95 Z",
    defaultWidth: 70, defaultHeight: 120,
  },
  {
    id: "arrow-down", label: "Arrow Down", category: "basic",
    svgPath: "M 35 5 L 35 55 L 15 55 L 50 95 L 85 55 L 65 55 L 65 5 Z",
    defaultWidth: 70, defaultHeight: 120,
  },
  {
    id: "arrow-double", label: "Double Arrow", category: "basic",
    svgPath: "M 5 50 L 25 30 L 25 42 L 75 42 L 75 30 L 95 50 L 75 70 L 75 58 L 25 58 L 25 70 Z",
    defaultWidth: 140, defaultHeight: 60,
  },
  {
    id: "cross", label: "Cross/Plus", category: "basic",
    svgPath: "M 35 5 L 65 5 L 65 35 L 95 35 L 95 65 L 65 65 L 65 95 L 35 95 L 35 65 L 5 65 L 5 35 L 35 35 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "cloud", label: "Cloud", category: "basic",
    svgPath: "M 25 65 Q 10 65 10 52 Q 10 40 22 38 Q 18 22 32 18 Q 38 5 52 8 Q 62 2 70 12 Q 82 10 85 22 Q 95 24 95 35 Q 98 48 88 55 Q 90 65 80 67 Z",
    defaultWidth: 130, defaultHeight: 80,
  },
  {
    id: "speech-bubble", label: "Speech Bubble", category: "basic",
    svgPath: "M 5 5 L 95 5 L 95 70 L 60 70 L 50 90 L 42 70 L 5 70 Z",
    defaultWidth: 150, defaultHeight: 100,
  },
  {
    id: "thought-bubble", label: "Thought Bubble", category: "basic",
    svgPath: "M 10 35 Q 10 5 50 5 Q 90 5 90 35 Q 90 60 60 65 Q 55 75 40 75 Q 30 80 20 75 Q 5 65 10 35 Z M 18 82 Q 22 78 22 83 Q 22 88 17 88 Q 12 88 12 83 Q 12 78 18 82 Z M 10 91 Q 12 88 13 91 Q 14 94 11 94 Q 8 94 8 91 Z",
    defaultWidth: 120, defaultHeight: 110,
  },
  {
    id: "starburst", label: "Starburst", category: "decorative",
    svgPath: "M 50 2 L 55 28 L 70 10 L 62 35 L 83 22 L 72 45 L 95 40 L 80 58 L 98 62 L 78 72 L 92 86 L 70 80 L 68 98 L 54 83 L 44 99 L 42 80 L 22 89 L 28 70 L 5 72 L 20 55 L 2 45 L 26 44 L 18 22 L 40 34 L 36 10 L 52 28 Z",
    defaultWidth: 110, defaultHeight: 110,
  },
  {
    id: "lightning", label: "Lightning Bolt", category: "decorative",
    svgPath: "M 60 5 L 35 50 L 55 50 L 30 95 L 70 42 L 48 42 Z",
    defaultWidth: 70, defaultHeight: 110,
  },
  {
    id: "moon", label: "Moon Crescent", category: "decorative",
    svgPath: "M 65 10 Q 30 10 20 50 Q 10 90 55 90 Q 30 85 30 50 Q 30 15 65 10 Z",
    defaultWidth: 80, defaultHeight: 100,
  },
  {
    id: "leaf", label: "Leaf", category: "decorative",
    svgPath: "M 50 5 Q 90 30 90 70 Q 70 90 50 95 Q 30 90 10 70 Q 10 30 50 5 Z",
    defaultWidth: 80, defaultHeight: 110,
  },
  {
    id: "flower", label: "Flower (5pt)", category: "decorative",
    svgPath: "M 50 20 Q 60 5 70 20 Q 85 10 82 27 Q 98 28 90 42 Q 100 55 86 58 Q 90 74 75 72 Q 70 88 55 82 Q 48 96 42 82 Q 26 88 24 72 Q 8 73 12 57 Q -2 52 8 40 Q 0 26 18 27 Q 16 10 32 20 Q 40 5 50 20 Z M 50 38 Q 62 38 62 50 Q 62 62 50 62 Q 38 62 38 50 Q 38 38 50 38 Z",
    defaultWidth: 100, defaultHeight: 100,
  },
  {
    id: "banner", label: "Banner Ribbon", category: "educational",
    svgPath: "M 2 25 L 20 50 L 2 75 L 98 75 L 98 25 Z",
    defaultWidth: 200, defaultHeight: 60,
  },
  {
    id: "sticky-note", label: "Sticky Note", category: "educational",
    svgPath: "M 5 5 L 80 5 L 95 20 L 95 95 L 5 95 Z M 80 5 L 80 20 L 95 20 Z",
    defaultWidth: 110, defaultHeight: 110,
  },
  {
    id: "label-tag", label: "Label Tag", category: "educational",
    svgPath: "M 5 5 L 70 5 L 95 50 L 70 95 L 5 95 Z M 20 50 Q 20 44 26 44 Q 32 44 32 50 Q 32 56 26 56 Q 20 56 20 50 Z",
    defaultWidth: 110, defaultHeight: 110,
  },
  {
    id: "polaroid", label: "Polaroid Frame", category: "frames",
    svgPath: "M 5 5 L 95 5 L 95 85 L 5 85 Z M 10 10 L 90 10 L 90 70 L 10 70 Z",
    defaultWidth: 130, defaultHeight: 150,
  },
  {
    id: "chalkboard", label: "Chalkboard", category: "frames",
    svgPath: "M 5 5 L 95 5 L 95 80 L 5 80 Z M 20 85 L 80 85 L 80 90 L 20 90 Z M 30 90 L 70 90 L 70 95 L 30 95 Z",
    defaultWidth: 180, defaultHeight: 130,
  },
];

export const CONTENT_BLOCKS: ContentBlockDefinition[] = [
  { id: "title", label: "Title", icon: "T", description: "Bold heading for your worksheet" },
  { id: "subtitle", label: "Subtitle", icon: "t", description: "Secondary heading or topic line" },
  { id: "name-date", label: "Name / Date Line", icon: "✏️", description: "Student name, date, and class fields" },
  { id: "directions", label: "Directions", icon: "📋", description: "Instructions for the activity" },
  { id: "answer-lines", label: "Answer Lines", icon: "≡", description: "Ruled lines for written responses" },
  { id: "write-in-box", label: "Write-in Box", icon: "▢", description: "Bordered box for student responses" },
  { id: "word-bank", label: "Word Bank", icon: "📦", description: "Vocabulary list in a bordered container" },
  { id: "vocabulary", label: "Vocabulary", icon: "📖", description: "Word + definition pairs" },
  { id: "color-key", label: "Color Key", icon: "🎨", description: "Color swatch and label reference" },
  { id: "custom-text", label: "Custom Text", icon: "✍️", description: "Free text block with full formatting" },
];

export const SHAPE_CATEGORIES = [
  { id: "basic", label: "Basic" },
  { id: "educational", label: "Educational" },
  { id: "frames", label: "Frames" },
  { id: "decorative", label: "Decorative" },
] as const;

export function getShapesByCategory(category: string) {
  return SHAPES.filter((s) => s.category === category);
}

export function getShapeById(id: string) {
  return SHAPES.find((s) => s.id === id);
}
