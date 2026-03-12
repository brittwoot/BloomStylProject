export type ReadingLevel =
  | "Pre-K" | "K" | "1st" | "2nd" | "3rd" | "4th" | "5th"
  | "6th" | "7th" | "8th" | "9th" | "10th" | "11th" | "12th";

export type VocabularyLevel = "simplified" | "grade-level" | "advanced";
export type SentenceLengthLevel = "short" | "medium" | "long";
export type ImageSupportLevel = "none" | "some" | "heavy";
export type WordBankOption = "none" | "partial" | "full";
export type SentenceFrameOption = "none" | "partial" | "full";
export type ExampleAnswerOption = "none" | "first-only" | "all";
export type QuestionType = "multiple_choice" | "short_answer" | "true_false" | "fill_in_blank" | "essay";
export type BloomsTaxonomy = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type AnswerSpaceLevel = "compact" | "standard" | "expanded";
export type BilingualMode = "none" | "side-by-side" | "glossary-only";
export type VersionIndicator = "none" | "subtle-dot" | "corner-tab" | "letter";
export type PrintMode = "all-together" | "separately";

export type ScaffoldSettings = {
  readingLevel: ReadingLevel;
  sentenceLength: SentenceLengthLevel;
  vocabularyLevel: VocabularyLevel;
  textReduction: number;
  imageSupport: ImageSupportLevel;
  wordBank: WordBankOption;
  sentenceFrames: SentenceFrameOption;
  exampleAnswers: ExampleAnswerOption;
  questionType: QuestionType;
  bloomsDepth: BloomsTaxonomy;
  questionCount: number;
  questionCountSyncWithAnchor: boolean;
  answerSpace: AnswerSpaceLevel;
  ellLanguagePair: string;
  bilingualMode: BilingualMode;
  dyslexiaFriendly: boolean;
  reducedContent: boolean;
};

export const DEFAULT_SCAFFOLD_SETTINGS: ScaffoldSettings = {
  readingLevel: "3rd",
  sentenceLength: "medium",
  vocabularyLevel: "grade-level",
  textReduction: 100,
  imageSupport: "none",
  wordBank: "none",
  sentenceFrames: "none",
  exampleAnswers: "none",
  questionType: "short_answer",
  bloomsDepth: "understand",
  questionCount: 5,
  questionCountSyncWithAnchor: true,
  answerSpace: "standard",
  ellLanguagePair: "",
  bilingualMode: "none",
  dyslexiaFriendly: false,
  reducedContent: false,
};

export type LevelType = "grade" | "readiness" | "ell" | "learning-profile";

export type LevelPreset = {
  id: string;
  label: string;
  color: string;
  type: LevelType;
  scaffoldOverrides: Partial<ScaffoldSettings>;
};

export const LEVEL_PRESETS: Record<LevelType, LevelPreset[]> = {
  grade: [
    { id: "grade-below", label: "Below Grade", color: "#f59e0b", type: "grade", scaffoldOverrides: { readingLevel: "1st", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 60, imageSupport: "heavy", wordBank: "full", bloomsDepth: "remember" } },
    { id: "grade-on", label: "On Grade", color: "#10b981", type: "grade", scaffoldOverrides: { readingLevel: "3rd", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 100, imageSupport: "some", wordBank: "none", bloomsDepth: "understand" } },
    { id: "grade-above", label: "Above Grade", color: "#8b5cf6", type: "grade", scaffoldOverrides: { readingLevel: "5th", sentenceLength: "long", vocabularyLevel: "advanced", textReduction: 100, imageSupport: "none", wordBank: "none", bloomsDepth: "analyze" } },
  ],
  readiness: [
    { id: "readiness-approaching", label: "Approaching", color: "#f59e0b", type: "readiness", scaffoldOverrides: { readingLevel: "2nd", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 70, wordBank: "full", sentenceFrames: "full", exampleAnswers: "first-only", bloomsDepth: "remember" } },
    { id: "readiness-on", label: "On Grade", color: "#10b981", type: "readiness", scaffoldOverrides: { readingLevel: "3rd", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 100, bloomsDepth: "understand" } },
    { id: "readiness-above", label: "Above", color: "#3b82f6", type: "readiness", scaffoldOverrides: { readingLevel: "5th", sentenceLength: "long", vocabularyLevel: "advanced", textReduction: 100, bloomsDepth: "evaluate" } },
  ],
  ell: [
    { id: "ell-beginning", label: "Beginning", color: "#ef4444", type: "ell", scaffoldOverrides: { readingLevel: "K", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 50, imageSupport: "heavy", wordBank: "full", sentenceFrames: "full", exampleAnswers: "all", bilingualMode: "side-by-side", bloomsDepth: "remember" } },
    { id: "ell-intermediate", label: "Intermediate", color: "#f59e0b", type: "ell", scaffoldOverrides: { readingLevel: "2nd", sentenceLength: "medium", vocabularyLevel: "simplified", textReduction: 75, imageSupport: "some", wordBank: "partial", sentenceFrames: "partial", bilingualMode: "glossary-only", bloomsDepth: "understand" } },
    { id: "ell-advanced", label: "Advanced", color: "#10b981", type: "ell", scaffoldOverrides: { readingLevel: "4th", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 90, wordBank: "partial", bloomsDepth: "apply" } },
  ],
  "learning-profile": [
    { id: "lp-dyslexia", label: "Dyslexia-Friendly", color: "#8b5cf6", type: "learning-profile", scaffoldOverrides: { dyslexiaFriendly: true, sentenceLength: "short", answerSpace: "expanded", textReduction: 80 } },
    { id: "lp-reduced", label: "Reduced Content", color: "#f59e0b", type: "learning-profile", scaffoldOverrides: { reducedContent: true, textReduction: 50, questionCount: 3, answerSpace: "expanded", bloomsDepth: "remember" } },
    { id: "lp-standard", label: "Standard", color: "#10b981", type: "learning-profile", scaffoldOverrides: {} },
  ],
};

