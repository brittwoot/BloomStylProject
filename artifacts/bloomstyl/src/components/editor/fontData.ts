export type FontCategory = "clean" | "classroom" | "modern" | "playful" | "handwriting" | "cursive";

export type FontEntry = {
  name: string;
  category: FontCategory;
  previewStyle?: string;
};

export const FONT_CATEGORIES: { id: FontCategory; label: string; emoji: string }[] = [
  { id: "clean",       label: "Clean",       emoji: "📋" },
  { id: "classroom",   label: "Classroom",   emoji: "🏫" },
  { id: "modern",      label: "Modern",      emoji: "✨" },
  { id: "playful",     label: "Playful",     emoji: "🎉" },
  { id: "handwriting", label: "Handwriting", emoji: "✍️" },
  { id: "cursive",     label: "Cursive",     emoji: "🌸" },
];

export const ALL_FONTS: FontEntry[] = [
  // Clean
  { name: "DM Sans",    category: "clean" },
  { name: "Inter",      category: "clean" },
  { name: "Open Sans",  category: "clean" },
  { name: "Roboto",     category: "clean" },
  // Classroom
  { name: "Nunito",     category: "classroom" },
  { name: "Quicksand",  category: "classroom" },
  { name: "Poppins",    category: "classroom" },
  // Modern
  { name: "Outfit",     category: "modern" },
  // Playful
  { name: "Fredoka",    category: "playful" },
  { name: "Baloo 2",    category: "playful" },
  // Handwriting
  { name: "Patrick Hand",       category: "handwriting" },
  { name: "Caveat",             category: "handwriting" },
  { name: "Gloria Hallelujah",  category: "handwriting" },
  // Cursive / Decorative
  { name: "Pacifico",     category: "cursive" },
  { name: "Sacramento",   category: "cursive" },
  { name: "Great Vibes",  category: "cursive" },
];

export type DecorativeHeadingStyle =
  | "plain"
  | "cursive"
  | "shadow"
  | "outlined"
  | "banner"
  | "bubble"
  | "pastel-label"
  | "notebook-tab"
  | "underline-accent";

export const HEADING_STYLES: {
  id: DecorativeHeadingStyle;
  label: string;
  preview: string;
}[] = [
  { id: "plain",          label: "Plain",         preview: "Title" },
  { id: "cursive",        label: "Cursive",        preview: "Title" },
  { id: "shadow",         label: "Shadow",         preview: "Title" },
  { id: "outlined",       label: "Outlined",       preview: "Title" },
  { id: "banner",         label: "Banner",         preview: "Title" },
  { id: "bubble",         label: "Bubble",         preview: "Title" },
  { id: "pastel-label",   label: "Pastel Label",   preview: "Title" },
  { id: "notebook-tab",   label: "Notebook Tab",   preview: "Title" },
  { id: "underline-accent", label: "Underline",    preview: "Title" },
];

export function getHeadingCSS(
  style: DecorativeHeadingStyle,
  accentColor: string
): { containerClass: string; containerStyle: React.CSSProperties; textStyle: React.CSSProperties } {
  const accent = accentColor || "#7c3aed";
  const light = accent + "22";

  switch (style) {
    case "shadow":
      return {
        containerClass: "",
        containerStyle: {},
        textStyle: { textShadow: `2px 2px 0 ${accent}40, 4px 4px 0 ${accent}20` },
      };
    case "outlined":
      return {
        containerClass: "",
        containerStyle: {},
        textStyle: {
          WebkitTextStroke: `1.5px ${accent}`,
          color: "transparent",
        },
      };
    case "banner":
      return {
        containerClass: "rounded-lg px-4 py-2 -mx-4",
        containerStyle: { backgroundColor: accent },
        textStyle: { color: "#fff" },
      };
    case "bubble":
      return {
        containerClass: "inline-block rounded-full px-5 py-1",
        containerStyle: { backgroundColor: light, border: `2px solid ${accent}` },
        textStyle: { color: accent },
      };
    case "pastel-label":
      return {
        containerClass: "inline-block rounded-lg px-4 py-1",
        containerStyle: { backgroundColor: light },
        textStyle: { color: accent },
      };
    case "notebook-tab":
      return {
        containerClass: "pl-4 border-l-4 rounded-r",
        containerStyle: { borderLeftColor: accent },
        textStyle: { color: accent },
      };
    case "underline-accent":
      return {
        containerClass: "pb-1",
        containerStyle: {
          borderBottom: `3px solid ${accent}`,
          display: "inline-block",
        },
        textStyle: {},
      };
    default:
      return { containerClass: "", containerStyle: {}, textStyle: {} };
  }
}
