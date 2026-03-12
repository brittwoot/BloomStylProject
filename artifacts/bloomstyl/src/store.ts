import { create } from "zustand";
import { nanoid } from "nanoid";
import type { DecorativeHeadingStyle } from "./components/editor/fontData";

export type ContentBlock = {
  id: string;
  type: "title" | "directions" | "passage" | "questions" | "vocabulary" | "teacher_notes" | "activity" | "objective" | "table" | "extra";
  page: number;
  label: string;
  text: string;
  is_selected: boolean;
  order: number;
};

export type WorksheetSettings = {
  templateType: "reading" | "practice" | "vocabulary";
  theme: "clean" | "classroom" | "fun";
  includeName: boolean;
  includeDate: boolean;
  generateAnswerKey: boolean;
  language: string;
};

// ── Editor State Types ─────────────────────────────────────────────────────────

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: "left" | "center" | "right";
  listStyle: "none" | "bullet" | "number";
};

export type SectionStyle = {
  textStyle: TextStyle;
  bgColor: string;
  borderStyle: "none" | "solid" | "dashed" | "dotted";
  borderColor: string;
  borderWidth: number;
  rounded: boolean;
};

export type ClipartItem = {
  id: string;
  emoji: string;
  label: string;
  category: string;
  size: "sm" | "md" | "lg";
};

export type WorksheetPageStyle = {
  bgColor: string;
  titleFont: string;
  bodyFont: string;
};

// ── Global Typography ──────────────────────────────────────────────────────────

export type GlobalTypography = {
  titleFont: string;
  titleHeadingStyle: DecorativeHeadingStyle;
  titleColor: string;
  headingFont: string;
  headingColor: string;
  bodyFont: string;
  questionFont: string;
  vocabFont: string;
  accentColor: string;
  lineHeight: number;
  baseSize: number;
  letterSpacing: number;
};

export const DEFAULT_TYPOGRAPHY: GlobalTypography = {
  titleFont: "Outfit",
  titleHeadingStyle: "plain",
  titleColor: "#1a1a2e",
  headingFont: "DM Sans",
  headingColor: "#1a1a2e",
  bodyFont: "DM Sans",
  questionFont: "DM Sans",
  vocabFont: "DM Sans",
  accentColor: "#7c3aed",
  lineHeight: 1.7,
  baseSize: 1,
  letterSpacing: 0,
};

// ── Layout Variations (AI Prompt mode — legacy) ───────────────────────────────

export type LayoutVariation = {
  id: string;
  label: string;
  layoutStyle: string;
  description: string;
  accentColor: string;
  worksheet: any;
};

// ── Activity Type Selection (new prompt flow) ──────────────────────────────────

export type ActivitySuggestion = {
  typeId: string;
  typeName: string;
  isPrimary: boolean;
  reason: string;
  previewDescription: string;
  suggestedTitle: string;
  suggestedOptions: Record<string, any>;
};

export type CustomizeOptions = {
  // Common
  title: string;
  gradeLevel: string;
  orientation: "portrait" | "landscape";
  includeName: boolean;
  includeDate: boolean;
  fontStyle: string;
  borderStyle: string;
  colorScheme: string;
  teacherInfo: string;
  // Type-specific (dynamic)
  [key: string]: any;
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "DM Sans",
  fontSize: 14,
  fontColor: "#1a1a2e",
  bold: false,
  italic: false,
  underline: false,
  alignment: "left",
  listStyle: "none",
};

export const DEFAULT_SECTION_STYLE: SectionStyle = {
  textStyle: DEFAULT_TEXT_STYLE,
  bgColor: "transparent",
  borderStyle: "none",
  borderColor: "#d1d5db",
  borderWidth: 1,
  rounded: false,
};

export const DEFAULT_PAGE_STYLE: WorksheetPageStyle = {
  bgColor: "#ffffff",
  titleFont: "Outfit",
  bodyFont: "DM Sans",
};

// ── Store Type ─────────────────────────────────────────────────────────────────