export type VersionStatus = "idle" | "generating" | "complete" | "error";

export type WorksheetVersion = {
  id: string;
  label: string;
  color: string;
  isAnchor: boolean;
  scaffoldSettings: ScaffoldSettings;
  content: any | null;
  changeSummary: string[];
  status: VersionStatus;
  error?: string;
  manuallyOverridden: boolean;
  syncAvailable: boolean;
};

export type GlobalDiffSettings = {
  sameTitle: boolean;
  sameTheme: boolean;
  sameLayout: boolean;
  versionIndicator: VersionIndicator;
  printMode: PrintMode;
};

export const DEFAULT_GLOBAL_DIFF_SETTINGS: GlobalDiffSettings = {
  sameTitle: true,
  sameTheme: true,
  sameLayout: true,
  versionIndicator: "corner-tab",
  printMode: "all-together",
};

export type DifferentiatedSet = {
  id: string;
  name: string;
  anchorId: string;
  versions: WorksheetVersion[];
  globalSettings: GlobalDiffSettings;
  createdAt: number;
};

export type DiffTemplate = {
  id: string;
  name: string;
  builtIn: boolean;
  levelType: LevelType;
  levels: Array<{
    label: string;
    color: string;
    scaffoldOverrides: Partial<ScaffoldSettings>;
  }>;
};

export const BUILT_IN_DIFF_TEMPLATES: DiffTemplate[] = [
  {
    id: "grade-band-trio",
    name: "Grade Band Trio",
    builtIn: true,
    levelType: "grade",
    levels: [
      { label: "Below Grade (-1)", color: "#f59e0b", scaffoldOverrides: { readingLevel: "2nd", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 70, imageSupport: "heavy", wordBank: "full", bloomsDepth: "remember" } },
      { label: "On Grade Level", color: "#10b981", scaffoldOverrides: { readingLevel: "3rd", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 100, bloomsDepth: "understand" } },
      { label: "Above Grade (+1)", color: "#8b5cf6", scaffoldOverrides: { readingLevel: "4th", sentenceLength: "long", vocabularyLevel: "advanced", textReduction: 100, bloomsDepth: "analyze" } },
    ],
  },
  {
    id: "ell-support-set",
    name: "ELL Support Set",
    builtIn: true,
    levelType: "ell",
    levels: [
      { label: "Beginning ELL", color: "#ef4444", scaffoldOverrides: { readingLevel: "K", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 50, imageSupport: "heavy", wordBank: "full", sentenceFrames: "full", exampleAnswers: "all", bilingualMode: "side-by-side", bloomsDepth: "remember" } },
      { label: "Intermediate ELL", color: "#f59e0b", scaffoldOverrides: { readingLevel: "2nd", sentenceLength: "medium", vocabularyLevel: "simplified", textReduction: 75, imageSupport: "some", wordBank: "partial", sentenceFrames: "partial", bilingualMode: "glossary-only", bloomsDepth: "understand" } },
      { label: "Advanced ELL", color: "#10b981", scaffoldOverrides: { readingLevel: "4th", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 90, bloomsDepth: "apply" } },
    ],
  },
  {
    id: "mixed-readiness",
    name: "Mixed Readiness",
    builtIn: true,
    levelType: "readiness",
    levels: [
      { label: "Approaching", color: "#f59e0b", scaffoldOverrides: { readingLevel: "2nd", sentenceLength: "short", vocabularyLevel: "simplified", textReduction: 70, wordBank: "full", sentenceFrames: "full", exampleAnswers: "first-only", bloomsDepth: "remember", answerSpace: "expanded" } },
      { label: "On Grade", color: "#10b981", scaffoldOverrides: { readingLevel: "3rd", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 100, bloomsDepth: "understand" } },
      { label: "Above Grade", color: "#3b82f6", scaffoldOverrides: { readingLevel: "5th", sentenceLength: "long", vocabularyLevel: "advanced", textReduction: 100, bloomsDepth: "evaluate" } },
    ],
  },
  {
    id: "dyslexia-on-grade",
    name: "Dyslexia + On Grade",
    builtIn: true,
    levelType: "learning-profile",
    levels: [
      { label: "Dyslexia-Friendly", color: "#8b5cf6", scaffoldOverrides: { dyslexiaFriendly: true, sentenceLength: "short", answerSpace: "expanded", textReduction: 80, vocabularyLevel: "simplified" } },
      { label: "On Grade", color: "#10b981", scaffoldOverrides: { readingLevel: "3rd", sentenceLength: "medium", vocabularyLevel: "grade-level", textReduction: 100, bloomsDepth: "understand" } },
    ],
  },
];
