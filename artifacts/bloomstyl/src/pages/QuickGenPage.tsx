import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, RefreshCw, ArrowRight, Loader2, FileText } from "lucide-react";
import { nanoid } from "nanoid";
import {
  useBloomStore,
  type QuickGenLayoutState,
  type QuickGenContentAnalysis,
  DEFAULT_QUICK_GEN_DIFFERENTIATION,
} from "../store";
import {
  getCanonicalActivityPlan,
  getFamiliesForSubject,
  getDefaultFamilyId,
  resolveFamilyIdForSubject,
  type SubjectId as QGSubjectId,
} from "../lib/quickGenFamilies";
import {
  QuickGenOptionMiniPreview,
  resolveQuickGenPreviewKind,
} from "../components/quickGen/QuickGenOptionPreview";
import { saveQuickGenReturnPath, setQuickGenSessionId, consumeQuickGenResumeSession } from "../lib/quickGenNavigation";
import { normalizeDisplayText, normalizeFormalLabel } from "../lib/normalizeTitle";
import { quickGenLayoutVariantCopy } from "../lib/quickGenLayoutCopy";

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

type SubjectRow = {
  id: SubjectId;
  label: string;
  icon: string;
  color: string;
  placeholder: string;
};

const SUBJECTS: SubjectRow[] = [
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
    placeholder: "e.g. Narrative writing, opinion paragraph, descriptive essay...",
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
    placeholder: "e.g. Community helpers, the American Revolution, map skills...",
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
    placeholder: "e.g. Managing emotions, growth mindset, conflict resolution...",
  },
  {
    id: "ell",
    label: "ELL / ESL",
    icon: "🌐",
    color: "#84cc16",
    placeholder: "e.g. Vocabulary building, sentence frames, basic conversation...",
  },
  {
    id: "holiday",
    label: "Holiday",
    icon: "🎉",
    color: "#f43f5e",
    placeholder: "e.g. Halloween, Thanksgiving, end of year, Valentine's Day...",
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

const GRADES = ["Pre-K","K","1","2","3","4","5","6","7","8"];

const PROBLEM_COUNT_CHOICES = [5, 10, 15] as const;

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "input" | "generating" | "done";
type Layout = QuickGenLayoutState;

const DEFAULT_LAYOUTS: Layout[] = [
  { id: "A", status: "pending", data: null, error: null, layoutVariant: "A" },
  { id: "B", status: "pending", data: null, error: null, layoutVariant: "B" },
  { id: "C", status: "pending", data: null, error: null, layoutVariant: "C" },
];

// ── safeParseJSON ──────────────────────────────────────────────────────────────

function safeParseJSON(str: string): any | null {
  try {
    return JSON.parse(
      str.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()
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
  label = "Create Worksheets ✦",
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  label?: string;
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
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            animation: "shimmerSlide 1.4s infinite linear",
          }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5" />
        {loading ? "Creating..." : label}
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
  const previewKind = resolveQuickGenPreviewKind(undefined, planEntry?.activityType);
  const lv = quickGenLayoutVariantCopy(planEntry?.activityType, slotId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="rounded-xl border-2 border-dashed border-primary/25 bg-white p-4 space-y-2 will-change-transform text-left"
    >
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Worksheet {slotId}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-muted/80 text-foreground border-border">
            Preview
          </span>
          {planEntry && (
            <span
              className="text-[9px] font-mono text-primary/90 truncate max-w-[100px]"
              title={planEntry.activityType}
            >
              {normalizeFormalLabel(planEntry.activityType.replace(/_/g, " "))}
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] font-semibold text-primary/80">
        Style: {lv.title} <span className="font-normal text-muted-foreground">— {lv.blurb}</span>
      </p>
      {planEntry && (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
          {normalizeFormalLabel(planEntry.familyLabel)}
        </p>
      )}
      <div className="relative opacity-90">
        <QuickGenOptionMiniPreview
          kind={previewKind}
          activityType={planEntry?.activityType}
          layoutVariant={slotId}
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
function layoutCardAccent(layoutType: string | undefined, activityType: string | undefined): string {
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
  layoutVariant,
}: {
  layout: Layout;
  label: string;
  selected: boolean;
  onSelect: () => void;
  layoutVariant: "A" | "B" | "C";
}) {
  const meta = layout.meta;
  const om = layout.data?.optionMetadata;
  const lt = meta?.layoutType || om?.layoutType;
  const variantCopy = quickGenLayoutVariantCopy(layout.resolvedActivityType, layoutVariant);

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
        ${selected
          ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/12 scale-[1.02]"
          : "border-border hover:border-primary/40 hover:shadow-md"
        }`}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected && (
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </span>
          )}
        </div>
      </div>

      <p className="text-[11px] font-semibold text-primary/90 mb-1">
        Experience: {variantCopy.title}{" "}
        <span className="font-normal text-muted-foreground">— {variantCopy.blurb}</span>
      </p>

      {(meta?.title || om?.title || layout.resolvedActivityType) && (
        <h3 className="text-sm font-bold text-foreground leading-tight mb-1">
          {normalizeFormalLabel(
            String(meta?.title || om?.title || layout.resolvedActivityType?.replace(/_/g, " ") || "")
          )}
        </h3>
      )}

      <QuickGenOptionMiniPreview
        kind={resolveQuickGenPreviewKind(lt, layout.resolvedActivityType)}
        activityType={layout.resolvedActivityType}
        layoutType={lt}
        layoutVariant={layoutVariant}
        className="my-2"
      />

      {(meta?.shortDescription || om?.shortDescription) && (
        <p className="text-[12px] text-foreground leading-snug mb-3">
          {normalizeFormalLabel(String(meta?.shortDescription || om?.shortDescription || ""))}
        </p>
      )}

      {((meta?.includedComponents?.length ?? 0) > 0 || (om?.includedComponents?.length ?? 0) > 0) && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Includes</p>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4 marker:text-primary/70">
            {(meta?.includedComponents || om?.includedComponents || []).map((line: string, i: number) => (
              <li key={i}>{normalizeFormalLabel(line)}</li>
            ))}
          </ul>
        </div>
      )}

      {(meta?.skillFocus || om?.skillFocus) && (
        <p className="text-[11px] leading-snug">
          <span className="font-bold text-foreground">Skill focus: </span>
          <span className="text-muted-foreground">
            {normalizeFormalLabel(String(meta?.skillFocus || om?.skillFocus || ""))}
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

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickGenPage() {
  const [, setLocation] = useLocation();
  const setWorksheet = useBloomStore((s) => s.setWorksheet);
  const setQuickGenSession = useBloomStore((s) => s.setQuickGenSession);
  const patchQuickGenSession = useBloomStore((s) => s.patchQuickGenSession);
  const setEditorReturnToQuickGen = useBloomStore((s) => s.setEditorReturnToQuickGen);

  // ── Form state — fresh defaults; restored only when resuming from editor (see mount effect) ──
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [problemCount, setProblemCount] = useState(10);
  const [activityTypeId, setActivityTypeId] = useState("");
  const [activityTypeLabel, setActivityTypeLabel] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [contentAnalysis, setContentAnalysis] = useState<QuickGenContentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  /** Flow: topic+grade → worksheet focus → generate (differentiation is editor-only) */
  const [topicGradeStepComplete, setTopicGradeStepComplete] = useState(false);

  // ── Generation state ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("input");
  const [layouts, setLayouts] = useState<Layout[]>(DEFAULT_LAYOUTS);
  const [selectedLayout, setSelectedLayout] = useState<"A" | "B" | "C">("A");
  const [error, setError] = useState("");
  const [rehydrated, setRehydrated] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const topicRef = useRef<HTMLInputElement>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});
  const genKey = useRef(0);
  /** Set in startGeneration: canonical activity for parallel layout variants (neutral baseline diff). */
  const generationContextRef = useRef<{
    plan: { activityType: string; familyLabel: string };
  } | null>(null);

  const subjectObj = SUBJECTS.find((s) => s.id === subject);
  const families = subject ? getFamiliesForSubject(subject as QGSubjectId) : [];
  const selectedFamily = families.find((f) => f.familyId === familyId);
  const canGenerate =
    subject !== "" &&
    topic.trim().length >= 3 &&
    (familyId !== "" || families.length === 0) &&
    topicGradeStepComplete;

  const resolvedPlannerFamily =
    familyId || (subject ? getDefaultFamilyId(subject as QGSubjectId) : "");
  /** One activity type per family; three options differ only by layoutVariant A/B/C */
  const canonicalPlan = useMemo(() => {
    if (!subject || !resolvedPlannerFamily) return null;
    return getCanonicalActivityPlan(
      subject as QGSubjectId,
      resolvedPlannerFamily,
      topic.trim(),
      grade || "General",
      subject === "custom" ? activityTypeId : undefined
    );
  }, [subject, resolvedPlannerFamily, topic, grade, activityTypeId]);

  /** Prefer analyze-quick-gen topic when present; display-only (does not change stored topic). */
  const topicDisplaySource = useMemo(() => {
    const detected = contentAnalysis?.detectedTopic?.trim();
    if (detected && detected.length >= 2) return detected;
    return topic.trim();
  }, [topic, contentAnalysis?.detectedTopic]);

  const topicLabelDisplay = useMemo(
    () => normalizeFormalLabel(topicDisplaySource),
    [topicDisplaySource]
  );

  // Auto-focus topic when entering topic+grade step
  useEffect(() => {
    if (subject && !topicGradeStepComplete && topicRef.current) {
      setTimeout(() => topicRef.current?.focus(), 200);
    }
  }, [subject, topicGradeStepComplete]);

  /** Resume from editor → same options session; otherwise start with a blank worksheet. */
  useEffect(() => {
    const resume = consumeQuickGenResumeSession();
    const s = useBloomStore.getState().quickGenSession;
    if (resume && s) {
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
      setTopicGradeStepComplete(s.topicGradeStepComplete ?? true);
      setLayouts(s.layouts as Layout[]);
      setSelectedLayout(s.selectedLayout);
      {
        const pc = s.problemCount;
        setProblemCount(typeof pc === "number" && [5, 10, 15].includes(pc) ? pc : 10);
      }
      if (s.phase === "generating") {
        setPhase("done");
      } else {
        setPhase(s.phase);
      }
    } else {
      setQuickGenSession(null);
      setQuickGenSessionId(null);
      setEditorReturnToQuickGen(false);
    }
    setRehydrated(true);
  }, [setQuickGenSession, setEditorReturnToQuickGen]);

  // Persist session when there is progress, results, or after leaving input (survives editor navigation)
  useEffect(() => {
    if (!rehydrated || !subject) return;
    const hasResults = layouts.some((l) => l.status === "done" || l.status === "error");
    const hasStepProgress = topicGradeStepComplete;
    if (phase === "input" && !hasResults && !hasStepProgress) return;

    if (!sessionIdRef.current) sessionIdRef.current = nanoid();
    setQuickGenSessionId(sessionIdRef.current);
    setQuickGenSession({
      sessionId: sessionIdRef.current!,
      subject,
      topic,
      grade,
      familyId: familyId || getDefaultFamilyId(subject as QGSubjectId),
      differentiation: DEFAULT_QUICK_GEN_DIFFERENTIATION,
      differentiationStepComplete: topicGradeStepComplete,
      topicGradeStepComplete,
      worksheetFocusStepComplete: topicGradeStepComplete,
      pastedContent,
      contentAnalysis,
      activityTypeId,
      activityTypeLabel,
      problemCount,
      phase,
      layouts,
      selectedLayout,
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
    topicGradeStepComplete,
    pastedContent,
    contentAnalysis,
    activityTypeId,
    activityTypeLabel,
    problemCount,
    setQuickGenSession,
  ]);

  // ── Update layout ──────────────────────────────────────────────────────────
  const updateLayout = useCallback((id: "A" | "B" | "C", updates: Partial<Layout>) => {
    setLayouts((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // ── Single layout fetch ────────────────────────────────────────────────────
  const fetchLayout = useCallback(
    async (id: "A" | "B" | "C", key: number) => {
      const controller = new AbortController();
      abortRefs.current[id] = controller;
      const timer = setTimeout(() => controller.abort(), 30000);

      updateLayout(id, { status: "loading", data: null, error: null, meta: null, resolvedActivityType: undefined, layoutVariant: id });
      const topicTrim = topic.trim();
      const resolvedFamily = familyId || getDefaultFamilyId(subject as QGSubjectId);
      const ctx =
        generationContextRef.current ??
        ({
          plan: getCanonicalActivityPlan(
            subject as QGSubjectId,
            resolvedFamily,
            topicTrim,
            grade || "General",
            subject === "custom" ? activityTypeId : undefined
          ),
        } as const);
      const plan = ctx.plan;
      const diff = DEFAULT_QUICK_GEN_DIFFERENTIATION;
      console.log(`Slot ${id}: activityType=${plan.activityType} layoutVariant=${id}`);

      try {
        const res = await fetch(`http://localhost:8080/api/worksheet/customize-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            activityType: plan.activityType,
            layoutVariant: id,
            generationSlot: id,
            differentiation: diff,
            topic: topicTrim,
            grade: grade || "General",
            subjectId: subject,
            variantFamilyLabel: plan.familyLabel,
            originalPrompt: topicTrim,
            parsedPromptData: {
              topic: topicTrim,
              gradeLevel: grade || "General",
              skillFocus: subjectObj?.label ?? subject,
              targetWord: topicTrim.split(/\s+/).slice(0, 4).join(" ") || topicTrim,
              worksheetFamilyId: resolvedFamily,
            },
            options: {
              title: `${normalizeFormalLabel(topicTrim)} — ${normalizeFormalLabel(plan.familyLabel)}`,
              gradeLevel: grade || "General",
              includeName: true,
              includeDate: true,
              colorScheme: "black & white",
              fontStyle: "clean",
              borderStyle: "none",
              diagramSubject: topicTrim,
              matchType: subject === "science" ? "Science term → Definition" : "Term → Definition",
              pairCount: diff.choiceCount === 2 ? 4 : diff.choiceCount === 4 ? 8 : 6,
              choiceCount: diff.choiceCount,
              problemCount,
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
            layoutVariant: id,
            activityType: plan.activityType,
            differentiation: diff,
            layoutType: om?.layoutType ?? ws.quickGenMeta?.layoutType,
          };
        }
        updateLayout(id, {
          status: "done",
          data,
          resolvedActivityType: plan.activityType,
          layoutVariant: id,
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
    [topic, grade, subject, subjectObj, familyId, activityTypeId, updateLayout, problemCount]
  );

  // ── Start generation ───────────────────────────────────────────────────────
  const startGeneration = useCallback(() => {
    if (!canGenerate) return;

    const key = ++genKey.current;
    Object.values(abortRefs.current).forEach((c) => c.abort());
    abortRefs.current = {};

    console.log("[GEN] === Starting parallel generation ===");
    console.log("[GEN] Subject:", subject, "| Topic:", topic, "| Grade:", grade);
    const fam = familyId || getDefaultFamilyId(subject as QGSubjectId);
    const plan = getCanonicalActivityPlan(
      subject as QGSubjectId,
      fam,
      topic.trim(),
      grade || "General",
      subject === "custom" ? activityTypeId : undefined
    );
    generationContextRef.current = { plan };
    console.log("[GEN] Same activityType for A/B/C:", plan.activityType, "| layouts: Clean / Scaffolded / Compact");

    sessionIdRef.current = nanoid();
    setQuickGenSessionId(sessionIdRef.current);
    setLayouts([...DEFAULT_LAYOUTS]);
    setError("");
    setPhase("generating");

    // Fire all 3 in parallel
    fetchLayout("A", key);
    fetchLayout("B", key);
    fetchLayout("C", key);
  }, [canGenerate, subject, topic, grade, familyId, activityTypeId, fetchLayout]);

  // Watch for all done → switch to done phase
  useEffect(() => {
    if (phase === "generating") {
      const allSettled = layouts.every((l) => l.status === "done" || l.status === "error");
      const anyDone    = layouts.some((l)  => l.status === "done");
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
            layoutVariant: id,
            activityType: layout.resolvedActivityType,
            differentiation: DEFAULT_QUICK_GEN_DIFFERENTIATION,
            layoutType: layout.meta?.layoutType ?? om?.layoutType ?? ws.quickGenMeta?.layoutType,
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

  // ── Retry single layout ────────────────────────────────────────────────────
  const retryLayout = (id: "A" | "B" | "C") => {
    fetchLayout(id, genKey.current);
  };

  const allDone    = layouts.every((l) => l.status === "done" || l.status === "error");
  const anyLoading = layouts.some((l) => l.status === "loading" || l.status === "pending");

  const runAnalyzeContent = useCallback(async () => {
    const t = pastedContent.trim();
    if (t.length < 20) {
      setError("Paste at least a short paragraph (20+ characters) to analyze.");
      return;
    }
    setError("");
    setAnalyzing(true);
    try {
      const res = await fetch(`http://localhost:8080/api/worksheet/analyze-quick-gen`, {
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
        confidenceSubject: typeof data.confidenceSubject === "number" ? data.confidenceSubject : 0,
        familySuggestions: Array.isArray(data.familySuggestions) ? data.familySuggestions : [],
        defaultFamilyId: data.defaultFamilyId ?? null,
      };
      setContentAnalysis(analysis);
      if (analysis.detectedSubjectId && SUBJECTS.some((x) => x.id === analysis.detectedSubjectId)) {
        setSubject(analysis.detectedSubjectId as SubjectId);
      }
      if (analysis.detectedTopic) setTopic(normalizeFormalLabel(analysis.detectedTopic));
      if (analysis.gradeGuess) setGrade(analysis.gradeGuess);
      const subj = (
        analysis.detectedSubjectId && SUBJECTS.some((x) => x.id === analysis.detectedSubjectId)
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
        <div className={`transition-all duration-300 ${phase !== "input" ? "mb-6" : "mb-0"}`}>

          {/* Compact summary bar shown during/after generation */}
          {phase !== "input" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6 px-4 py-2.5 bg-primary/5 border border-primary/15 rounded-xl"
            >
              <span className="text-lg">{subjectObj?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{topicLabelDisplay}</p>
                <p className="text-xs text-muted-foreground">
                  {subjectObj?.label}
                  {grade ? ` · Grade ${grade}` : ""}
                  {selectedFamily ? ` · ${normalizeFormalLabel(selectedFamily.label)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase("input");
                  Object.values(abortRefs.current).forEach((c) => c.abort());
                  setTopicGradeStepComplete(true);
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
                  <h1 className="text-3xl font-bold text-foreground">What Subject?</h1>
                  <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                    Choose a subject, enter your topic, and BloomStyl will generate three strong worksheet options for you.
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
                          setTopicGradeStepComplete(false);
                        }}
                        className="relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all will-change-transform"
                        style={{
                          borderColor: isSelected ? s.color : undefined,
                          backgroundColor: isSelected ? `${s.color}14` : undefined,
                          transform: isSelected ? "scale(1.03)" : "scale(1)",
                          transition: "transform 80ms ease-out, background-color 80ms ease-out, border-color 80ms ease-out",
                        }}
                      >
                        <span className="text-xl shrink-0">{s.icon}</span>
                        <span className={`text-sm font-bold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
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

                {/* ── Step 1: Topic & grade ── */}
                <AnimatePresence>
                  {subject && !topicGradeStepComplete && (
                    <motion.div
                      key="topic-grade"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="max-w-2xl mx-auto space-y-5"
                    >
                      <div className="rounded-xl border-2 border-primary/20 bg-white p-5 space-y-4">
                        <h2 className="text-lg font-bold text-foreground">What are you teaching?</h2>
                        <label className="block text-sm font-bold text-foreground mb-2">
                          Topic
                        </label>
                        <input
                          ref={topicRef}
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          onBlur={() => setTopic((t) => normalizeFormalLabel(t))}
                          placeholder={subjectObj?.placeholder ?? "e.g. topic or concept..."}
                          className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base font-medium placeholder:text-muted-foreground/55 focus:border-primary focus:outline-none transition-colors"
                        />
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          We’ll automatically generate practice, interactive, and visual versions.
                        </p>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Grade Level <span className="normal-case font-normal tracking-normal">(optional)</span>
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
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Number of Problems
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PROBLEM_COUNT_CHOICES.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setProblemCount(n)}
                                className={`min-w-[3rem] px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                                  problemCount === n
                                    ? "bg-primary text-white border-primary"
                                    : "border-border bg-white text-foreground hover:border-primary/45"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={topic.trim().length < 3}
                          onClick={() => setTopicGradeStepComplete(true)}
                          className="w-full rounded-xl px-6 py-3.5 bg-primary text-white text-sm font-bold hover:opacity-95 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Worksheet focus (family, paste, custom) + generate ── */}
                  {subject && topicGradeStepComplete && (
                    <motion.div
                      key="worksheet-focus"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="max-w-2xl mx-auto space-y-5"
                    >
                      <button
                        type="button"
                        onClick={() => setTopicGradeStepComplete(false)}
                        className="text-[11px] font-semibold text-primary hover:text-primary/80"
                      >
                        ← Back
                      </button>

                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <FileText className="w-4 h-4 text-primary" />
                          Lesson Text (Optional)
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Paste standards, a reading passage, or notes. We will suggest worksheet families—then pick one below.
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
                          disabled={analyzing || pastedContent.trim().length < 20}
                          onClick={runAnalyzeContent}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary text-xs font-bold hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {analyzing ? "Analyzing…" : "Suggest Families From Content"}
                        </button>
                        {contentAnalysis && contentAnalysis.familySuggestions.length > 0 && (
                          <div className="pt-2 space-y-1.5 border-t border-border/60">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Suggested From Your Text</p>
                            <div className="flex flex-wrap gap-2">
                              {contentAnalysis.familySuggestions.map((sug, i) => (
                                <button
                                  key={`${sug.familyId}-${i}`}
                                  type="button"
                                  onClick={() => subject && setFamilyId(resolveFamilyIdForSubject(subject as QGSubjectId, sug.familyId))}
                                  className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] max-w-full ${
                                    familyId === resolveFamilyIdForSubject((subject || "general") as QGSubjectId, sug.familyId)
                                      ? "border-primary bg-primary/8 text-primary"
                                      : "border-border hover:border-primary/40"
                                  }`}
                                >
                                  <span className="font-semibold">{normalizeFormalLabel(sug.label)}</span>
                                  {sug.reason && (
                                    <span className="block text-muted-foreground font-normal mt-0.5 line-clamp-2">
                                      {normalizeDisplayText(sug.reason)}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                            {typeof contentAnalysis.confidenceSubject === "number" && (
                              <p className="text-[10px] text-muted-foreground">
                                Subject guess confidence: {Math.round(contentAnalysis.confidenceSubject * 100)}%
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {families.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Worksheet Style
                          </p>
                          <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
                            We’ll use this to shape the layout and activity style for you.
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
                                  <p className="text-xs font-bold text-foreground">{normalizeFormalLabel(f.label)}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {normalizeDisplayText(f.description)}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {subject === "custom" && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Override Activity Type <span className="normal-case font-normal tracking-normal">(optional)</span>
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

                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                        >
                          {error}{" "}
                          <button type="button" onClick={startGeneration} className="font-bold underline ml-1">
                            Try Again
                          </button>
                        </motion.p>
                      )}

                      <GenerateButton
                        loading={false}
                        disabled={!canGenerate}
                        onClick={startGeneration}
                        label="Create Worksheets ✦"
                      />
                      <p className="text-center text-[11px] text-muted-foreground">
                        Pick your favorite version, then open the editor anytime—supports and levels live under{" "}
                        <span className="font-semibold text-foreground/85">Differentiate</span>.
                      </p>
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
              className="flex flex-col gap-6"
            >
              <div className="w-full max-w-6xl mx-auto">
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
                        Creating {layouts.filter((l) => l.status !== "done" && l.status !== "error").length} worksheet{layouts.filter((l) => l.status !== "done" && l.status !== "error").length !== 1 ? "s" : ""}...
                      </span>
                      <div className="ml-auto flex gap-4">
                        {layouts.map((l) => (
                          <span key={l.id} className={`text-xs font-semibold ${l.status === "done" ? "text-green-600" : l.status === "error" ? "text-red-500" : "text-primary"}`}>
                            {l.id} {l.status === "done" ? "✓" : l.status === "error" ? "✕" : "⏳"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {layouts.map((layout, i) => (
                    <div key={layout.id}>
                      {(layout.status === "pending" || layout.status === "loading") ? (
                        <SkeletonCard
                          delay={i * 0.04}
                          slotId={layout.id}
                          planEntry={
                            canonicalPlan
                              ? { activityType: canonicalPlan.activityType, familyLabel: canonicalPlan.familyLabel }
                              : undefined
                          }
                        />
                      ) : (
                        <LayoutCard
                          layout={layout}
                          label={`Version ${layout.id}`}
                          selected={selectedLayout === layout.id}
                          onSelect={() => layout.status === "error" ? retryLayout(layout.id) : handleCardClick(layout.id)}
                          layoutVariant={layout.id}
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
                        const chosen = layouts.find((l) => l.id === selectedLayout && l.status === "done");
                        const ws = chosen?.data?.worksheet ?? chosen?.data;
                        if (ws) {
                          if (sessionIdRef.current) {
                            const om = chosen?.data?.optionMetadata;
                            ws.quickGenMeta = {
                              ...(ws.quickGenMeta || {}),
                              sessionId: sessionIdRef.current,
                              layoutSlot: selectedLayout,
                              layoutVariant: selectedLayout,
                              activityType: chosen?.resolvedActivityType,
                              differentiation: DEFAULT_QUICK_GEN_DIFFERENTIATION,
                              layoutType: chosen?.meta?.layoutType ?? om?.layoutType ?? ws.quickGenMeta?.layoutType,
                            };
                          }
                          setWorksheet(ws);
                        }
                        patchQuickGenSession({ selectedLayout });
                        setEditorReturnToQuickGen(true);
                        saveQuickGenReturnPath();
                        const q = new URLSearchParams();
                        if (sessionIdRef.current) q.set("sessionId", sessionIdRef.current);
                        q.set("layoutId", selectedLayout);
                        setLocation(`${BASE}/result?${q.toString()}`);
                      }}
                      disabled={!layouts.some((l) => l.status === "done")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open version {selectedLayout} in editor →
                    </button>
                    <button
                      type="button"
                      onClick={startGeneration}
                      className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> 🔄 Try Another Version
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
