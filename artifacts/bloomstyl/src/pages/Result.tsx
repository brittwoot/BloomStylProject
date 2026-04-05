import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  PanelRight,
  Check,
  RotateCcw,
  Pencil,
  Layers,
  Lightbulb,
  Sparkles,
  PenLine,
} from "lucide-react";
import {
  useBloomStore,
  DEFAULT_SECTION_STYLE,
  type SectionStyle,
  type GlobalTypography,
} from "../store";
import { StepIndicator } from "./UploadPage";
import { EditorSidebar } from "../components/editor/EditorSidebar";
import { EditableTextBlock } from "../components/editor/EditableTextBlock";
import { SectionActivationContext } from "../components/editor/SectionActivationContext";
import { SectionTextStyleContext } from "../components/editor/SectionTextStyleContext";
import { MathInlineText } from "../components/math/StackedFraction";
import { ExportModal } from "../components/ExportModal";
import { getHeadingCSS } from "../components/editor/fontData";
import { useDifferentiationStore } from "../stores/differentiationStore";
import {
  consumeQuickGenReturnPath,
  getQuickGenSessionId,
  setQuickGenResumeSession,
} from "../lib/quickGenNavigation";
import { normalizeFormalLabel } from "../lib/normalizeTitle";
import {
  WordPracticeSection,
  WordSightRow,
  FillBlanksSection,
  SentencePracticeSection,
  ColoringActivitySection,
  TracingSection,
} from "../components/editor/ActivitySections";
import {
  MindMapSection,
  VennDiagramSection,
  KWLChartSection,
  SequenceChartSection,
  FrayerModelSection,
  StoryMapSection,
  AcrosticSection,
  MiniBookSection,
  WritingPromptHeader,
  WordBankSection,
  SentenceFramesSection,
  NumberBondSection,
  TenFrameSection,
  ClockPracticeSection,
  LabelDiagramSection,
  ObservationSheetSection,
  TimelineSection,
  LineMatchingSection,
  CutAndSortSection,
  BingoCardSection,
  FullWordSearchSection,
  SpinnerSection,
  DiceActivitySection,
  GraphPageSection,
  ColoringPageSection,
  ColorByCodeSection,
  PictureSortSection,
  CrosswordSection,
} from "../components/editor/NewSections";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Inlined math practice templates (Quick Gen A/B/C) — self-contained, no extra modules
type MathPracticeVisualId =
  | "clean_practice"
  | "fun_classroom_practice"
  | "scaffolded_support_practice";

function resolveMathPracticeVisual(
  layoutVariant: string | undefined,
): MathPracticeVisualId {
  const lv = (layoutVariant || "A").toUpperCase();
  if (lv === "B") return "fun_classroom_practice";
  if (lv === "C") return "scaffolded_support_practice";
  return "clean_practice";
}

const mathWorkGridStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
  `,
  backgroundSize: "12px 12px",
};

type MathPracticeAccent = {
  border: string;
  bg: string;
  header: string;
  ring: string;
};

const MATH_PRACTICE_ACCENTS: Record<MathPracticeVisualId, MathPracticeAccent> =
  {
    clean_practice: {
      border: "border-slate-200",
      bg: "bg-white",
      header: "bg-slate-50 border-slate-200 text-slate-800",
      ring: "ring-1 ring-slate-200/80",
    },
    fun_classroom_practice: {
      border: "border-amber-200",
      bg: "bg-gradient-to-br from-amber-50/90 to-orange-50/50",
      header: "bg-amber-100/90 border-amber-200 text-amber-950",
      ring: "ring-1 ring-amber-200/90",
    },
    scaffolded_support_practice: {
      border: "border-indigo-200",
      bg: "bg-indigo-50/40",
      header: "bg-indigo-100/80 border-indigo-200 text-indigo-950",
      ring: "ring-1 ring-indigo-200/80",
    },
  };

function normalizeQuickGenLayoutType(layoutType?: string): string {
  return String(layoutType || "")
    .trim()
    .toLowerCase();
}

function MathPracticeSectionBanner({
  visual,
  children,
}: {
  visual: MathPracticeVisualId;
  children: React.ReactNode;
}) {
  const a = MATH_PRACTICE_ACCENTS[visual];
  if (visual === "fun_classroom_practice") {
    return (
      <div
        className={`rounded-2xl border-2 ${a.border} ${a.bg} ${a.ring} overflow-hidden print:break-inside-avoid`}
      >
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${a.header}`}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest">
            Math practice
          </span>
          <span className="text-sm" aria-hidden>
            ✨
          </span>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    );
  }
  if (visual === "scaffolded_support_practice") {
    return (
      <div
        className={`rounded-2xl border-2 ${a.border} ${a.bg} ${a.ring} overflow-hidden print:break-inside-avoid`}
      >
        <div className={`px-3 py-2 border-b ${a.header}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide">
            Practice with support
          </p>
          <p className="text-[10px] text-indigo-800/80 mt-0.5">
            Use the answer line first, then the grid for work.
          </p>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl border-2 ${a.border} ${a.bg} ${a.ring} overflow-hidden print:break-inside-avoid`}
    >
      <div
        className={`px-3 py-2 border-b ${a.header} flex items-center justify-between gap-2`}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
          Practice
        </span>
        <span
          className="text-[10px] font-mono text-slate-500/90 tabular-nums"
          aria-hidden
        >
          + − × ÷
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MathPracticeProblemCard({
  visual,
  index,
  children,
}: {
  visual: MathPracticeVisualId;
  index: number;
  children: React.ReactNode;
}) {
  const a = MATH_PRACTICE_ACCENTS[visual];
  const deco =
    visual === "fun_classroom_practice" ? (
      <span className="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-amber-200/90 text-[10px] font-bold flex items-center justify-center text-amber-900 border border-amber-300 shadow-sm">
        {index}
      </span>
    ) : null;

  return (
    <div
      className={`relative rounded-xl border ${a.border} ${visual === "clean_practice" ? "bg-white" : "bg-white/80"} shadow-sm ring-1 ring-slate-100/80 print:break-inside-avoid`}
    >
      {deco}
      <div
        className={`p-4 sm:p-5 ${visual !== "fun_classroom_practice" ? "pt-4" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function MathAnswerAndWork({
  visual,
  accentColor,
  lines,
}: {
  visual: MathPracticeVisualId;
  accentColor?: string;
  lines: number;
}) {
  const border = accentColor ? `${accentColor}55` : undefined;
  if (visual === "scaffolded_support_practice") {
    return (
      <div className="mt-2 space-y-2 border-t border-indigo-200/50 pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800/90 mb-0.5">
            Answer
          </p>
          <div
            className="h-8 rounded-md border-2 border-dashed border-indigo-300/80 bg-white"
            style={{ borderColor: border }}
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800/90 mb-0.5">
            Show your work
          </p>
          <div
            className="rounded-md border border-indigo-200/90 bg-white min-h-[72px] p-1.5"
            style={mathWorkGridStyle}
          >
            <div className="space-y-2.5">
              {Array.from({ length: Math.max(3, Math.min(lines, 6)) }).map(
                (_, i) => (
                  <div key={i} className="border-b border-indigo-200/40 h-4" />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (visual === "fun_classroom_practice") {
    return (
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-amber-200/50 pt-2">
        <div>
          <p className="text-[10px] font-bold text-amber-900/80 mb-0.5">
            Answer
          </p>
          <div className="h-7 rounded-md border-2 border-amber-300/70 bg-white border-dashed" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-amber-900/80 mb-0.5">
            How I solved it
          </p>
          <div className="space-y-1.5">
            {Array.from({ length: Math.max(2, lines - 1) }).map((_, i) => (
              <div
                key={i}
                className="border-b-2 border-amber-200/80 h-5"
                style={{ borderColor: border }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-1 border-t border-slate-200/80 pt-2">
      <div className="flex items-end gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 shrink-0">
          Answer
        </span>
        <div
          className="flex-1 h-6 border-b-2 border-slate-300"
          style={{ borderColor: border }}
        />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="border-b border-slate-200 h-5"
            style={{ borderColor: border ? `${border}` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

function mathPracticeQuestionsStackClass(visual: MathPracticeVisualId): string {
  if (visual === "fun_classroom_practice") return "space-y-6";
  if (visual === "scaffolded_support_practice") return "space-y-7";
  return "space-y-9";
}

// ── Typography helpers ─────────────────────────────────────────────────────────

function titleStyle(t: GlobalTypography): React.CSSProperties {
  const { containerStyle, textStyle } = getHeadingCSS(
    t.titleHeadingStyle,
    t.accentColor,
  );
  return {
    fontFamily: `'${t.titleFont}', sans-serif`,
    color: t.titleColor,
    lineHeight: t.lineHeight,
    ...containerStyle,
    ...textStyle,
  };
}

function headingStyle(t: GlobalTypography): React.CSSProperties {
  return {
    fontFamily: `'${t.headingFont}', sans-serif`,
    color: t.headingColor,
  };
}

function bodyFontStyle(t: GlobalTypography): React.CSSProperties {
  return {
    fontFamily: `'${t.bodyFont}', sans-serif`,
    lineHeight: t.lineHeight,
    fontSize: `${14 * t.baseSize}px`,
  };
}

// ── CSS helpers ───────────────────────────────────────────────────────────────

function sectionCSS(style: SectionStyle): React.CSSProperties {
  return {
    backgroundColor:
      style.bgColor === "transparent" ? undefined : style.bgColor,
    border:
      style.borderStyle !== "none"
        ? `${style.borderWidth}px ${style.borderStyle} ${style.borderColor}`
        : undefined,
    borderRadius: style.rounded ? "12px" : undefined,
    padding:
      style.bgColor !== "transparent" || style.borderStyle !== "none"
        ? "16px"
        : undefined,
  };
}

// ── ClipartRow ───────────────────────────────────────────────────────────────

function ClipartRow({ sectionId }: { sectionId: string }) {
  const { sectionClipart, removeClipart } = useBloomStore();
  const items = sectionClipart[sectionId] ?? [];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {items.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => removeClipart(sectionId, c.id)}
          title={`Remove ${c.label} (click to remove)`}
          className="print:pointer-events-none group relative leading-none hover:opacity-80 transition-opacity"
        >
          <span
            className={
              c.size === "sm"
                ? "text-3xl"
                : c.size === "lg"
                  ? "text-6xl"
                  : "text-4xl"
            }
          >
            {c.emoji}
          </span>
          <span className="print:hidden absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            ✕
          </span>
        </button>
      ))}
    </div>
  );
}

// ── WritingLines ──────────────────────────────────────────────────────────────

function WritingLines({
  count = 3,
  accentColor,
  worksheetStyle,
}: {
  count: number;
  accentColor?: string;
  /** Gray answer lines (print-friendly worksheet look). */
  worksheetStyle?: boolean;
}) {
  /** Enough room for handwriting; cap so layouts stay predictable. */
  const n = worksheetStyle
    ? Math.min(Math.max(count, 3), 5)
    : Math.min(Math.max(count, 2), 8);
  if (worksheetStyle) {
    return (
      <div className="mt-4 space-y-4" role="presentation">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="min-h-[1.35rem] border-b-2 border-neutral-500/75 w-full print:border-neutral-800"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-h-[1.25rem] border-b h-9"
          style={{
            borderColor: accentColor ? `${accentColor}40` : "rgba(0,0,0,0.18)",
          }}
        />
      ))}
    </div>
  );
}

function questionBadgeLabel(q: {
  question_type?: string;
  type?: string;
  text?: string;
  prompt?: string;
}): string {
  const t = String(q.question_type || q.type || "short_answer").toLowerCase();
  const text = String(q.text || q.prompt || "").toLowerCase();
  if (t === "multiple_choice" || t === "true_false" || t === "fill_in_blank")
    return "TRY IT";
  if (t === "essay") return "EXPLAIN";
  if (
    /(draw|sketch|label|diagram|model|complete the table|number line)/i.test(
      text,
    )
  )
    return "DRAW";
  if (/(explain why|how do you know|justify|reasoning|why do you)/i.test(text))
    return "EXPLAIN";
  if (t === "short_answer" || t === "fill_in_blank")
    return "SHOW YOUR THINKING";
  return "SHOW YOUR THINKING";
}

/** Print-friendly badges — aligned, intentional “task type” chips */
function badgeClassForLabel(label: string): string {
  const base =
    "inline-flex items-center justify-center text-center leading-tight min-h-[1.5rem] min-w-[4.5rem] max-w-[9rem] px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.06em] rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.07)] ring-1 ring-white/80 border";
  switch (label) {
    case "TRY IT":
      return `${base} bg-sky-100 text-sky-900 border-sky-300/55`;
    case "EXPLAIN":
      return `${base} bg-emerald-100 text-emerald-900 border-emerald-300/55`;
    case "DRAW":
      return `${base} bg-violet-100 text-violet-900 border-violet-300/55`;
    case "SHOW YOUR THINKING":
      return `${base} bg-orange-100 text-orange-900 border-orange-300/55`;
    default:
      return `${base} bg-slate-100 text-slate-800 border-slate-300/55`;
  }
}

/** Light gradients + borders by section type — distinct “personalities”, printable */
function sectionCardTheme(sectionType: string | undefined): {
  border: string;
  gradient: string;
  /** Bottom rule style for section title (dashed / dotted / solid) */
  titleBar: string;
  titleText: string;
  emoji: string;
  /** Extra depth: soft shadow + inset highlight, type-specific */
  cardEnhance: string;
  /** Wraps the title row — layout variety per subject area */
  headerFrame: string;
  /** Inner padding rhythm (structure unchanged) */
  sectionPadding: string;
} {
  const t = String(sectionType || "").toLowerCase();
  if (
    t.includes("math") ||
    t === "number_bond" ||
    t === "ten_frame" ||
    t === "graph_page" ||
    t === "measurement" ||
    t === "clock_practice" ||
    t === "spinner" ||
    t === "dice_activity"
  ) {
    return {
      border: "border-blue-200/95",
      gradient: "bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50",
      titleBar: "border-b-2 border-dashed border-blue-300/60",
      titleText: "text-blue-950",
      emoji: "🔢",
      cardEnhance:
        "shadow-[0_2px_12px_-4px_rgba(59,130,246,0.14)] ring-1 ring-sky-200/45 ring-inset ring-offset-0",
      headerFrame:
        "rounded-xl bg-white/60 px-3 sm:px-4 py-2.5 border border-sky-100/75 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] print:bg-white/95",
      sectionPadding: "p-6 sm:p-8 space-y-6",
    };
  }
  if (
    t.includes("science") ||
    t === "label_diagram" ||
    t === "observation_sheet" ||
    t === "sequence_chart" ||
    t === "timeline"
  ) {
    return {
      border: "border-emerald-200/95",
      gradient: "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/45",
      titleBar: "border-b-2 border-dotted border-emerald-300/55",
      titleText: "text-emerald-950",
      emoji: "🧪",
      cardEnhance:
        "shadow-[0_2px_12px_-4px_rgba(16,185,129,0.12)] ring-1 ring-emerald-200/40 ring-inset",
      headerFrame: "border-l-[4px] border-emerald-400/35 pl-4 sm:pl-5 -ml-0.5",
      sectionPadding: "p-5 sm:p-7 space-y-5",
    };
  }
  if (
    t.includes("read") ||
    t.includes("writing") ||
    t === "passage" ||
    t === "word_practice" ||
    t === "acrostic" ||
    t === "sentence_frames" ||
    t === "kwl_chart"
  ) {
    return {
      border: "border-violet-200/95",
      gradient:
        "bg-gradient-to-br from-violet-50/85 via-white to-fuchsia-50/40",
      titleBar: "border-b-2 border-violet-300/45",
      titleText: "text-violet-950",
      emoji: "📚",
      cardEnhance:
        "shadow-[0_2px_12px_-4px_rgba(139,92,246,0.11)] ring-1 ring-violet-200/40 ring-inset",
      headerFrame:
        "rounded-2xl bg-gradient-to-br from-violet-50/45 to-white/90 px-4 sm:px-5 py-3 border border-violet-100/70 print:border-violet-200/80 print:bg-white",
      sectionPadding: "p-7 sm:p-9 space-y-7",
    };
  }
  if (
    t.includes("match") ||
    t === "line_matching" ||
    t === "cut_and_sort" ||
    t === "picture_sort" ||
    t === "bingo_card"
  ) {
    return {
      border: "border-cyan-200/90",
      gradient: "bg-gradient-to-br from-cyan-50/80 via-white to-white",
      titleBar: "border-b-2 border-dashed border-cyan-300/55",
      titleText: "text-cyan-950",
      emoji: "🔗",
      cardEnhance:
        "shadow-[0_2px_12px_-4px_rgba(6,182,212,0.12)] ring-1 ring-cyan-200/45 ring-inset",
      headerFrame:
        "rounded-lg border border-dashed border-cyan-200/65 px-3 sm:px-4 py-2.5 bg-white/55 print:bg-white",
      sectionPadding: "p-6 sm:p-8 space-y-6",
    };
  }
  return {
    border: "border-indigo-200/90",
    gradient: "bg-gradient-to-br from-indigo-50/75 via-white to-white",
    titleBar: "border-b-2 border-dashed border-indigo-300/45",
    titleText: "text-slate-900",
    emoji: "✏️",
    cardEnhance: "shadow-sm ring-1 ring-slate-200/40 ring-inset",
    headerFrame: "border-l-[3px] border-slate-300/60 pl-4",
    sectionPadding: "p-6 sm:p-8 space-y-6",
  };
}

// ── QuestionItem ──────────────────────────────────────────────────────────────

/** Avoid showing the same copy as `section.instructions` in the question stem (directions stay in the Directions callout). */
function stripQuestionDuplicateOfInstructions(
  questionText: string | undefined,
  instructions: string | undefined | null,
): string {
  const ins = (instructions ?? "").trim();
  if (!ins) return (questionText ?? "").trim();
  const qt = (questionText ?? "").trim();
  if (!qt) return "";
  if (qt === ins) return "";
  if (qt.startsWith(ins + "\n\n")) return qt.slice(ins.length + 2).trim();
  if (qt.startsWith(ins + "\n")) return qt.slice(ins.length + 1).trim();
  return questionText ?? "";
}

function QuestionItem({
  q,
  number,
  sectionId,
  textStyle,
  globalTypo,
  mathVisual,
  sectionInstructions,
}: {
  q: any;
  number: number;
  sectionId: string;
  textStyle: any;
  globalTypo: GlobalTypography;
  mathVisual?: MathPracticeVisualId | null;
  sectionInstructions?: string | null;
}) {
  const { updateQuestion } = useBloomStore();
  /** Generated worksheets store activity id on worksheet.settings (API customize-generate). */
  const activityTemplate = useBloomStore(
    (s) => s.worksheet?.settings?.templateType as string | undefined,
  );
  const type = q.question_type || q.type || "short_answer";
  const lines = q.lines ?? (type === "essay" ? 8 : 3);
  const raw = stripQuestionDuplicateOfInstructions(
    q.text ?? q.prompt ?? "",
    sectionInstructions,
  );
  const stackedMathTemplate =
    activityTemplate === "math_practice" ||
    activityTemplate === "math_word_problems" ||
    activityTemplate === "number_bond" ||
    activityTemplate === "measurement" ||
    activityTemplate === "ten_frame";
  const showStacked = stackedMathTemplate && /\d+\s*\/\s*\d+/.test(raw);
  /** Polished stem + click-to-edit; removes duplicate raw/debug textarea from the worksheet view. */
  const usePolishedMathStem = Boolean(mathVisual) || showStacked;
  const hideListNumber = mathVisual === "fun_classroom_practice";

  const badge = questionBadgeLabel(q);
  const badgeCls = badgeClassForLabel(badge);

  const polishedStemClass =
    mathVisual != null
      ? "text-base sm:text-[1.125rem] leading-snug font-semibold text-slate-900"
      : "text-sm leading-relaxed font-medium text-slate-900";

  const stemColStyle: React.CSSProperties | undefined = usePolishedMathStem
    ? {
        fontFamily: `'${textStyle?.fontFamily ?? globalTypo.questionFont}', sans-serif`,
      }
    : undefined;

  const mathStemTextStyle = {
    ...textStyle,
    fontFamily: textStyle?.fontFamily ?? globalTypo.questionFont,
    fontSize: mathVisual != null ? 17 : 15,
    fontColor: textStyle?.fontColor ?? "#0f172a",
    bold: true,
  };

  const inner = (
    <>
      <div
        className={`flex gap-5 sm:gap-7 items-start leading-relaxed ${mathVisual ? "" : "text-sm"}`}
        style={
          !usePolishedMathStem && textStyle?.fontFamily
            ? { fontFamily: `'${textStyle.fontFamily}', sans-serif` }
            : undefined
        }
      >
        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 pt-1">
          <span className={`shrink-0 ${badgeCls}`}>{badge}</span>
          {hideListNumber ? (
            <span className="sr-only">{number}.</span>
          ) : (
            <span className="font-bold shrink-0 tabular-nums text-slate-800 min-w-[2rem] text-center text-base leading-none text-slate-700 border border-slate-200/90 rounded-lg bg-slate-50/80 px-1.5 py-1.5 print:bg-white print:border-slate-400">
              {number}.
            </span>
          )}
        </div>
        <div
          className={`flex-1 min-w-0 ${mathVisual ? "space-y-3" : "space-y-4"}`}
          style={stemColStyle}
        >
          {usePolishedMathStem ? (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <EditableTextBlock
                value={raw}
                onChange={(v: string) =>
                  updateQuestion(sectionId, q.id, { text: v, prompt: v })
                }
                multiline
                textStyle={mathStemTextStyle}
                renderView={(v: string) => (
                  <MathInlineText text={v} className={polishedStemClass} />
                )}
                subtleEditor
                hideEditHint
                className="w-full"
                placeholder="Click to add problem text…"
              />
            </div>
          ) : (
            <EditableTextBlock
              value={raw}
              onChange={(v) =>
                updateQuestion(sectionId, q.id, { text: v, prompt: v })
              }
              multiline
              alwaysEditing
              textStyle={textStyle}
              className="flex-1"
            />
          )}
          {type === "multiple_choice" &&
            Array.isArray(q.options) &&
            q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 pt-4 border-t border-dotted border-slate-300/70">
                {q.options.map((opt: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{
                      fontFamily: `'${textStyle?.fontFamily ?? globalTypo.bodyFont}', sans-serif`,
                      color: textStyle?.fontColor,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border shrink-0 mt-0.5"
                      style={{ borderColor: `${globalTypo.accentColor}60` }}
                    />
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}
          {type === "true_false" && (
            <div
              className="flex gap-6 text-sm mt-2 pt-4 border-t border-dotted border-slate-300/70"
              style={{
                fontFamily: `'${textStyle?.fontFamily ?? globalTypo.bodyFont}', sans-serif`,
                color: textStyle?.fontColor,
              }}
            >
              {["True", "False"].map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ borderColor: `${globalTypo.accentColor}60` }}
                  />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}
          {(type === "short_answer" ||
            type === "fill_in_blank" ||
            type === "essay") &&
            (mathVisual ? (
              <MathAnswerAndWork
                visual={mathVisual}
                accentColor={globalTypo.accentColor}
                lines={lines}
              />
            ) : (
              <div className="pt-4 mt-2 border-t border-dotted border-slate-300/70 [&>div]:!mt-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 flex items-center gap-1.5 print:hidden"
                  aria-hidden
                >
                  <PenLine className="w-3.5 h-3.5" strokeWidth={2.25} />
                  Your response
                </p>
                <WritingLines
                  count={lines}
                  accentColor={globalTypo.accentColor}
                  worksheetStyle
                />
              </div>
            ))}
        </div>
      </div>
    </>
  );

  if (mathVisual) {
    return <div className="space-y-2">{inner}</div>;
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/90 transition-shadow duration-200 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.1)] hover:border-slate-300/80 print:shadow-none print:hover:shadow-none print:border-slate-400 print:break-inside-avoid">
      <div className="space-y-5">{inner}</div>
    </div>
  );
}

// ── SectionBlock ──────────────────────────────────────────────────────────────

function quickGenSectionTone(
  layoutType: string | undefined,
  sectionType: string | undefined,
): string {
  const lt = normalizeQuickGenLayoutType(layoutType);
  if (!lt || !sectionType) return "";
  if (lt === "concept_practice" && sectionType === "word_bank") {
    return "rounded-xl border border-violet-200/80 bg-violet-50/50 p-3 -mx-0.5";
  }
  if (lt === "concept_practice" && sectionType === "science_short_response") {
    return "rounded-xl border border-emerald-200/80 bg-emerald-50/25 p-3 -mx-0.5";
  }
  if (lt === "diagram_label" && sectionType === "label_diagram") {
    return "rounded-xl border border-teal-200/80 bg-teal-50/35 p-3 -mx-0.5";
  }
  if (lt === "sequence_organizer" && sectionType === "sequence_chart") {
    return "rounded-xl border border-amber-200/80 bg-amber-50/30 p-3 -mx-0.5";
  }
  if (lt === "matching" && sectionType === "line_matching") {
    return "rounded-xl border border-sky-200/80 bg-sky-50/35 p-3 -mx-0.5";
  }
  return "";
}

function worksheetPaperShell(layoutType: string | undefined): string {
  const lt = normalizeQuickGenLayoutType(layoutType);
  if (lt === "diagram_label") {
    return "ring-2 ring-teal-500/18 border-l-[6px] border-l-teal-600/90 shadow-[inset_10px_0_28px_-14px_rgba(15,118,110,0.07)]";
  }
  if (lt === "concept_practice") {
    return "ring-2 ring-violet-500/16 border-l-[6px] border-l-violet-600/85 shadow-[inset_10px_0_28px_-14px_rgba(109,40,217,0.06)]";
  }
  if (lt === "sequence_organizer") {
    return "ring-2 ring-amber-500/18 border-l-[6px] border-l-amber-600/85 shadow-[inset_10px_0_28px_-14px_rgba(180,83,9,0.06)]";
  }
  if (lt === "matching") {
    return "ring-2 ring-sky-500/18 border-l-[6px] border-l-sky-600/85 shadow-[inset_10px_0_28px_-14px_rgba(2,132,199,0.06)]";
  }
  if (lt === "default") {
    return "ring-1 ring-slate-300/35 border-l-[5px] border-l-slate-500/45 shadow-[inset_8px_0_24px_-12px_rgba(15,23,42,0.04)]";
  }
  return "";
}

/** Quick Gen A/B/C rhythm for math and science_short_response (layoutRhythm mirrors mathPracticeLayout enum). */
function resolveLayoutRhythm(
  section: { layoutRhythm?: string; mathPracticeLayout?: string },
  quickGenVariant: string | undefined,
): "spacious" | "scaffolded_work_boxes" | "compact_grid" | null {
  const m = (section?.layoutRhythm || section?.mathPracticeLayout) as
    | string
    | undefined;
  if (m === "spacious" || m === "scaffolded_work_boxes" || m === "compact_grid")
    return m;
  const lv = (quickGenVariant || "A").toUpperCase();
  if (lv === "B") return "scaffolded_work_boxes";
  if (lv === "C") return "compact_grid";
  return "spacious";
}

function worksheetSectionsLayoutClass(
  layoutType: string | undefined,
  sectionCount: number,
  opts?: { layoutVariant?: string; pageTemplateType?: string },
): string {
  const lt = normalizeQuickGenLayoutType(layoutType);
  const tpl = opts?.pageTemplateType;
  const lv = (opts?.layoutVariant || "A").toUpperCase();
  if (
    lt === "concept_practice" &&
    (tpl === "math_practice" || tpl === "math_word_problems")
  ) {
    if (lv === "C") return "max-w-4xl mx-auto";
    if (lv === "B") return "max-w-3xl mx-auto space-y-2";
    return "max-w-2xl mx-auto space-y-2";
  }
  if (lt === "concept_practice" && sectionCount >= 2) {
    if (tpl === "science_concept_practice") {
      if (lv === "C")
        return "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start";
      if (lv === "B")
        return "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start";
    }
    return "grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start";
  }
  if (lt === "diagram_label") {
    if (lv === "B") return "max-w-4xl mx-auto space-y-10";
    if (lv === "C") return "max-w-3xl mx-auto space-y-8";
    return "space-y-12 max-w-3xl mx-auto";
  }
  if (lt === "sequence_organizer") {
    if (lv === "C") return "space-y-4 max-w-4xl mx-auto";
    if (lv === "B") return "space-y-6 max-w-3xl mx-auto";
    return "space-y-8";
  }
  if (lt === "matching") {
    if (lv === "C") return "max-w-5xl mx-auto space-y-4";
    if (lv === "B") return "max-w-4xl mx-auto space-y-6";
    return "max-w-4xl mx-auto space-y-8";
  }
  if (lt === "default") {
    if (lv === "C") return "space-y-6 max-w-4xl mx-auto";
    if (lv === "B") return "space-y-9 max-w-3xl mx-auto";
    return "space-y-12 max-w-3xl mx-auto";
  }
  return "space-y-12";
}

/**
 * Quick Gen layout variant (A/B/C) — extra presentation only; spacing/grid from `worksheetSectionsLayoutClass` unchanged.
 * A: airy, soft page band · B: dashed “packet” frame · C: compact inset card
 */
function quickGenVariantPresentation(
  layoutVariant: string | undefined,
): string {
  const lv = (layoutVariant || "A").toUpperCase();
  if (lv === "B") {
    return "relative rounded-2xl border-2 border-dashed border-slate-300/80 bg-slate-50/35 px-4 sm:px-6 py-5 sm:py-8 print:border-slate-400 print:bg-white";
  }
  if (lv === "C") {
    return "relative rounded-xl border border-slate-300/90 bg-white px-3 sm:px-5 py-4 sm:py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.92)] ring-1 ring-slate-200/55 print:shadow-none";
  }
  return "relative rounded-[1.25rem] px-1.5 sm:px-3 py-2 sm:py-4 bg-gradient-to-b from-slate-50/45 via-white/30 to-transparent print:bg-transparent print:py-1";
}

type SectionDragReorder = {
  onDragHandleStart: (e: React.DragEvent) => void;
  onSectionDragOver: (e: React.DragEvent) => void;
  onSectionDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  isDragging: boolean;
};

function SectionBlock({
  section,
  index,
  total,
  isActive,
  onSelect,
  onMoveUp,
  onMoveDown,
  globalTypo,
  quickGenLayoutType,
  dragReorder,
}: {
  section: any;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  globalTypo: GlobalTypography;
  quickGenLayoutType?: string;
  dragReorder?: SectionDragReorder;
}) {
  const { updateSection, updateQuestion, sectionStyles } = useBloomStore();
  const quickGenVariant = useBloomStore(
    (s) => s.worksheet?.quickGenMeta?.layoutVariant,
  ) as string | undefined;
  const useMathVisualTemplate =
    section.type === "math_practice" || section.type === "math_word_problems";
  const mathPracticeVisual = useMathVisualTemplate
    ? resolveMathPracticeVisual(quickGenVariant)
    : null;
  const mathLayout =
    section.type === "science_short_response"
      ? resolveLayoutRhythm(section, quickGenVariant)
      : null;
  const style: SectionStyle =
    sectionStyles[section.id] ?? DEFAULT_SECTION_STYLE;
  const ts = style.textStyle;
  const tone = quickGenSectionTone(quickGenLayoutType, section.type);
  const cardTheme = sectionCardTheme(section.type);
  const titleColor = ts.fontColor !== "#1a1a2e" ? ts.fontColor : undefined;

  return (
    <SectionActivationContext.Provider value={onSelect}>
    <SectionTextStyleContext.Provider value={ts}>
    <div
      className={`relative transition-all cursor-pointer mb-12 md:mb-14 print:mb-10 ${
        isActive
          ? "ring-2 ring-primary/50 ring-offset-2 rounded-2xl"
          : "hover:ring-1 hover:ring-primary/20 hover:ring-offset-1 rounded-2xl"
      } ${dragReorder?.isDragOver ? "ring-2 ring-dashed ring-primary/50 ring-offset-2 rounded-2xl" : ""} ${
        dragReorder?.isDragging ? "opacity-60" : ""
      }`}
      onClick={onSelect}
      onDragOver={dragReorder?.onSectionDragOver}
      onDrop={dragReorder?.onSectionDrop}
    >
      <div style={sectionCSS(style)} className={`rounded-2xl ${tone}`}>
        <div
          className={`rounded-2xl border-2 shadow-md print:shadow-sm ${cardTheme.border} ${cardTheme.gradient} ${cardTheme.cardEnhance} ${cardTheme.sectionPadding}`}
        >
          {/* Clipart row */}
          <ClipartRow sectionId={section.id} />

          {/* Section header — layout varies by section “personality” */}
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className={`min-w-0 flex-1 ${cardTheme.headerFrame}`}>
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight pb-4 mb-0 flex flex-wrap items-center gap-x-3 gap-y-1 w-full ${cardTheme.titleBar} ${cardTheme.titleText}`}
                style={{
                  ...headingStyle(globalTypo),
                  fontFamily: `'${ts.fontFamily !== "DM Sans" ? ts.fontFamily : globalTypo.headingFont}', sans-serif`,
                  ...(titleColor ? { color: titleColor } : {}),
                }}
              >
                <span
                  className="select-none shrink-0 text-[1.35em] leading-none"
                  aria-hidden
                >
                  {cardTheme.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <EditableTextBlock
                    value={section.title}
                    onChange={(v) => updateSection(section.id, { title: v })}
                    onFocus={onSelect}
                    onClick={onSelect}
                    alwaysEditing
                    textStyle={{
                      ...ts,
                      bold: true,
                      fontFamily:
                        ts.fontFamily !== "DM Sans"
                          ? ts.fontFamily
                          : globalTypo.headingFont,
                    }}
                  />
                </span>
              </h2>
            </div>

            {/* Reorder controls (print hidden) */}
            <div className="print:hidden flex gap-1 shrink-0 items-center">
              {dragReorder && (
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    dragReorder.onDragHandleStart(e);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    dragReorder.onDragEnd();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
                  aria-label="Drag to reorder section"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={index === total - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Instructions — teacher callout (print-friendly) */}
          {section.instructions && (
            <div
              className="flex gap-3 sm:gap-4 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-amber-50/70 to-orange-50/35 p-4 sm:p-5 shadow-sm ring-1 ring-amber-100/55 print:from-amber-50/90 print:to-amber-50/80 print:ring-amber-200/40"
              role="note"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100/90 border border-amber-200/80 shadow-sm print:bg-amber-50"
                aria-hidden
              >
                <Lightbulb
                  className="w-4 h-4 text-amber-800/75"
                  strokeWidth={2.25}
                />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-900/75"
                  style={{ fontFamily: `'${globalTypo.bodyFont}', sans-serif` }}
                >
                  Directions
                </p>
                <div className="text-sm text-foreground/90 leading-relaxed">
                  <EditableTextBlock
                    value={section.instructions}
                    onChange={(v) =>
                      updateSection(section.id, { instructions: v })
                    }
                    onFocus={onSelect}
                    onClick={onSelect}
                    multiline
                    alwaysEditing
                    textStyle={{ ...ts, italic: true }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Passage */}
          {section.type === "passage" && section.passage && (
            <div
              className="rounded-xl p-5 text-sm leading-relaxed border border-slate-200/80 bg-slate-50/40"
              style={{
                backgroundColor:
                  style.bgColor !== "transparent"
                    ? "rgba(255,255,255,0.5)"
                    : undefined,
              }}
            >
              <EditableTextBlock
                value={section.passage}
                onChange={(v) => updateSection(section.id, { passage: v })}
                onFocus={onSelect}
                onClick={onSelect}
                multiline
                alwaysEditing
                textStyle={ts}
              />
            </div>
          )}

          {/* Vocabulary */}
          {Array.isArray(section.vocabulary) &&
            section.vocabulary.length > 0 && (
              <div className="rounded-lg border border-slate-200/75 bg-slate-50/45 p-4 space-y-0 divide-y divide-slate-200/60 print:bg-white print:border-slate-300">
                {section.vocabulary.map((item: any, i: number) => (
                  <div
                    key={item.id || i}
                    className="flex gap-2 text-sm leading-relaxed py-3 first:pt-0 last:pb-0"
                    style={{
                      fontFamily: `'${ts.fontFamily}', sans-serif`,
                      fontSize: `${(ts.fontSize ?? 14) * globalTypo.baseSize}px`,
                      color: ts.fontColor,
                    }}
                  >
                    <span className="font-bold shrink-0">{i + 1}.</span>
                    <span
                      className="font-semibold"
                      style={{ color: globalTypo.headingColor }}
                    >
                      {item.word}
                    </span>
                    <span className="text-foreground/70">
                      — {item.definition}
                    </span>
                  </div>
                ))}
              </div>
            )}

          {/* Questions — math practice uses visual templates (content vs appearance) */}
          {Array.isArray(section.questions) &&
          section.questions.length > 0 &&
          useMathVisualTemplate &&
          mathPracticeVisual ? (
            <MathPracticeSectionBanner
              visual={mathPracticeVisual}
              children={
                <div
                  className={mathPracticeQuestionsStackClass(
                    mathPracticeVisual,
                  )}
                >
                  {section.questions.map((q: any, qi: number) => (
                    <React.Fragment key={q.id || qi}>
                      <MathPracticeProblemCard
                        visual={mathPracticeVisual}
                        index={qi + 1}
                        children={
                          <QuestionItem
                            q={q}
                            number={qi + 1}
                            sectionId={section.id}
                            textStyle={ts}
                            globalTypo={globalTypo}
                            mathVisual={mathPracticeVisual}
                            sectionInstructions={section.instructions}
                          />
                        }
                      />
                    </React.Fragment>
                  ))}
                </div>
              }
            />
          ) : null}

          {Array.isArray(section.questions) &&
            section.questions.length > 0 &&
            !useMathVisualTemplate && (
              <div
                className={
                  mathLayout === "compact_grid"
                    ? "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8"
                    : mathLayout === "spacious"
                      ? "mt-4 space-y-14"
                      : mathLayout === "scaffolded_work_boxes"
                        ? "mt-4 space-y-8"
                        : "space-y-8 mt-4"
                }
              >
                {section.questions.map((q: any, qi: number) => {
                  const item = (
                    <QuestionItem
                      q={q}
                      number={qi + 1}
                      sectionId={section.id}
                      textStyle={ts}
                      globalTypo={globalTypo}
                      sectionInstructions={section.instructions}
                    />
                  );
                  if (mathLayout === "scaffolded_work_boxes") {
                    return (
                      <div
                        key={q.id || qi}
                        className="rounded-xl border border-indigo-200/60 bg-indigo-50/30 p-1.5 sm:p-2 print:break-inside-avoid"
                      >
                        {item}
                      </div>
                    );
                  }
                  return (
                    <div key={q.id || qi} className="print:break-inside-avoid">
                      {item}
                    </div>
                  );
                })}
              </div>
            )}

          {/* ── Activity-specific section renderers ── */}

          {section.type === "word_practice" && (
            <WordPracticeSection
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {section.type === "word_sight_row" && (
            <WordSightRow
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {section.type === "fill_blanks" && (
            <FillBlanksSection
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {section.type === "sentence_practice" && (
            <SentencePracticeSection
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {section.type === "coloring_activity" && (
            <ColoringActivitySection
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {section.type === "tracing" && (
            <TracingSection
              section={section}
              onUpdate={(updates) => updateSection(section.id, updates)}
            />
          )}

          {/* ── Graphic Organizers ── */}
          {section.type === "mind_map" && (
            <MindMapSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "venn_diagram" && (
            <VennDiagramSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "kwl_chart" && (
            <KWLChartSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "sequence_chart" && (
            <SequenceChartSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "frayer_model" && (
            <FrayerModelSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "story_map" && (
            <StoryMapSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Writing ── */}
          {section.type === "acrostic" && (
            <AcrosticSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "mini_book" && (
            <MiniBookSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "writing_prompt_header" && (
            <WritingPromptHeader
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "word_bank" && (
            <WordBankSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "sentence_frames" && (
            <SentenceFramesSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Math ── */}
          {section.type === "number_bond" && (
            <NumberBondSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "ten_frame" && (
            <TenFrameSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "clock_practice" && (
            <ClockPracticeSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "graph_page" && (
            <GraphPageSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Science / Social Studies ── */}
          {section.type === "label_diagram" && (
            <LabelDiagramSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "observation_sheet" && (
            <ObservationSheetSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "timeline" && (
            <TimelineSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Matching / Sorting ── */}
          {section.type === "line_matching" && (
            <LineMatchingSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "cut_and_sort" && (
            <CutAndSortSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "picture_sort" && (
            <PictureSortSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Games ── */}
          {section.type === "bingo_card" && (
            <BingoCardSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "word_search_full" && (
            <FullWordSearchSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "crossword" && (
            <CrosswordSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "spinner" && (
            <SpinnerSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "dice_activity" && (
            <DiceActivitySection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}

          {/* ── Coloring ── */}
          {section.type === "coloring_page" && (
            <ColoringPageSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
          {section.type === "color_by_code" && (
            <ColorByCodeSection
              section={section}
              onUpdate={(u) => updateSection(section.id, u)}
            />
          )}
        </div>
      </div>

      {/* Active section indicator */}
      {isActive && (
        <div className="print:hidden absolute -top-3 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Pencil className="w-2.5 h-2.5" />
          Editing
        </div>
      )}
    </div>
    </SectionTextStyleContext.Provider>
    </SectionActivationContext.Provider>
  );
}

// ── Result page ───────────────────────────────────────────────────────────────

export function Result() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const {
    worksheet,
    settings,
    worksheetPageStyle,
    globalTypography,
    activeSectionId,
    setActiveSection,
    updateSection,
    reset,
  } = useBloomStore();

  const clearSectionSelection = () => setActiveSection(null);

  const editorReturnToQuickGen = useBloomStore((s) => s.editorReturnToQuickGen);
  const quickGenSession = useBloomStore((s) => s.quickGenSession);
  const mergeWorksheetIntoQuickGenOption = useBloomStore(
    (s) => s.mergeWorksheetIntoQuickGenOption,
  );
  const setEditorReturnToQuickGen = useBloomStore(
    (s) => s.setEditorReturnToQuickGen,
  );

  const {
    createSet,
    editingVersionId,
    setEditingVersion,
    activeSet,
    updateVersionContent,
    markManuallyOverridden,
    pendingLevels,
    materializePendingSet,
  } = useDifferentiationStore();

  const handleDifferentiate = () => {
    if (!worksheet) return;
    createSet(worksheet.title || "Differentiated Set", worksheet);
    setLocation("/differentiate");
  };

  const breadcrumbBack = editingVersionId && activeSet;

  const handleBreadcrumbBack = () => {
    if (editingVersionId && worksheet) {
      updateVersionContent(editingVersionId, worksheet, []);
      const editedVersion = activeSet?.versions.find(
        (v) => v.id === editingVersionId,
      );
      if (editedVersion && !editedVersion.isAnchor) {
        markManuallyOverridden(editingVersionId);
      }
    }
    setEditingVersion(null);
    setLocation("/differentiate");
  };

  // Only redirect to home if there truly is no worksheet at all.
  // This avoids unexpected redirects when navigating back/forward
  // while preserving the current draft in memory.
  useEffect(() => {
    if (!worksheet) {
      setLocation("/");
    }
  }, [worksheet, setLocation]);

  useEffect(() => {
    if (worksheet && pendingLevels && pendingLevels.length > 0) {
      materializePendingSet(
        worksheet.title || "Differentiated Worksheet",
        worksheet,
      );
    }
  }, [worksheet, pendingLevels, materializePendingSet]);

  useEffect(() => {
    if (!worksheet) return;
    const p = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const sid = p.get("sessionId");
    const lid = p.get("layoutId");
    if (!sid && !lid) return;
    useBloomStore.setState((s) => ({
      worksheet: s.worksheet
        ? {
            ...s.worksheet,
            quickGenMeta: {
              ...(s.worksheet.quickGenMeta || {}),
              ...(sid ? { sessionId: sid } : {}),
              ...(lid ? { layoutId: lid } : {}),
            },
          }
        : null,
    }));
  }, [worksheet?.worksheet_id]);

  if (!worksheet) return null;

  const sections: any[] = worksheet.sections ?? [];
  const typo = globalTypography;

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const newSections = [...sections];
    [newSections[idx], newSections[target]] = [
      newSections[target],
      newSections[idx],
    ];
    useBloomStore.setState((s) => ({
      worksheet: { ...s.worksheet, sections: newSections },
      hasEdited: true,
    }));
  };

  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(
    null,
  );
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(
    null,
  );

  const reorderSection = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    if (fromIdx < 0 || toIdx < 0) return;
    if (fromIdx >= sections.length || toIdx >= sections.length) return;
    const newSections = [...sections];
    const [item] = newSections.splice(fromIdx, 1);
    newSections.splice(toIdx, 0, item);
    useBloomStore.setState((s) => ({
      worksheet: { ...s.worksheet, sections: newSections },
      hasEdited: true,
    }));
  };

  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData(
      "application/x-bloomstyl-section-index",
      String(index),
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggingSectionIndex(index);
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverSectionIndex(index);
  };

  const handleSectionDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const fromStr = e.dataTransfer.getData(
      "application/x-bloomstyl-section-index",
    );
    const from = parseInt(fromStr, 10);
    setDraggingSectionIndex(null);
    setDragOverSectionIndex(null);
    if (Number.isNaN(from) || from === dropIndex) return;
    reorderSection(from, dropIndex);
  };

  const handleSectionDragEnd = () => {
    setDraggingSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  // Title wrapper for decorative heading style
  const {
    containerClass,
    containerStyle,
    textStyle: titleTextStyle,
  } = getHeadingCSS(typo.titleHeadingStyle, typo.accentColor);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* ── Main scroll area ── */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-16">
        {/* Action bar */}
        <div className="print:hidden sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
          <div className="max-w-[860px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {breadcrumbBack ? (
                <button
                  onClick={handleBreadcrumbBack}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Differentiation Panel
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      reset();
                      setLocation("/");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New
                  </button>
                  <button
                    onClick={() => {
                      if (
                        editorReturnToQuickGen &&
                        quickGenSession &&
                        worksheet
                      ) {
                        mergeWorksheetIntoQuickGenOption(
                          quickGenSession.selectedLayout,
                          worksheet,
                        );
                        setEditorReturnToQuickGen(false);
                        setQuickGenResumeSession(true);
                        const returnPath = consumeQuickGenReturnPath();
                        if (returnPath) {
                          setLocation(returnPath);
                          return;
                        }
                        const sid = getQuickGenSessionId();
                        if (sid && quickGenSession.sessionId === sid) {
                          window.history.back();
                          return;
                        }
                        setLocation(`${BASE}/prompt`);
                        return;
                      }
                      setLocation(`${BASE}/prompt`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {editorReturnToQuickGen ? "Back to options" : "Settings"}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                <Pencil className="w-3 h-3 text-primary" />
                Click any section or text to edit
              </div>
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold border transition-colors text-sm ${
                  sidebarOpen
                    ? "bg-primary text-white border-primary"
                    : "text-foreground border-border hover:bg-muted/60"
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                {sidebarOpen ? "Hide Editor" : "Open Editor"}
              </button>
              {!breadcrumbBack && activeSet && (
                <button
                  onClick={() => setLocation("/differentiate")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold border border-primary/30 hover:bg-primary/20 transition-colors text-sm animate-pulse"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Go to Differentiation Panel ({activeSet.versions.length}{" "}
                  versions)
                </button>
              )}
              {!breadcrumbBack && !activeSet && (
                <button
                  onClick={handleDifferentiate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-primary font-semibold hover:bg-primary/5 border border-primary/30 transition-colors text-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Differentiate This
                </button>
              )}
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="print:hidden max-w-[860px] mx-auto px-4 pt-5 pb-2">
          <StepIndicator current={4} />
        </div>

        {/* ── Worksheet paper ── */}
        <div
          id="worksheet-paper"
          className={`max-w-[860px] mx-auto sm:my-5 bg-white sm:rounded-2xl sm:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] print:shadow-none print:rounded-none print:my-0 ${worksheetPaperShell(worksheet.quickGenMeta?.layoutType)}`}
          style={{ backgroundColor: worksheetPageStyle.bgColor }}
          onClick={() => setActiveSection(null)}
        >
          <div className="relative p-8 sm:p-14 print:p-0 space-y-1 sm:bg-[linear-gradient(180deg,rgba(248,250,252,0.7)_0%,rgba(255,255,255,0)_4.5rem)] print:bg-transparent">
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent print:hidden"
              aria-hidden
            />

            {/* Name / Date header */}
            <div className="flex gap-8 justify-end mb-4">
              {settings.includeName && (
                <div className="flex-1 max-w-[260px]">
                  <p
                    className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    Name
                  </p>
                  <div
                    className="border-b h-6"
                    style={{ borderColor: `${typo.accentColor}50` }}
                  />
                </div>
              )}
              {settings.includeDate && (
                <div className="w-36">
                  <p
                    className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    Date
                  </p>
                  <div
                    className="border-b h-6"
                    style={{ borderColor: `${typo.accentColor}50` }}
                  />
                </div>
              )}
            </div>

            {/* Worksheet title — “resource” presentation (print-safe) */}
            <div className="relative text-center pb-8 mb-10 sm:mb-14">
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[min(90%,26rem)] h-px bg-gradient-to-r from-transparent via-slate-400/35 to-transparent pointer-events-none print:hidden"
                aria-hidden
              />
              <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/85 bg-gradient-to-b from-white via-slate-50/35 to-white px-5 py-9 sm:px-12 sm:py-11 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/90 print:shadow-none print:ring-0 print:border-slate-300 print:bg-white print:py-8">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-3 flex items-center justify-center gap-2 print:hidden"
                  aria-hidden
                >
                  <Sparkles
                    className="w-3.5 h-3.5 text-amber-500/85"
                    strokeWidth={2.25}
                  />
                  Worksheet
                </p>
                <div
                  className="border-b-2 border-dotted pb-6 mx-auto max-w-xl"
                  style={{ borderBottomColor: `${typo.accentColor}55` }}
                >
                  <div
                    className={`${containerClass} inline-block w-full`}
                    style={containerStyle}
                  >
                    <h1
                      className="text-3xl sm:text-[2.1rem] font-bold tracking-tight leading-tight"
                      style={{
                        fontFamily: `'${typo.titleFont}', sans-serif`,
                        color: typo.titleColor,
                        ...titleTextStyle,
                      }}
                    >
                      <EditableTextBlock
                        value={worksheet.title}
                        onChange={(v) =>
                          useBloomStore.setState((s) => ({
                            worksheet: { ...s.worksheet, title: v },
                          }))
                        }
                        onFocus={clearSectionSelection}
                        alwaysEditing
                        textStyle={{
                          bold: true,
                          fontFamily: typo.titleFont,
                          fontSize: 28,
                          fontColor: typo.titleColor,
                          alignment: "center",
                          italic: false,
                          underline: false,
                          listStyle: "none",
                        }}
                      />
                    </h1>
                  </div>
                </div>
                {(worksheet.subject || worksheet.gradeLevel) && (
                  <p
                    className="text-sm sm:text-[0.95rem] text-foreground/50 font-medium mt-5 tracking-wide"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    {[
                      worksheet.subject
                        ? normalizeFormalLabel(String(worksheet.subject))
                        : "",
                      worksheet.gradeLevel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {/* Sections — layout shell + grid/column rhythm from Quick Gen layoutType */}
            <div
              className={`${worksheetSectionsLayoutClass(
                worksheet.quickGenMeta?.layoutType,
                sections.length,
                {
                  layoutVariant: worksheet.quickGenMeta?.layoutVariant,
                  pageTemplateType: worksheet.settings?.templateType as
                    | string
                    | undefined,
                },
              )} ${quickGenVariantPresentation(worksheet.quickGenMeta?.layoutVariant)}`}
              onClick={(e) => e.stopPropagation()}
            >
              {sections.map((section: any, i: number) => (
                <React.Fragment key={section.id || i}>
                  <motion.div layout>
                    <SectionBlock
                      section={section}
                      index={i}
                      total={sections.length}
                      isActive={activeSectionId === section.id}
                      onSelect={() => setActiveSection(section.id)}
                      onMoveUp={() => moveSection(i, -1)}
                      onMoveDown={() => moveSection(i, 1)}
                      globalTypo={typo}
                      quickGenLayoutType={normalizeQuickGenLayoutType(
                        worksheet.quickGenMeta?.layoutType,
                      )}
                      dragReorder={{
                        onDragHandleStart: (e) =>
                          handleSectionDragStart(e, i),
                        onSectionDragOver: (e) =>
                          handleSectionDragOver(e, i),
                        onSectionDrop: (e) => handleSectionDrop(e, i),
                        onDragEnd: handleSectionDragEnd,
                        isDragOver: dragOverSectionIndex === i,
                        isDragging: draggingSectionIndex === i,
                      }}
                    />
                  </motion.div>
                  {i < sections.length - 1 && (
                    <div
                      className="my-6 sm:my-8 flex items-center gap-3 print:my-5"
                      aria-hidden
                    >
                      <div className="h-px flex-1 border-t border-dotted border-slate-300/80 print:border-slate-400" />
                      <div className="h-1 w-1 rounded-full bg-slate-300/70 print:bg-slate-500" />
                      <div className="h-px flex-1 border-t border-dotted border-slate-300/80 print:border-slate-400" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Answer Key */}
            {settings.generateAnswerKey &&
              worksheet.answer_key &&
              Object.keys(worksheet.answer_key).length > 0 && (
                <div className="mt-16 pt-10 border-t-2 border-dashed border-foreground/25 space-y-4 rounded-xl bg-slate-50/50 p-5 sm:p-6 ring-1 ring-slate-200/60 print:bg-white print:ring-slate-300">
                  <h2
                    className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5"
                    style={{
                      fontFamily: `'${typo.headingFont}', sans-serif`,
                      color: typo.headingColor,
                    }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/90 border border-emerald-200/80 print:border-slate-400">
                      <Check
                        className="w-4 h-4 text-emerald-700"
                        strokeWidth={2.5}
                      />
                    </span>
                    Answer Key
                  </h2>
                  <div
                    className="space-y-2.5 text-sm leading-relaxed"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    {Object.entries(worksheet.answer_key).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="font-semibold w-8">{k}.</span>
                        <span className="text-foreground/80">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ── Editor sidebar ── */}
      <EditorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Export modal ── */}
      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          worksheetTitle={worksheet.title}
        />
      )}
    </div>
  );
}
