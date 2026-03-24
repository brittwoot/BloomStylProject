import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  RefreshCw,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  useBloomStore,
  type QuickGenLayoutState,
  type QuickGenContentAnalysis,
} from "../store";
import {
  defaultThreeOptionPlan,
  getFamiliesForSubject,
  getDefaultFamilyId,
  resolveFamilyIdForSubject,
  type SubjectId as QGSubjectId,
} from "../lib/quickGenFamilies";
import {
  saveQuickGenReturnPath,
  setQuickGenSessionId,
} from "../lib/quickGenNavigation";
import {
  normalizeDisplayText,
  normalizeDisplayTopic,
  normalizeTitle,
} from "../lib/normalizeTitle";
import {
  QuickGenOptionMiniPreview,
  resolveQuickGenPreviewKind,
} from "../components/quickGen/QuickGenOptionPreview";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Subjects (12) ─────────────────────────────────────────────────────────────

type SubjectId =
  | "reading"
  | "writing"
  | "math"
  | "science"
  | "social"
  | "phonics"
  | "art"
  | "sel"
  | "ell"
  | "holiday"
  | "general"
  | "custom";

const SUBJECTS: {
  id: SubjectId;
  label: string;
  icon: string;
  color: string;
  placeholder: string;
}[] = [
  {
    id: "reading",
    label: "Reading",
    icon: "📖",
    color: "#3b82f6",
    placeholder: "e.g. Main idea, Charlotte's Web, nonfiction text features...",
  },
  {
    id: "writing",
    label: "Writing",
    icon: "✏️",
    color: "#8b5cf6",
    placeholder:
      "e.g. Narrative writing, opinion paragraph, descriptive essay...",
  },
  {
    id: "math",
    label: "Math",
    icon: "🔢",
    color: "#f59e0b",
    placeholder: "e.g. Adding fractions, place value to 1000, word problems...",
  },
  {
    id: "science",
    label: "Science",
    icon: "🔬",
    color: "#10b981",
    placeholder: "e.g. Water cycle, animal adaptations, states of matter...",
  },
  {
    id: "social",
    label: "Social Studies",
    icon: "🌍",
    color: "#ef4444",
    placeholder:
      "e.g. Community helpers, the American Revolution, map skills...",
  },
  {
    id: "phonics",
    label: "Phonics",
    icon: "🔤",
    color: "#06b6d4",
    placeholder: "e.g. Long vowel sounds, digraphs sh/ch/th, CVC words...",
  },
  {
    id: "art",
    label: "Art",
    icon: "🎨",
    color: "#ec4899",
    placeholder: "e.g. Color theory, famous artists, elements of art...",
  },
  {
    id: "sel",
    label: "SEL",
    icon: "💬",
    color: "#f97316",
    placeholder:
      "e.g. Managing emotions, growth mindset, conflict resolution...",
  },
  {
    id: "ell",
    label: "ELL / ESL",
    icon: "🌐",
    color: "#84cc16",
    placeholder:
      "e.g. Vocabulary building, sentence frames, basic conversation...",
  },
  {
    id: "holiday",
    label: "Holiday",
    icon: "🎉",
    color: "#f43f5e",
    placeholder:
      "e.g. Halloween, Thanksgiving, end of year, Valentine's Day...",
  },
  {
    id: "general",
    label: "General",
    icon: "📋",
    color: "#6b7280",
    placeholder: "e.g. Study skills, research project, classroom activity...",
  },
  {
    id: "custom",
    label: "Custom",
    icon: "⚡",
    color: "#7c3aed",
    placeholder: "Describe exactly what you need...",
  },
];

const GRADES = ["Pre-K", "K", "1", "2", "3", "4", "5", "6", "7", "8"];

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "input" | "generating" | "done";
type Layout = QuickGenLayoutState;

const DEFAULT_LAYOUTS: Layout[] = [
  { id: "A", status: "pending", data: null, error: null },
  { id: "B", status: "pending", data: null, error: null },
  { id: "C", status: "pending", data: null, error: null },
];

type Customization = {
  colorTheme: string;
  fontStyle: string;
  border: string;
  nameLine: boolean;
  dateLine: boolean;
  grade: string;
  answerSpace: string;
  wordBank: boolean;
  directions: boolean;
};

function snapshotQuickGenFromStore(): {
  sessionId: string;
  phase: Phase;
  layouts: Layout[];
  selectedLayout: "A" | "B" | "C";
  subject: SubjectId | "";
  topic: string;
  grade: string;
  familyId: string;
  pastedContent: string;
  contentAnalysis: QuickGenContentAnalysis | null;
  activityTypeId: string;
  activityTypeLabel: string;
  custom: Customization;
} | null {
  const s = useBloomStore.getState().quickGenSession;
  if (!s) return null;
  const hasResults = s.layouts.some(
    (l) => l.status === "done" || l.status === "error",
  );
  const phase: Phase =
    s.phase === "generating"
      ? "done"
      : hasResults && s.phase === "input"
        ? "done"
        : (s.phase as Phase);
  return {
    sessionId: s.sessionId,
    phase,
    layouts: s.layouts as Layout[],
    selectedLayout: s.selectedLayout,
    subject: s.subject as SubjectId | "",
    topic: s.topic,
    grade: s.grade,
    familyId: s.familyId || "",
    pastedContent: s.pastedContent ?? "",
    contentAnalysis: s.contentAnalysis ?? null,
    activityTypeId: s.activityTypeId,
    activityTypeLabel: s.activityTypeLabel,
    custom: s.custom as Customization,
  };
}

