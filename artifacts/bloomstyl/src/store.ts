import { create } from "zustand";
import { nanoid } from "nanoid";

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
  setActiveSection: (id: string | null) => void;
  setSectionStyle: (sectionId: string, updates: Partial<SectionStyle>) => void;
  setTextStyle: (sectionId: string, updates: Partial<TextStyle>) => void;
  setWorksheetPageStyle: (updates: Partial<WorksheetPageStyle>) => void;
  addClipart: (sectionId: string, item: Omit<ClipartItem, "id">) => void;
  removeClipart: (sectionId: string, itemId: string) => void;
  getSectionStyle: (sectionId: string) => SectionStyle;

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
    }),
}));

export const useWorksheetStore = useBloomStore;
