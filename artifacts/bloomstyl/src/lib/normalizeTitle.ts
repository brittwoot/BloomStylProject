export function normalizeTitle(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function normalizeDisplayTopic(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function normalizeDisplayText(text: string): string {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
}