type BloomStore = {
  // Step 1 — Upload
  lessonText: string;
  language: string;
  setLessonText: (text: string) => void;
  setLanguage: (lang: string) => void;

  // Step 2 — Detect
  blocks: ContentBlock[];
  detectedLanguage: string;
  safetyPassed: boolean;
  safetyFlags: string[];
  setDetectionResult: (result: { blocks: ContentBlock[]; detectedLanguage: string; safetyPassed: boolean; safetyFlags?: string[] }) => void;
  toggleBlock: (id: string) => void;
  reorderBlocks: (from: number, to: number) => void;

  // Step 3 — Settings
  settings: WorksheetSettings;
  setSettings: (s: Partial<WorksheetSettings>) => void;

  // Step 4 — Worksheet content
  worksheet: any;
  setWorksheet: (w: any) => void;
  updateSection: (id: string, updates: Partial<any>) => void;
  updateQuestion: (sectionId: string, qId: string, updates: Partial<any>) => void;

  // Step 4 — Editor state
  activeSectionId: string | null;
  sectionStyles: Record<string, SectionStyle>;
  sectionClipart: Record<string, ClipartItem[]>;
  worksheetPageStyle: WorksheetPageStyle;
  globalTypography: GlobalTypography;
  setActiveSection: (id: string | null) => void;
  setSectionStyle: (sectionId: string, updates: Partial<SectionStyle>) => void;
  setTextStyle: (sectionId: string, updates: Partial<TextStyle>) => void;
  setWorksheetPageStyle: (updates: Partial<WorksheetPageStyle>) => void;
  setGlobalTypography: (updates: Partial<GlobalTypography>) => void;
  applyGlobalTypography: (typo: Partial<GlobalTypography>) => void;
  addClipart: (sectionId: string, item: Omit<ClipartItem, "id">) => void;
  removeClipart: (sectionId: string, itemId: string) => void;
  getSectionStyle: (sectionId: string) => SectionStyle;

  // Layout variations (AI prompt mode — legacy)
  layoutVariations: LayoutVariation[] | null;
  setLayoutVariations: (v: LayoutVariation[] | null) => void;

  // Activity type selection (new prompt flow)
  activitySuggestions: ActivitySuggestion[] | null;
  chosenActivityType: string | null;
  customizeOptions: CustomizeOptions;
  parsedPromptData: any;
  originalPrompt: string;
  setActivitySuggestions: (s: ActivitySuggestion[] | null) => void;
  setChosenActivityType: (typeId: string | null) => void;
  setCustomizeOptions: (opts: Partial<CustomizeOptions>) => void;
  setParsedPromptData: (data: any) => void;
  setOriginalPrompt: (p: string) => void;

  // Quick gen (3-step flow)
  quickGen: {
    subject: string;
    topic: string;
    grade: string;
    activityType: string;
    activityTypeName: string;
    details: string;
    colorTheme: string;
    fontStyle: string;
    border: string;
    nameLine: boolean;
    dateLine: boolean;
  } | null;
  setQuickGen: (params: Partial<NonNullable<BloomStore["quickGen"]>>) => void;

  // Reset
  reset: () => void;
};

const DEFAULT_SETTINGS: WorksheetSettings = {
  templateType: "reading",
  theme: "clean",
  includeName: true,
  includeDate: true,
  generateAnswerKey: false,
  language: "English",
};