// ── safeParseJSON ──────────────────────────────────────────────────────────────

function safeParseJSON(str: string): any | null {
  try {
    return JSON.parse(
      str
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/, "")
        .trim(),
    );
  } catch {
    return null;
  }
}

// ── Shimmer button ─────────────────────────────────────────────────────────────

function GenerateButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full rounded-xl px-6 py-4 text-base font-bold text-white overflow-hidden transition-all
        ${disabled ? "bg-primary/40 cursor-not-allowed" : "bg-primary hover:opacity-95 active:scale-[0.99]"}
        shadow-lg shadow-primary/20`}
    >
      {loading && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            animation: "shimmerSlide 1.4s infinite linear",
          }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5" />
        {loading ? "Creating..." : "Create Worksheet ✦"}
      </span>
    </button>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard({
  delay,
  slotId,
  planEntry,
}: {
  delay: number;
  slotId: "A" | "B" | "C";
  planEntry?: { activityType: string; familyLabel: string };
}) {
  const previewKind = resolveQuickGenPreviewKind(
    undefined,
    planEntry?.activityType,
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="rounded-xl border-2 border-dashed border-primary/25 bg-white p-4 space-y-2 will-change-transform text-left"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Option {slotId}
        </span>
        {planEntry && (
          <span
            className="text-[9px] font-mono text-primary/90 truncate max-w-[130px]"
            title={planEntry.activityType}
          >
            {normalizeDisplayTopic(planEntry.activityType.replace(/_/g, " "))}
          </span>
        )}
      </div>
      {planEntry && (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
          {normalizeDisplayTopic(planEntry.familyLabel)}
        </p>
      )}
      <div className="relative opacity-90">
        <QuickGenOptionMiniPreview
          kind={previewKind}
          activityType={planEntry?.activityType}
        />
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
      </div>
      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      <div className="space-y-1.5 pt-1">
        {[80, 95, 65].map((w, i) => (
          <div
            key={i}
            className="h-2 bg-muted rounded animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Layout result card ─────────────────────────────────────────────────────────

function layoutPreviewAccent(layoutType: string | undefined): string {
  const lt = layoutType === "sequence_sort" ? "sequence_organizer" : layoutType;
  switch (lt) {
    case "diagram_label":
      return "border-l-[5px] border-l-teal-600 bg-gradient-to-br from-teal-50/80 to-white";
    case "concept_practice":
      return "border-l-[5px] border-l-violet-600 bg-gradient-to-br from-violet-50/70 to-white";
    case "sequence_organizer":
      return "border-l-[5px] border-l-amber-600 bg-gradient-to-br from-amber-50/70 to-white";
    case "matching":
      return "border-l-[5px] border-l-sky-600 bg-gradient-to-br from-sky-50/75 to-white";
    case "word_problems":
      return "border-l-[5px] border-l-orange-600 bg-gradient-to-br from-orange-50/70 to-white";
    case "data_representation":
      return "border-l-[5px] border-l-emerald-600 bg-gradient-to-br from-emerald-50/70 to-white";
    case "comprehension":
      return "border-l-[5px] border-l-blue-600 bg-gradient-to-br from-blue-50/70 to-white";
    case "vocabulary_review":
      return "border-l-[5px] border-l-indigo-600 bg-gradient-to-br from-indigo-50/70 to-white";
    case "default":
      return "border-l-[5px] border-l-muted-foreground/50 bg-gradient-to-br from-muted/30 to-white";
    default:
      return "";
  }
}

/** Prefer planner activityType so e.g. math_practice is not styled like science concept_practice when both use layout concept_practice. */
function layoutCardAccent(
  layoutType: string | undefined,
  activityType: string | undefined,
): string {
  const act = activityType?.trim();
  if (act === "math_practice") {
    return "border-l-[5px] border-l-orange-600 bg-gradient-to-br from-orange-50/75 to-white";
  }
  if (act === "math_word_problems" || act === "measurement") {
    return "border-l-[5px] border-l-amber-700 bg-gradient-to-br from-amber-50/70 to-white";
  }
  if (act === "number_bond" || act === "ten_frame") {
    return "border-l-[5px] border-l-violet-700 bg-gradient-to-br from-violet-50/80 to-white";
  }
  if (act === "graph_page") {
    return "border-l-[5px] border-l-emerald-600 bg-gradient-to-br from-emerald-50/70 to-white";
  }
  if (act === "science_concept_practice") {
    return "border-l-[5px] border-l-violet-600 bg-gradient-to-br from-violet-50/70 to-white";
  }
  return layoutPreviewAccent(layoutType);
}

function LayoutCard({
  layout,
  label,
  selected,
  onSelect,
}: {
  layout: Layout;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ws = layout.data?.worksheet ?? layout.data;
  const meta = layout.meta;
  const om = layout.data?.optionMetadata;
  const lt = meta?.layoutType || om?.layoutType;

  if (layout.status === "error") {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
        <p className="text-xs font-bold text-red-600 mb-1">{label} failed</p>
        <p className="text-xs text-red-500 mb-3 line-clamp-2">{layout.error}</p>
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all will-change-transform ${layoutCardAccent(lt, layout.resolvedActivityType)}
        ${
          selected
            ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/12 scale-[1.02]"
            : "border-border hover:border-primary/40 hover:shadow-md"
        }`}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {selected && (
          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {(meta?.title || om?.title || layout.resolvedActivityType) && (
        <h3 className="text-sm font-bold text-foreground leading-tight mb-1">
          {normalizeDisplayTopic(
            String(
              meta?.title ||
                om?.title ||
                layout.resolvedActivityType?.replace(/_/g, " ") ||
                "",
            ),
          )}
        </h3>
      )}

      <QuickGenOptionMiniPreview
        kind={resolveQuickGenPreviewKind(lt, layout.resolvedActivityType)}
        activityType={layout.resolvedActivityType}
        layoutType={lt}
        className="my-2"
      />

      {(meta?.shortDescription || om?.shortDescription) && (
        <p className="text-[12px] text-foreground leading-snug mb-3">
          {normalizeDisplayText(
            String(meta?.shortDescription || om?.shortDescription || ""),
          )}
        </p>
      )}

      {((meta?.includedComponents?.length ?? 0) > 0 ||
        (om?.includedComponents?.length ?? 0) > 0) && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Includes
          </p>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4 marker:text-primary/70">
            {(meta?.includedComponents || om?.includedComponents || []).map(
              (line: string, i: number) => (
                <li key={i}>{normalizeDisplayTopic(line)}</li>
              ),
            )}
          </ul>
        </div>
      )}

      {(meta?.skillFocus || om?.skillFocus) && (
        <p className="text-[11px] leading-snug">
          <span className="font-bold text-foreground">Skill focus: </span>
          <span className="text-muted-foreground">
            {meta?.skillFocus || om?.skillFocus}
          </span>
        </p>
      )}

      {selected && layout.status === "done" && (
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
          Open in Editor <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </motion.button>
  );
}

// ── Customization panel ────────────────────────────────────────────────────────

const COLOR_OPTS = [
  { id: "black & white", label: "B&W", dot: "#1a1a2e" },
  { id: "soft blue", label: "Blue", dot: "#3b82f6" },
  { id: "warm yellow", label: "Yellow", dot: "#f59e0b" },
  { id: "soft green", label: "Green", dot: "#10b981" },
  { id: "soft purple", label: "Purple", dot: "#7c3aed" },
  { id: "light pastel", label: "Pastel", dot: "#ec4899" },
];
const FONT_OPTS = ["Playful", "Clean", "Handwritten", "Bold"];
const BORDER_OPTS = ["None", "Simple", "Decorative", "Heavy"];

function CustomizationPanel({
  value,
  onChange,
}: {
  value: Customization;
  onChange: (k: keyof Customization, v: any) => void;
}) {
  const [contentOpen, setContentOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden text-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Customize
        </p>
      </div>

      <div className="divide-y divide-border">
        {/* Section 1 — LOOK (always open) */}
        <div className="p-4 space-y-4">
          <p className="text-xs font-bold text-foreground">Look</p>

          {/* Font */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Font Style
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_OPTS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChange("fontStyle", f.toLowerCase())}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    value.fontStyle === f.toLowerCase()
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {f === "Playful"
                    ? "Aa Playful"
                    : f === "Clean"
                      ? "Aa Clean"
                      : f === "Handwritten"
                        ? "Aa Script"
                        : "Aa Bold"}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Color Theme
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => onChange("colorTheme", c.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    value.colorTheme === c.id
                      ? "border-primary scale-110"
                      : "border-transparent hover:border-border"
                  }`}
                  style={{ backgroundColor: c.dot }}
                />
              ))}
            </div>
          </div>

          {/* Border */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Border</p>
            <div className="flex gap-1.5">
              {BORDER_OPTS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChange("border", b.toLowerCase())}
                  className={`flex-1 rounded-lg border py-1.5 text-[10px] font-semibold transition-all ${
                    value.border === b.toLowerCase()
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Date lines */}
          <div className="space-y-2">
            {(["nameLine", "dateLine"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-foreground">
                  {key === "nameLine" ? "Name line" : "Date line"}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(key, !value[key])}
                  className={`w-9 h-5 rounded-full transition-colors relative ${value[key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value[key] ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — CONTENT */}
        <div>
          <button
            type="button"
            onClick={() => setContentOpen(!contentOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/20 transition-colors"
          >
            Content
            <span
              className={`transition-transform duration-150 ${contentOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          <AnimatePresence>
            {contentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      Answer Space
                    </p>
                    <div className="flex gap-1.5">
                      {["Compact", "Standard", "Spacious"].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() =>
                            onChange("answerSpace", a.toLowerCase())
                          }
                          className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-all ${
                            value.answerSpace === a.toLowerCase()
                              ? "border-primary bg-primary/8 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(["wordBank", "directions"] as const).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-foreground">
                        {key === "wordBank" ? "Word bank" : "Directions"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChange(key, !value[key])}
                        className={`w-9 h-5 rounded-full transition-colors relative ${value[key] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value[key] ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 3 — FORMAT */}
        <div>
          <button
            type="button"
            onClick={() => setFormatOpen(!formatOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/20 transition-colors"
          >
            Format
            <span
              className={`transition-transform duration-150 ${formatOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          <AnimatePresence>
            {formatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      Orientation
                    </p>
                    <div className="flex gap-2">
                      {["Portrait", "Landscape"].map((o) => (
                        <button
                          key={o}
                          type="button"
                          className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 transition-colors"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickGenPage() {
  const [, setLocation] = useLocation();
  const setWorksheet = useBloomStore((s) => s.setWorksheet);
  const setQuickGenSession = useBloomStore((s) => s.setQuickGenSession);
  const patchQuickGenSession = useBloomStore((s) => s.patchQuickGenSession);
  const setEditorReturnToQuickGen = useBloomStore(
    (s) => s.setEditorReturnToQuickGen,
  );

  const snap = snapshotQuickGenFromStore();

  // ── Form state (lazy init from persisted Quick Gen session so /result → /prompt shows results, not subject picker) ──
  const [subject, setSubject] = useState<SubjectId | "">(
    () => snap?.subject ?? "",
  );
  const [topic, setTopic] = useState(() => snap?.topic ?? "");
  const [grade, setGrade] = useState(() => snap?.grade ?? "");
  const [activityTypeId, setActivityTypeId] = useState(
    () => snap?.activityTypeId ?? "",
  );
  const [activityTypeLabel, setActivityTypeLabel] = useState(
    () => snap?.activityTypeLabel ?? "",
  );
  const [familyId, setFamilyId] = useState(() => {
    if (snap?.familyId) return snap.familyId;
    if (snap?.subject) return getDefaultFamilyId(snap.subject as QGSubjectId);
    return "";
  });
  const [pastedContent, setPastedContent] = useState(
    () => snap?.pastedContent ?? "",
  );
  const [contentAnalysis, setContentAnalysis] =
    useState<QuickGenContentAnalysis | null>(
      () => snap?.contentAnalysis ?? null,
    );
  const [analyzing, setAnalyzing] = useState(false);

  // ── Generation state ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>(() => snap?.phase ?? "input");
  const [layouts, setLayouts] = useState<Layout[]>(
    () => snap?.layouts ?? DEFAULT_LAYOUTS,
  );
  const [selectedLayout, setSelectedLayout] = useState<"A" | "B" | "C">(
    () => snap?.selectedLayout ?? "A",
  );
  const [error, setError] = useState("");
  const [rehydrated, setRehydrated] = useState(false);
  const sessionIdRef = useRef<string | null>(snap?.sessionId ?? null);

  // ── Customization state ────────────────────────────────────────────────────
  const [custom, setCustom] = useState<Customization>(
    () =>
      snap?.custom ?? {
        colorTheme: "black & white",
        fontStyle: "clean",
        border: "none",
        nameLine: true,
        dateLine: true,
        grade: "3",
        answerSpace: "standard",
        wordBank: false,
        directions: true,
      },
  );

  const topicRef = useRef<HTMLInputElement>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});
  const genKey = useRef(0);
  /** Set in startGeneration so each parallel fetch uses the same resolved A/B/C triple (distinct activity types). */
  const generationTripleRef = useRef<ReturnType<
    typeof defaultThreeOptionPlan
  > | null>(null);

  const subjectObj = SUBJECTS.find((s) => s.id === subject);
  const families = subject ? getFamiliesForSubject(subject as QGSubjectId) : [];
  const selectedFamily = families.find((f) => f.familyId === familyId);
  const canGenerate =
    subject !== "" &&
    topic.trim().length >= 3 &&
    (familyId !== "" || families.length === 0);

  // Same resolved A/B/C as the generate API (distinct activity types + fallback).
  const resolvedPlannerFamily =
    familyId || (subject ? getDefaultFamilyId(subject as QGSubjectId) : "");
  const plannerThreeOption = useMemo(() => {
    if (!subject || !resolvedPlannerFamily) return null;
    return defaultThreeOptionPlan(
      subject as QGSubjectId,
      resolvedPlannerFamily,
      topic.trim(),
      grade || "General",
    );
  }, [subject, resolvedPlannerFamily, topic, grade]);

  /** Prefer analyze-quick-gen topic when present; display-only (does not change stored topic). */
  const topicDisplaySource = useMemo(() => {
    const detected = contentAnalysis?.detectedTopic?.trim();
    if (detected && detected.length >= 2) return detected;
    return topic.trim();
  }, [topic, contentAnalysis?.detectedTopic]);

  const topicLabelDisplay = useMemo(
    () => normalizeDisplayTopic(topicDisplaySource),
    [topicDisplaySource],
  );

  // Auto-focus topic when subject selected
  useEffect(() => {
    if (subject && topicRef.current) {
      setTimeout(() => topicRef.current?.focus(), 200);
    }
  }, [subject]);

  // Restore Quick Gen session (e.g. return from /result)
  useEffect(() => {
    const s = useBloomStore.getState().quickGenSession;
    if (s) {
      sessionIdRef.current = s.sessionId;
      setQuickGenSessionId(s.sessionId);
      setSubject(s.subject as SubjectId);
      setTopic(s.topic);
      setGrade(s.grade);
      setFamilyId(s.familyId || getDefaultFamilyId(s.subject as QGSubjectId));
      setPastedContent(s.pastedContent ?? "");
      setContentAnalysis(s.contentAnalysis ?? null);
      setActivityTypeId(s.activityTypeId);
      setActivityTypeLabel(s.activityTypeLabel);
      setCustom(s.custom as Customization);
      setLayouts(s.layouts as Layout[]);
      setSelectedLayout(s.selectedLayout);
      if (s.phase === "generating") {
        setPhase("done");
      } else {
        setPhase(s.phase);
      }
    }
    setRehydrated(true);
  }, []);

  // Persist session whenever results / form change (survives editor navigation)
  useEffect(() => {
    if (!rehydrated) return;
    const hasResults = layouts.some(
      (l) => l.status === "done" || l.status === "error",
    );
    if (phase === "input" && !hasResults) return;

    if (!sessionIdRef.current) sessionIdRef.current = nanoid();
    setQuickGenSessionId(sessionIdRef.current);
    setQuickGenSession({
      sessionId: sessionIdRef.current!,
      subject,
      topic,
      grade,
      familyId: familyId || getDefaultFamilyId(subject as QGSubjectId),
      pastedContent,
      contentAnalysis,
      activityTypeId,
      activityTypeLabel,
      phase,
      layouts,
      selectedLayout,
      custom: custom as Record<string, unknown>,
      updatedAt: Date.now(),
    });
  }, [
    rehydrated,
    layouts,
    phase,
    selectedLayout,
    subject,
    topic,
    grade,
    familyId,
    pastedContent,
    contentAnalysis,
    activityTypeId,
    activityTypeLabel,
    custom,
    setQuickGenSession,
  ]);

  // ── Update layout ──────────────────────────────────────────────────────────
  const updateLayout = useCallback(
    (id: "A" | "B" | "C", updates: Partial<Layout>) => {
      setLayouts((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      );
    },
    [],
  );

  // ── Single layout fetch ────────────────────────────────────────────────────
  const fetchLayout = useCallback(
    async (id: "A" | "B" | "C", key: number) => {
      const controller = new AbortController();
      abortRefs.current[id] = controller;
      const timer = setTimeout(() => controller.abort(), 30000);

      updateLayout(id, {
        status: "loading",
        data: null,
        error: null,
        meta: null,
        resolvedActivityType: undefined,
      });
      const topicTrim = topic.trim();
      const resolvedFamily =
        familyId || getDefaultFamilyId(subject as QGSubjectId);
      const triple =
        generationTripleRef.current ??
        defaultThreeOptionPlan(
          subject as QGSubjectId,
          resolvedFamily,
          topicTrim,
          grade || "General",
        );
      const plan = triple[id];
      console.log(`Slot ${id}:`, plan.activityType);

      try {
        const res = await fetch(`${BASE}/api/worksheet/customize-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            activityType: plan.activityType,
            generationSlot: id,
            subjectId: subject,
            variantFamilyLabel: plan.familyLabel,
            originalPrompt: topicTrim,
            parsedPromptData: {
              topic: topicTrim,
              gradeLevel: grade || "General",
              skillFocus: subjectObj?.label ?? subject,
              targetWord:
                topicTrim.split(/\s+/).slice(0, 4).join(" ") || topicTrim,
              worksheetFamilyId: resolvedFamily,
            },
            options: {
              title: `${topicTrim} — ${plan.familyLabel}`,
              gradeLevel: grade || "General",
              includeName: custom.nameLine,
              includeDate: custom.dateLine,
              colorScheme: custom.colorTheme,
              fontStyle: custom.fontStyle,
              borderStyle: custom.border,
              diagramSubject: topicTrim,
              matchType:
                subject === "science"
                  ? "Science term → Definition"
                  : "Term → Definition",
              pairCount: 6,
            },
            subject: subjectObj?.label ?? subject,
            details: "",
          }),
        });

        clearTimeout(timer);
        if (controller.signal.aborted || genKey.current !== key) return;

        console.log(`[GEN] Layout ${id}: Response ${res.status}`);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Error ${res.status}`);
        }

        const text = await res.text();
        const data = JSON.parse(text) ?? safeParseJSON(text);
        if (!data) throw new Error("Invalid response");

        if (genKey.current !== key) return;
        console.log(`[GEN] Layout ${id}: Done ✓`);
        const om = data.optionMetadata;
        const ws = data.worksheet;
        if (ws && sessionIdRef.current) {
          ws.quickGenMeta = {
            ...(ws.quickGenMeta || {}),
            sessionId: sessionIdRef.current,
            layoutSlot: id,
            activityType: plan.activityType,
            layoutType: om?.layoutType ?? ws.quickGenMeta?.layoutType,
          };
        }
        updateLayout(id, {
          status: "done",
          data,
          resolvedActivityType: plan.activityType,
          meta: om
            ? {
                id: om.id,
                layoutType: om.layoutType,
                title: om.title,
                shortDescription: om.shortDescription,
                includedComponents: om.includedComponents,
                skillFocus: om.skillFocus,
                pedagogicalIntent: om.pedagogicalIntent,
              }
            : null,
        });
      } catch (err: any) {
        clearTimeout(timer);
        if (controller.signal.aborted || err?.name === "AbortError") {
          console.log(`[GEN] Layout ${id}: Aborted`);
          return;
        }
        if (genKey.current !== key) return;
        console.error(`[GEN] Layout ${id}: Error`, err);
        updateLayout(id, { status: "error", error: err?.message ?? "Failed" });
      }
    },
    [topic, grade, subject, subjectObj, familyId, custom, updateLayout],
  );

  // ── Start generation ───────────────────────────────────────────────────────
  const startGeneration = useCallback(() => {
    if (!canGenerate) return;

    const key = ++genKey.current;
    Object.values(abortRefs.current).forEach((c) => c.abort());
    abortRefs.current = {};

    console.log("[GEN] === Starting parallel generation ===");
    console.log(
      "[GEN] Subject:",
      subject,
      "| Topic:",
      topic,
      "| Grade:",
      grade,
    );
    const fam = familyId || getDefaultFamilyId(subject as QGSubjectId);
    const triple = defaultThreeOptionPlan(
      subject as QGSubjectId,
      fam,
      topic.trim(),
      grade || "General",
    );
    generationTripleRef.current = triple;
    console.log("[GEN] Planner A/B/C (distinct activity types):", triple);

    sessionIdRef.current = nanoid();
    setQuickGenSessionId(sessionIdRef.current);
    setLayouts([
      { id: "A", status: "pending", data: null, error: null },
      { id: "B", status: "pending", data: null, error: null },
      { id: "C", status: "pending", data: null, error: null },
    ]);
    setError("");
    setPhase("generating");

    // Fire all 3 in parallel
    fetchLayout("A", key);
    fetchLayout("B", key);
    fetchLayout("C", key);
  }, [canGenerate, subject, topic, grade, familyId, fetchLayout]);

  // Watch for all done → switch to done phase
  useEffect(() => {
    if (phase === "generating") {
      const allSettled = layouts.every(
        (l) => l.status === "done" || l.status === "error",
      );
      const anyDone = layouts.some((l) => l.status === "done");
      if (allSettled && anyDone) {
        setPhase("done");
      }
    }
  }, [layouts, phase]);

  // ── Handle card click ──────────────────────────────────────────────────────
  const handleCardClick = (id: "A" | "B" | "C") => {
    const layout = layouts.find((l) => l.id === id);
    if (layout?.status !== "done") return;

    if (selectedLayout === id && phase === "done") {
      // Second click: open editor
      const ws = layout.data?.worksheet ?? layout.data;
      if (ws) {
        if (sessionIdRef.current) {
          const om = layout.data?.optionMetadata;
          ws.quickGenMeta = {
            ...(ws.quickGenMeta || {}),
            sessionId: sessionIdRef.current,
            layoutSlot: id,
            activityType: layout.resolvedActivityType,
            layoutType:
              layout.meta?.layoutType ??
              om?.layoutType ??
              ws.quickGenMeta?.layoutType,
          };
        }
        setWorksheet(ws);
      }
      patchQuickGenSession({ selectedLayout: id });
      setEditorReturnToQuickGen(true);
      saveQuickGenReturnPath();
      const q = new URLSearchParams();
      if (sessionIdRef.current) q.set("sessionId", sessionIdRef.current);
      q.set("layoutId", id);
      setLocation(`${BASE}/result?${q.toString()}`);
      return;
    }
    setSelectedLayout(id);
  };

  // ── Handle customization change ────────────────────────────────────────────
  const handleCustomChange = (k: keyof Customization, v: any) => {
    setCustom((prev) => ({ ...prev, [k]: v }));
  };

  // ── Retry single layout ────────────────────────────────────────────────────
  const retryLayout = (id: "A" | "B" | "C") => {
    fetchLayout(id, genKey.current);
  };

  const allDone = layouts.every(
    (l) => l.status === "done" || l.status === "error",
  );
  const anyLoading = layouts.some(
    (l) => l.status === "loading" || l.status === "pending",
  );

  const runAnalyzeContent = useCallback(async () => {
    const t = pastedContent.trim();
    if (t.length < 20) {
      setError("Paste at least a short paragraph (20+ characters) to analyze.");
      return;
    }
    setError("");
    setAnalyzing(true);
    try {
      const res = await fetch(`${BASE}/api/worksheet/analyze-quick-gen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: t,
          subjectHint: subject || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Analysis failed");
      const data = await res.json();
      const analysis: QuickGenContentAnalysis = {
        detectedSubjectId: data.detectedSubjectId ?? null,
        detectedTopic: data.detectedTopic ?? null,
        gradeGuess: data.gradeGuess ?? null,
        confidenceSubject:
          typeof data.confidenceSubject === "number"
            ? data.confidenceSubject
            : 0,
        familySuggestions: Array.isArray(data.familySuggestions)
          ? data.familySuggestions
          : [],
        defaultFamilyId: data.defaultFamilyId ?? null,
      };
      setContentAnalysis(analysis);
      if (
        analysis.detectedSubjectId &&
        SUBJECTS.some((x) => x.id === analysis.detectedSubjectId)
      ) {
        setSubject(analysis.detectedSubjectId as SubjectId);
      }
      if (analysis.detectedTopic) setTopic(analysis.detectedTopic);
      if (analysis.gradeGuess) setGrade(analysis.gradeGuess);
      const subj = (
        analysis.detectedSubjectId &&
        SUBJECTS.some((x) => x.id === analysis.detectedSubjectId)
          ? analysis.detectedSubjectId
          : subject
      ) as QGSubjectId | "";
      if (subj && analysis.defaultFamilyId) {
        setFamilyId(resolveFamilyIdForSubject(subj, analysis.defaultFamilyId));
      }
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [pastedContent, subject]);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── FORM AREA ── */}
        <div
          className={`transition-all duration-300 ${phase !== "input" ? "mb-6" : "mb-0"}`}
        >
          {/* Compact summary bar shown during/after generation */}
          {phase !== "input" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6 px-4 py-2.5 bg-primary/5 border border-primary/15 rounded-xl"
            >
              <span className="text-lg">{subjectObj?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {topicLabelDisplay}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subjectObj?.label}
                  {grade ? ` · Grade ${grade}` : ""}
                  {selectedFamily
                    ? ` · ${normalizeTitle(selectedFamily.label)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase("input");
                  Object.values(abortRefs.current).forEach((c) => c.abort());
                }}
                className="text-xs font-semibold text-primary hover:text-primary/80 shrink-0"
              >
                ← Edit
              </button>
            </motion.div>
          )}

          {/* Full form — shown only in input phase */}
          <AnimatePresence>
            {phase === "input" && (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Worksheet Generator
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">
                    What subject?
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Pick a subject to get started.
                  </p>
                </div>

                {/* ── Subject grid (12 buttons, 3 col) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto">
                  {SUBJECTS.map((s) => {
                    const isSelected = subject === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSubject(s.id);
                          setActivityTypeId("");
                          setActivityTypeLabel("");
                          setFamilyId(getDefaultFamilyId(s.id as QGSubjectId));
                        }}
                        className="relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all will-change-transform"
                        style={{
                          borderColor: isSelected ? s.color : undefined,
                          backgroundColor: isSelected
                            ? `${s.color}14`
                            : undefined,
                          transform: isSelected ? "scale(1.03)" : "scale(1)",
                          transition:
                            "transform 80ms ease-out, background-color 80ms ease-out, border-color 80ms ease-out",
                        }}
                      >
                        <span className="text-xl shrink-0">{s.icon}</span>
                        <span
                          className={`text-sm font-bold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {s.label}
                        </span>
                        {isSelected && (
                          <span
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: s.color }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Step 2: Topic input (slides in when subject selected) ── */}
                <AnimatePresence>
                  {subject && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="max-w-2xl mx-auto space-y-5"
                    >
                      {/* Topic input */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                          What are you teaching?
                        </label>
                        <input
                          ref={topicRef}
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && canGenerate)
                              startGeneration();
                          }}
                          placeholder={
                            subjectObj?.placeholder ??
                            "e.g. topic or concept..."
                          }
                          className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base font-medium placeholder:text-muted-foreground/55 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Grade pills */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Grade Level{" "}
                          <span className="normal-case font-normal tracking-normal">
                            (optional)
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {GRADES.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGrade(grade === g ? "" : g)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                grade === g
                                  ? "bg-primary text-white border-primary"
                                  : "border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional: paste lesson text — suggests families before generating */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <FileText className="w-4 h-4 text-primary" />
                          Lesson text (optional)
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Paste standards, a reading passage, or notes. We will
                          suggest worksheet families—then pick one below and
                          generate three layouts.
                        </p>
                        <textarea
                          value={pastedContent}
                          onChange={(e) => setPastedContent(e.target.value)}
                          placeholder="Paste content here (20+ characters to analyze)..."
                          rows={4}
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-y min-h-[88px] focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={
                            analyzing || pastedContent.trim().length < 20
                          }
                          onClick={runAnalyzeContent}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary text-xs font-bold hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {analyzing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {analyzing
                            ? "Analyzing…"
                            : "Suggest families from content"}
                        </button>
                        {contentAnalysis &&
                          contentAnalysis.familySuggestions.length > 0 && (
                            <div className="pt-2 space-y-1.5 border-t border-border/60">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                Suggested from your text
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {contentAnalysis.familySuggestions.map(
                                  (sug, i) => (
                                    <button
                                      key={`${sug.familyId}-${i}`}
                                      type="button"
                                      onClick={() =>
                                        subject &&
                                        setFamilyId(
                                          resolveFamilyIdForSubject(
                                            subject as QGSubjectId,
                                            sug.familyId,
                                          ),
                                        )
                                      }
                                      className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] max-w-full ${
                                        familyId ===
                                        resolveFamilyIdForSubject(
                                          (subject || "general") as QGSubjectId,
                                          sug.familyId,
                                        )
                                          ? "border-primary bg-primary/8 text-primary"
                                          : "border-border hover:border-primary/40"
                                      }`}
                                    >
                                      <span className="font-semibold">
                                        {sug.label}
                                      </span>
                                      {sug.reason && (
                                        <span className="block text-muted-foreground font-normal mt-0.5 line-clamp-2">
                                          {sug.reason}
                                        </span>
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                              {typeof contentAnalysis.confidenceSubject ===
                                "number" && (
                                <p className="text-[10px] text-muted-foreground">
                                  Subject guess confidence:{" "}
                                  {Math.round(
                                    contentAnalysis.confidenceSubject * 100,
                                  )}
                                  %
                                </p>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Worksheet activity family — drives the 3 distinct layout types */}
                      {families.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Worksheet focus{" "}
                            <span className="normal-case font-normal tracking-normal">
                              (pick one)
                            </span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {families.map((f) => {
                              const selected = familyId === f.familyId;
                              return (
                                <button
                                  key={f.familyId}
                                  type="button"
                                  onClick={() => setFamilyId(f.familyId)}
                                  className={`text-left rounded-xl border-2 px-3 py-2.5 transition-all ${
                                    selected
                                      ? "border-primary bg-primary/8 shadow-sm"
                                      : "border-border bg-white hover:border-primary/35"
                                  }`}
                                >
                                  <p className="text-xs font-bold text-foreground">
                                    {f.label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {f.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Optional: override first generated option (custom / general) */}
                      {subject === "custom" && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Override option A type{" "}
                            <span className="normal-case font-normal tracking-normal">
                              (optional)
                            </span>
                          </p>
                          <input
                            type="text"
                            value={activityTypeId}
                            onChange={(e) => setActivityTypeId(e.target.value)}
                            placeholder="e.g. writing_prompt"
                            className="w-full rounded-lg border border-border px-3 py-2 text-xs font-mono"
                          />
                        </div>
                      )}

                      {/* Inline error */}
                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                        >
                          {error}{" "}
                          <button
                            type="button"
                            onClick={startGeneration}
                            className="font-bold underline ml-1"
                          >
                            Try Again
                          </button>
                        </motion.p>
                      )}

                      {/* Generate button */}
                      <GenerateButton
                        loading={false}
                        disabled={!canGenerate}
                        onClick={startGeneration}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── GENERATION AREA ── */}
        <AnimatePresence>
          {phase !== "input" && (
            <motion.div
              key="generation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col lg:flex-row gap-6"
            >
              {/* Left: cards */}
              <div className="flex-1">
                {/* Progress shimmer bar (while loading) */}
                {anyLoading && (
                  <div className="mb-4 rounded-xl overflow-hidden h-10 relative bg-primary/10">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                      style={{ animation: "shimmerSlide 1.4s infinite linear" }}
                    />
                    <div className="absolute inset-0 flex items-center px-4">
                      <Sparkles className="w-4 h-4 text-primary mr-2 animate-pulse" />
                      <span className="text-xs font-semibold text-primary">
                        Creating{" "}
                        {
                          layouts.filter(
                            (l) => l.status !== "done" && l.status !== "error",
                          ).length
                        }{" "}
                        layout
                        {layouts.filter(
                          (l) => l.status !== "done" && l.status !== "error",
                        ).length !== 1
                          ? "s"
                          : ""}
                        ...
                      </span>
                      <div className="ml-auto flex gap-4">
                        {layouts.map((l) => (
                          <span
                            key={l.id}
                            className={`text-xs font-semibold ${l.status === "done" ? "text-green-600" : l.status === "error" ? "text-red-500" : "text-primary"}`}
                          >
                            {l.id}{" "}
                            {l.status === "done"
                              ? "✓"
                              : l.status === "error"
                                ? "✕"
                                : "⏳"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {layouts.map((layout, i) => (
                    <div key={layout.id}>
                      {layout.status === "pending" ||
                      layout.status === "loading" ? (
                        <SkeletonCard
                          delay={i * 0.04}
                          slotId={layout.id}
                          planEntry={plannerThreeOption?.[layout.id]}
                        />
                      ) : (
                        <LayoutCard
                          layout={layout}
                          label={`Option ${layout.id}`}
                          selected={selectedLayout === layout.id}
                          onSelect={() =>
                            layout.status === "error"
                              ? retryLayout(layout.id)
                              : handleCardClick(layout.id)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Done CTA */}
                {allDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 flex items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = layouts.find(
                          (l) => l.id === selectedLayout && l.status === "done",
                        );
                        const ws = chosen?.data?.worksheet ?? chosen?.data;
                        if (ws) {
                          if (sessionIdRef.current) {
                            const om = chosen?.data?.optionMetadata;
                            ws.quickGenMeta = {
                              ...(ws.quickGenMeta || {}),
                              sessionId: sessionIdRef.current,
                              layoutSlot: selectedLayout,
                              activityType: chosen?.resolvedActivityType,
                              layoutType:
                                chosen?.meta?.layoutType ??
                                om?.layoutType ??
                                ws.quickGenMeta?.layoutType,
                            };
                          }
                          setWorksheet(ws);
                        }
                        patchQuickGenSession({ selectedLayout });
                        setEditorReturnToQuickGen(true);
                        saveQuickGenReturnPath();
                        const q = new URLSearchParams();
                        if (sessionIdRef.current)
                          q.set("sessionId", sessionIdRef.current);
                        q.set("layoutId", selectedLayout);
                        setLocation(`${BASE}/result?${q.toString()}`);
                      }}
                      disabled={!layouts.some((l) => l.status === "done")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open Layout {selectedLayout} in Editor →
                    </button>
                    <button
                      type="button"
                      onClick={startGeneration}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Right: customization panel */}
              <div className="lg:w-64 shrink-0">
                <CustomizationPanel
                  value={custom}
                  onChange={handleCustomChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
