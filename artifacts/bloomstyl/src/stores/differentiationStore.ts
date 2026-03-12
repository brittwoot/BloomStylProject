import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  DifferentiatedSet,
  WorksheetVersion,
  ScaffoldSettings,
  GlobalDiffSettings,
  DiffTemplate,
  LevelType,
} from "../types/differentiationTypes";
import {
  DEFAULT_SCAFFOLD_SETTINGS,
  DEFAULT_GLOBAL_DIFF_SETTINGS,
  BUILT_IN_DIFF_TEMPLATES,
} from "../types/differentiationTypes";

type PendingLevel = {
  label: string;
  color: string;
  scaffoldOverrides?: Partial<ScaffoldSettings>;
};

type DifferentiationStore = {
  activeSet: DifferentiatedSet | null;
  savedTemplates: DiffTemplate[];
  editingVersionId: string | null;
  pendingLevels: PendingLevel[] | null;

  createSet: (name: string, anchorContent: any) => void;
  clearSet: () => void;

  setPendingLevels: (levels: PendingLevel[]) => void;
  clearPendingLevels: () => void;
  materializePendingSet: (name: string, anchorContent: any) => void;

  addVersion: (label: string, color: string, scaffoldOverrides?: Partial<ScaffoldSettings>) => void;
  removeVersion: (versionId: string) => void;
  duplicateVersion: (versionId: string) => void;
  setAnchor: (versionId: string) => void;

  updateVersionContent: (versionId: string, content: any, changeSummary: string[]) => void;
  updateVersionStatus: (versionId: string, status: WorksheetVersion["status"], error?: string) => void;
  updateScaffoldSettings: (versionId: string, settings: Partial<ScaffoldSettings>) => void;
  updateGlobalSettings: (settings: Partial<GlobalDiffSettings>) => void;

  markSyncAvailable: (versionId: string) => void;
  clearSyncFlag: (versionId: string) => void;
  markManuallyOverridden: (versionId: string) => void;

  setEditingVersion: (versionId: string | null) => void;

  saveTemplate: (name: string) => void;
  deleteTemplate: (templateId: string) => void;
  applyTemplate: (template: DiffTemplate, anchorContent: any) => void;

  getAnchorVersion: () => WorksheetVersion | undefined;
  getVersion: (versionId: string) => WorksheetVersion | undefined;
};

