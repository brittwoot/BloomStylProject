export type SubjectId =
  | "math"
  | "reading"
  | "science"
  | "social"
  | "writing"
  | "phonics"
  | "art"
  | "sel"
  | "ell"
  | "holiday"
  | "general"
  | "custom";

export type FamilyEntry = {
  familyId: string;
  label: string;
};

export function getFamiliesForSubject(subject: SubjectId): FamilyEntry[] {
  switch (subject) {
    case "math":
      return [
        { familyId: "practice", label: "Practice Problems" },
        { familyId: "word_problems", label: "Word Problems" },
        { familyId: "number_bonds", label: "Number Bonds" },
      ];
    case "reading":
      return [
        { familyId: "comprehension", label: "Comprehension" },
        { familyId: "story_map", label: "Story Map" },
        { familyId: "kwl", label: "KWL Chart" },
      ];
    case "science":
      return [
        { familyId: "diagram", label: "Diagram" },
        { familyId: "process", label: "Process Steps" },
        { familyId: "matching", label: "Matching" },
      ];
    case "social":
      return [
        { familyId: "concept", label: "Concept Map" },
        { familyId: "sequence", label: "Sequence" },
        { familyId: "compare", label: "Compare & Contrast" },
      ];
    case "writing":
      return [
        { familyId: "prompt", label: "Writing Prompt" },
        { familyId: "graphic", label: "Graphic Organizer" },
        { familyId: "sentence", label: "Sentence Frames" },
      ];
    case "phonics":
      return [
        { familyId: "word_sort", label: "Word Sort" },
        { familyId: "fill_blank", label: "Fill in the Blank" },
        { familyId: "word_search", label: "Word Search" },
      ];
    default:
      return [
        { familyId: "practice", label: "Practice" },
        { familyId: "organizer", label: "Graphic Organizer" },
        { familyId: "matching", label: "Matching" },
      ];
  }
}

export function getResolvedThreeOptionPlan(
  subject: SubjectId,
  familyId: string,
  topic: string,
  grade: string,
): ReturnType<typeof defaultThreeOptionPlan> {
  return defaultThreeOptionPlan(subject, familyId, topic, grade);
}

export function getCanonicalActivityPlan(
  subject: SubjectId,
  familyId: string,
  topic: string,
  grade: string,
  customActivityType?: string,
): PlanOption {
  if (customActivityType) {
    return { activityType: customActivityType, familyLabel: "Custom" };
  }
  const plan = defaultThreeOptionPlan(subject, familyId, topic, grade);
  return plan.A;
}

export function getDefaultFamilyId(subject: SubjectId): string {
  switch (subject) {
    case "math":
      return "practice";
    case "science":
      return "diagram";
    case "reading":
      return "comprehension";
    case "social":
      return "concept";
    default:
      return "practice";
  }
}

export function resolveFamilyIdForSubject(subject: SubjectId): string {
  return getDefaultFamilyId(subject);
}

type PlanOption = {
  activityType: string;
  familyLabel: string;
};

type PlanTriple = {
  A: PlanOption;
  B: PlanOption;
  C: PlanOption;
};

export function defaultThreeOptionPlan(
  subject: SubjectId,
  familyId: string,
  topic: string,
  grade: string,
): PlanTriple {
  if (subject === "science") {
    return {
      A: { activityType: "label_diagram", familyLabel: "Diagram" },
      B: { activityType: "sequence_chart", familyLabel: "Process Steps" },
      C: { activityType: "line_matching", familyLabel: "Matching" },
    };
  }

  if (subject === "math") {
    return {
      A: { activityType: "math_practice", familyLabel: "Practice" },
      B: { activityType: "math_word_problems", familyLabel: "Word Problems" },
      C: { activityType: "number_bond", familyLabel: "Number Bonds" },
    };
  }

  if (subject === "reading") {
    return {
      A: { activityType: "story_map", familyLabel: "Story Map" },
      B: { activityType: "kwl_chart", familyLabel: "KWL Chart" },
      C: { activityType: "venn_diagram", familyLabel: "Venn Diagram" },
    };
  }

  return {
    A: { activityType: "concept_practice", familyLabel: "Concept Practice" },
    B: { activityType: "sequence_chart", familyLabel: "Sequence" },
    C: { activityType: "line_matching", familyLabel: "Matching" },
  };
}

export function getQuickGenActivityPlan(
  subject: SubjectId,
  slot: "A" | "B" | "C",
  options: { familyId: string; topic: string; grade: string },
): PlanOption {
  const plan = defaultThreeOptionPlan(
    subject,
    options.familyId,
    options.topic,
    options.grade,
  );
  return plan[slot];
}
