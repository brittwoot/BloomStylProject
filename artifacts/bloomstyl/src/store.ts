import { create } from "zustand";

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

  // Step 4 — Worksheet
  worksheet: any;
  setWorksheet: (w: any) => void;
  updateSection: (id: string, updates: Partial<any>) => void;
  updateQuestion: (sectionId: string, qId: string, updates: Partial<any>) => void;

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

export const useBloomStore = create<BloomStore>((set) => ({
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
    }),
}));

// Keep old export for backward compat
export const useWorksheetStore = useBloomStore;
