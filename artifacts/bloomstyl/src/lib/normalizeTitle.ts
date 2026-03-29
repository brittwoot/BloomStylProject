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

/**
 * Converts a snake_case or raw subject key into a formal label.
 * e.g. "english_language_arts" → "English Language Arts"
 *      "math"                  → "Math"
 */
export function normalizeFormalLabel(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