export const useBloomStore = create<BloomStore>((set, get) => ({
  lessonText: "",
  language: "auto",
  setLessonText: (lessonText) => set({ lessonText }),
  setLanguage: (language) => set({ language }),

  blocks: [],
  detectedLanguage: "English",
  safetyPassed: true,
  safetyFlags: [],
  setDetectionResult: ({ blocks, detectedLanguage, safetyPassed, safetyFlags }) =>
    set({ blocks, detectedLanguage, safetyPassed, safetyFlags: safetyFlags ?? [] }),
  toggleBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, is_selected: !b.is_selected } : b
      ),
    })),
  reorderBlocks: (from, to) =>
    set((state) => {
      const blocks = [...state.blocks];
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })) };
    }),

  settings: DEFAULT_SETTINGS,
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

  worksheet: null,
  setWorksheet: (worksheet) => set({ worksheet }),
  updateSection: (id, updates) =>
    set((state) => ({
      worksheet: {
        ...state.worksheet,
        sections: state.worksheet?.sections?.map((s: any) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),
  updateQuestion: (sectionId, qId, updates) =>
    set((state) => ({
      worksheet: {
        ...state.worksheet,
        sections: state.worksheet?.sections?.map((s: any) =>
          s.id === sectionId
            ? {
                ...s,
                questions: s.questions?.map((q: any) =>
                  q.id === qId ? { ...q, ...updates } : q
                ),
              }
            : s
        ),
      },
    })),

  // Editor state
  activeSectionId: null,
  sectionStyles: {},
  sectionClipart: {},
  worksheetPageStyle: DEFAULT_PAGE_STYLE,
  globalTypography: DEFAULT_TYPOGRAPHY,

  setActiveSection: (id) => set({ activeSectionId: id }),

  getSectionStyle: (sectionId) => {
    const state = get();
    return state.sectionStyles[sectionId] ?? DEFAULT_SECTION_STYLE;
  },

  setSectionStyle: (sectionId, updates) =>
    set((state) => ({
      sectionStyles: {
        ...state.sectionStyles,
        [sectionId]: {
          ...(state.sectionStyles[sectionId] ?? DEFAULT_SECTION_STYLE),
          ...updates,
        },
      },
    })),

  setTextStyle: (sectionId, updates) =>
    set((state) => {
      const current = state.sectionStyles[sectionId] ?? DEFAULT_SECTION_STYLE;
      return {
        sectionStyles: {
          ...state.sectionStyles,
          [sectionId]: {
            ...current,
            textStyle: { ...current.textStyle, ...updates },
          },
        },
      };
    }),

  setWorksheetPageStyle: (updates) =>
    set((state) => ({
      worksheetPageStyle: { ...state.worksheetPageStyle, ...updates },
    })),

  setGlobalTypography: (updates) =>
    set((state) => ({
      globalTypography: { ...state.globalTypography, ...updates },
    })),

  applyGlobalTypography: (typo) =>
    set((state) => {
      const merged: GlobalTypography = { ...state.globalTypography, ...typo };
      return {
        globalTypography: merged,
        worksheetPageStyle: {
          ...state.worksheetPageStyle,
          titleFont: merged.titleFont,
          bodyFont: merged.bodyFont,
          bgColor: state.worksheetPageStyle.bgColor,
        },
      };
    }),

  addClipart: (sectionId, item) =>
    set((state) => ({
      sectionClipart: {
        ...state.sectionClipart,
        [sectionId]: [
          ...(state.sectionClipart[sectionId] ?? []),
          { ...item, id: nanoid(6) },
        ],
      },
    })),

  removeClipart: (sectionId, itemId) =>
    set((state) => ({
      sectionClipart: {
        ...state.sectionClipart,
        [sectionId]: (state.sectionClipart[sectionId] ?? []).filter(
          (c) => c.id !== itemId
        ),
      },
    })),

  layoutVariations: null,
  setLayoutVariations: (layoutVariations) => set({ layoutVariations }),

  // Activity type selection
  activitySuggestions: null,
  chosenActivityType: null,
  customizeOptions: {
    title: "",
    gradeLevel: "General",
    orientation: "portrait",
    includeName: true,
    includeDate: true,
    fontStyle: "clean",
    borderStyle: "none",
    colorScheme: "black & white",
    teacherInfo: "",
  },
  parsedPromptData: null,
  originalPrompt: "",
  setActivitySuggestions: (activitySuggestions) => set({ activitySuggestions }),
  setChosenActivityType: (chosenActivityType) => set({ chosenActivityType }),
  setCustomizeOptions: (opts) =>
    set((state) => ({ customizeOptions: { ...state.customizeOptions, ...opts } })),
  setParsedPromptData: (parsedPromptData) => set({ parsedPromptData }),
  setOriginalPrompt: (originalPrompt) => set({ originalPrompt }),

  quickGen: null,
  setQuickGen: (params) =>
    set((state) => ({
      quickGen: state.quickGen ? { ...state.quickGen, ...params } : (params as NonNullable<BloomStore["quickGen"]>),
    })),

  reset: () =>
    set({
      lessonText: "",
      language: "auto",
      blocks: [],
      detectedLanguage: "English",
      safetyPassed: true,
      safetyFlags: [],
      settings: DEFAULT_SETTINGS,
      worksheet: null,
      activeSectionId: null,
      sectionStyles: {},
      sectionClipart: {},
      worksheetPageStyle: DEFAULT_PAGE_STYLE,
      globalTypography: DEFAULT_TYPOGRAPHY,
      layoutVariations: null,
      activitySuggestions: null,
      chosenActivityType: null,
      customizeOptions: {
        title: "",
        gradeLevel: "General",
        orientation: "portrait",
        includeName: true,
        includeDate: true,
        fontStyle: "clean",
        borderStyle: "none",
        colorScheme: "black & white",
        teacherInfo: "",
      },
      parsedPromptData: null,
      originalPrompt: "",
      quickGen: null,
    }),
}));

export const useWorksheetStore = useBloomStore;