export const useDifferentiationStore = create<DifferentiationStore>((set, get) => ({
  activeSet: null,
  savedTemplates: [],
  editingVersionId: null,
  pendingLevels: null,

  setPendingLevels: (levels) => set({ pendingLevels: levels }),
  clearPendingLevels: () => set({ pendingLevels: null }),

  materializePendingSet: (name, anchorContent) => {
    const state = get();
    const levels = state.pendingLevels;
    if (!levels || levels.length === 0) return;

    const anchorId = nanoid(8);
    const anchorVersion: WorksheetVersion = {
      id: anchorId,
      label: "Anchor (Original)",
      color: "#10b981",
      isAnchor: true,
      scaffoldSettings: { ...DEFAULT_SCAFFOLD_SETTINGS },
      content: anchorContent,
      changeSummary: anchorContent ? ["Original worksheet — no modifications"] : [],
      status: anchorContent ? "complete" as const : "idle" as const,
      manuallyOverridden: false,
      syncAvailable: false,
    };

    const derivedVersions: WorksheetVersion[] = levels.map((level) => ({
      id: nanoid(8),
      label: level.label,
      color: level.color,
      isAnchor: false,
      scaffoldSettings: { ...DEFAULT_SCAFFOLD_SETTINGS, ...level.scaffoldOverrides },
      content: null,
      changeSummary: [],
      status: "idle" as const,
      manuallyOverridden: false,
      syncAvailable: false,
    }));

    set({
      activeSet: {
        id: nanoid(8),
        name,
        anchorId,
        versions: [anchorVersion, ...derivedVersions],
        globalSettings: { ...DEFAULT_GLOBAL_DIFF_SETTINGS },
        createdAt: Date.now(),
      },
      pendingLevels: null,
      editingVersionId: null,
    });
  },

  createSet: (name, anchorContent) => {
    const anchorId = nanoid(8);
    set({
      activeSet: {
        id: nanoid(8),
        name,
        anchorId,
        versions: [
          {
            id: anchorId,
            label: "Anchor (Original)",
            color: "#10b981",
            isAnchor: true,
            scaffoldSettings: { ...DEFAULT_SCAFFOLD_SETTINGS },
            content: anchorContent,
            changeSummary: anchorContent ? ["Original worksheet — no modifications"] : [],
            status: anchorContent ? "complete" as const : "idle" as const,
            manuallyOverridden: false,
            syncAvailable: false,
          },
        ],
        globalSettings: { ...DEFAULT_GLOBAL_DIFF_SETTINGS },
        createdAt: Date.now(),
      },
      editingVersionId: null,
    });
  },

  clearSet: () => set({ activeSet: null, editingVersionId: null }),

  addVersion: (label, color, scaffoldOverrides) => {
    const state = get();
    if (!state.activeSet) return;
    if (state.activeSet.versions.length >= 5) return;

    const newVersion: WorksheetVersion = {
      id: nanoid(8),
      label,
      color,
      isAnchor: false,
      scaffoldSettings: { ...DEFAULT_SCAFFOLD_SETTINGS, ...scaffoldOverrides },
      content: null,
      changeSummary: [],
      status: "idle",
      manuallyOverridden: false,
      syncAvailable: false,
    };

    set({
      activeSet: {
        ...state.activeSet,
        versions: [...state.activeSet.versions, newVersion],
      },
    });
  },

  removeVersion: (versionId) => {
    const state = get();
    if (!state.activeSet) return;
    const version = state.activeSet.versions.find((v) => v.id === versionId);
    if (!version || version.isAnchor) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.filter((v) => v.id !== versionId),
      },
    });
  },

  duplicateVersion: (versionId) => {
    const state = get();
    if (!state.activeSet) return;
    if (state.activeSet.versions.length >= 5) return;
    const version = state.activeSet.versions.find((v) => v.id === versionId);
    if (!version) return;

    const dup: WorksheetVersion = {
      ...version,
      id: nanoid(8),
      label: `${version.label} (Copy)`,
      isAnchor: false,
      status: version.content ? "complete" : "idle",
    };

    set({
      activeSet: {
        ...state.activeSet,
        versions: [...state.activeSet.versions, dup],
      },
    });
  },

  setAnchor: (versionId) => {
    const state = get();
    if (!state.activeSet) return;
    const version = state.activeSet.versions.find((v) => v.id === versionId);
    if (!version || !version.content) return;

    set({
      activeSet: {
        ...state.activeSet,
        anchorId: versionId,
        versions: state.activeSet.versions.map((v) => ({
          ...v,
          isAnchor: v.id === versionId,
          syncAvailable: v.id !== versionId && v.status === "complete" && !v.manuallyOverridden
            ? true
            : v.syncAvailable,
        })),
      },
    });
  },

  updateVersionContent: (versionId, content, changeSummary) => {
    const state = get();
    if (!state.activeSet) return;

    const isAnchor = state.activeSet.anchorId === versionId;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) => {
          if (v.id === versionId) {
            return {
              ...v,
              content,
              changeSummary,
              status: "complete" as const,
              manuallyOverridden: false,
              syncAvailable: false,
            };
          }
          if (isAnchor && !v.isAnchor && v.status === "complete" && !v.manuallyOverridden) {
            return { ...v, syncAvailable: true };
          }
          return v;
        }),
      },
    });
  },

  updateVersionStatus: (versionId, status, error) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) =>
          v.id === versionId ? { ...v, status, error } : v
        ),
      },
    });
  },

  updateScaffoldSettings: (versionId, settings) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) =>
          v.id === versionId
            ? {
                ...v,
                scaffoldSettings: { ...v.scaffoldSettings, ...settings },
                status: v.status === "complete" && !v.isAnchor ? "idle" as const : v.status,
              }
            : v
        ),
      },
    });
  },

  updateGlobalSettings: (settings) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        globalSettings: { ...state.activeSet.globalSettings, ...settings },
      },
    });
  },

  markSyncAvailable: (versionId) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) =>
          v.id === versionId && !v.isAnchor && !v.manuallyOverridden
            ? { ...v, syncAvailable: true }
            : v
        ),
      },
    });
  },

  clearSyncFlag: (versionId) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) =>
          v.id === versionId ? { ...v, syncAvailable: false } : v
        ),
      },
    });
  },

  markManuallyOverridden: (versionId) => {
    const state = get();
    if (!state.activeSet) return;

    set({
      activeSet: {
        ...state.activeSet,
        versions: state.activeSet.versions.map((v) =>
          v.id === versionId
            ? { ...v, manuallyOverridden: true, syncAvailable: false }
            : v
        ),
      },
    });
  },

  setEditingVersion: (editingVersionId) => set({ editingVersionId }),

  saveTemplate: (name) => {
    const state = get();
    if (!state.activeSet) return;

    const template: DiffTemplate = {
      id: nanoid(8),
      name,
      builtIn: false,
      levelType: "readiness",
      levels: state.activeSet.versions.map((v) => ({
        label: v.label,
        color: v.color,
        scaffoldOverrides: { ...v.scaffoldSettings },
      })),
    };

    set({ savedTemplates: [...state.savedTemplates, template] });
  },

  deleteTemplate: (templateId) => {
    set((state) => ({
      savedTemplates: state.savedTemplates.filter((t) => t.id !== templateId),
    }));
  },

  applyTemplate: (template, anchorContent) => {
    const anchorId = nanoid(8);
    const versions: WorksheetVersion[] = template.levels.map((level, i) => ({
      id: i === 0 ? anchorId : nanoid(8),
      label: level.label,
      color: level.color,
      isAnchor: i === 0,
      scaffoldSettings: { ...DEFAULT_SCAFFOLD_SETTINGS, ...level.scaffoldOverrides },
      content: i === 0 ? anchorContent : null,
      changeSummary: i === 0 ? ["Original worksheet — anchor version"] : [],
      status: i === 0 && anchorContent ? "complete" as const : "idle" as const,
      manuallyOverridden: false,
      syncAvailable: false,
    }));

    set({
      activeSet: {
        id: nanoid(8),
        name: template.name,
        anchorId,
        versions,
        globalSettings: { ...DEFAULT_GLOBAL_DIFF_SETTINGS },
        createdAt: Date.now(),
      },
      editingVersionId: null,
    });
  },

  getAnchorVersion: () => {
    const state = get();
    if (!state.activeSet) return undefined;
    return state.activeSet.versions.find((v) => v.isAnchor);
  },

  getVersion: (versionId) => {
    const state = get();
    if (!state.activeSet) return undefined;
    return state.activeSet.versions.find((v) => v.id === versionId);
  },
}));
