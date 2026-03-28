/** Labels for Quick Gen A/B/C — match API layoutVariantFamily in customize-generate.ts */

const DEFAULT: Record<"A" | "B" | "C", { title: string; blurb: string }> = {
  A: { title: "Clean", blurb: "Straightforward layout with clear sections" },
  B: { title: "Scaffolded", blurb: "More structure, boxes, and guidance" },
  C: { title: "Compact", blurb: "Tighter, efficient use of space" },
};

const DIAGRAM: Record<"A" | "B" | "C", { title: string; blurb: string }> = {
  A: { title: "Center + word bank", blurb: "Large diagram, vocabulary below" },
  B: {
    title: "Diagram left · labels right",
    blurb: "Two columns: model + answer list",
  },
  C: {
    title: "Top + callouts",
    blurb: "Diagram with perimeter numbers, table below",
  },
};

const MATH: Record<"A" | "B" | "C", { title: string; blurb: string }> = {
  A: { title: "Spacious", blurb: "Extra space between problems" },
  B: { title: "Work boxes", blurb: "Each problem in its own box" },
  C: { title: "Compact grid", blurb: "Two-column dense layout" },
};

function family(
  activityType: string | undefined,
): "diagram" | "math" | "default" {
  const a = String(activityType ?? "").trim();
  if (["label_diagram", "observation_sheet", "map_activity"].includes(a))
    return "diagram";
  if (
    [
      "math_practice",
      "math_word_problems",
      "number_bond",
      "ten_frame",
      "graph_page",
      "measurement",
      "clock_practice",
    ].includes(a)
  )
    return "math";
  return "default";
}

export function quickGenLayoutVariantCopy(
  activityType: string | undefined,
  slot: "A" | "B" | "C",
): { title: string; blurb: string } {
  const f = family(activityType);
  if (f === "diagram") return DIAGRAM[slot];
  if (f === "math") return MATH[slot];
  return DEFAULT[slot];
}
