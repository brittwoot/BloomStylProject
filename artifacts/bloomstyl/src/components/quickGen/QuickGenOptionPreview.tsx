/**
 * Small schematic previews for Quick Gen option cards — driven by planner activityType
 * and API layoutType so options read as different worksheet types, not style variants.
 */

import React from "react";
import { StackedFraction } from "../math/StackedFraction";

export type QuickGenPreviewKind =
  | "diagram"
  | "sequence"
  | "matching"
  | "concept_practice"
  | "math_equations"
  | "number_bond"
  | "math_word_problems"
  | "data_graph"
  | "writing"
  | "mind_map"
  | "venn"
  | "kwl"
  | "story_map"
  | "frayer"
  | "word_search"
  | "sorting"
  | "timeline"
  | "bingo"
  | "coloring"
  | "mini_book"
  | "acrostic"
  | "generic";

function normLt(lt: string | undefined): string | undefined {
  if (!lt) return undefined;
  if (lt === "sequence_sort") return "sequence_organizer";
  return lt;
}

/**
 * Prefer activityType (Quick Gen planner / resolved slot) so e.g. math_practice
 * does not look like science concept_practice when API maps both to layout "concept_practice".
 */
export function resolveQuickGenPreviewKind(
  layoutType: string | undefined,
  activityType: string | undefined,
): QuickGenPreviewKind {
  const act = activityType?.trim();
  const lt = normLt(layoutType);

  if (act) {
    if (act === "math_practice") return "math_equations";
    if (act === "math_word_problems" || act === "measurement")
      return "math_word_problems";
    if (act === "ten_frame" || act === "clock_practice")
      return "math_equations";
    if (act === "number_bond") return "number_bond";
    if (act === "graph_page") return "data_graph";
    if (act === "label_diagram" || act === "map_activity") return "diagram";
    if (act === "observation_sheet") return "concept_practice";
    if (act === "sequence_chart") return "sequence";
    if (act === "line_matching") return "matching";
    if (act === "science_concept_practice") return "concept_practice";
    if (act === "writing_prompt") return "writing";
    if (act === "sentence_frames") return "writing";
    if (act === "mind_map") return "mind_map";
    if (act === "venn_diagram") return "venn";
    if (act === "kwl_chart") return "kwl";
    if (act === "story_map") return "story_map";
    if (act === "frayer_model") return "frayer";
    if (act === "word_search") return "word_search";
    if (act === "cut_and_sort" || act === "picture_sort") return "sorting";
    if (act === "timeline") return "timeline";
    if (act === "bingo_card") return "bingo";
    if (
      act === "coloring_page" ||
      act === "color_by_code" ||
      act === "trace_and_color"
    )
      return "coloring";
    if (act === "mini_book") return "mini_book";
    if (act === "acrostic") return "acrostic";
    if (act === "dice_activity" || act === "spinner" || act === "crossword")
      return "generic";
  }

  if (lt === "diagram_label") return "diagram";
  if (lt === "sequence_organizer") return "sequence";
  if (lt === "matching") return "matching";
  if (lt === "concept_practice") return "concept_practice";
  if (lt === "word_problems") return "math_word_problems";
  if (lt === "data_representation") return "data_graph";
  if (lt === "constructed_response" || lt === "scaffolded_writing")
    return "writing";
  if (lt === "comprehension") return "story_map";
  if (lt === "vocabulary_review") return "frayer";
  if (lt === "inquiry_chart") return "kwl";
  if (lt === "compare_contrast") return "venn";
  if (lt === "graphic_organizer") return "mind_map";
  if (lt === "word_hunt") return "word_search";
  if (lt === "sorting") return "sorting";
  if (lt === "process_explanation") return "timeline";
  if (lt === "game_grid") return "bingo";
  if (lt === "visual_activity" || lt === "visual_practice") return "coloring";
  if (lt === "multi_page_project") return "mini_book";

  return "generic";
}

const shell =
  "rounded-lg border border-foreground/10 bg-white/90 overflow-hidden";

function DiagramPreview({ variant = "A" }: { variant?: "A" | "B" | "C" }) {
  if (variant === "B") {
    return (
      <div className={`${shell} p-2 h-[76px] flex gap-1.5`}>
        <div className="flex-[1.1] flex flex-col items-center justify-center gap-0.5 rounded border border-teal-500/55 bg-teal-50 min-h-0">
          <div className="w-10 h-8 rounded-sm border border-teal-600/40 bg-white/80" />
          <div className="text-[6px] text-teal-800 font-bold">1–4</div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1 pr-0.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex items-center gap-0.5 text-[7px] text-muted-foreground"
            >
              <span className="font-mono text-teal-700">{n}.</span>
              <div className="flex-1 h-1.5 border-b border-foreground/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (variant === "C") {
    return (
      <div className={`${shell} p-2 h-[76px] flex flex-col gap-1`}>
        <div className="relative flex-1 rounded border border-teal-500/45 bg-teal-50/90 min-h-0">
          <span className="absolute -top-1 left-2 w-3 h-3 rounded-full bg-teal-600 text-white text-[6px] font-bold flex items-center justify-center">
            1
          </span>
          <span className="absolute -top-1 right-3 w-3 h-3 rounded-full bg-teal-600 text-white text-[6px] font-bold flex items-center justify-center">
            2
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-teal-600 text-white text-[6px] font-bold flex items-center justify-center">
            3
          </span>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          <div className="h-1.5 rounded bg-muted/50" />
          <div className="h-1.5 rounded bg-muted/50" />
          <div className="h-1.5 rounded bg-muted/50" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${shell} p-2 h-[76px] flex flex-col gap-1 justify-between`}
    >
      <div className="flex justify-center">
        <div className="w-20 h-11 rounded-lg border-2 border-teal-500/55 bg-teal-50 flex items-center justify-center">
          <span className="text-[7px] text-teal-800 font-semibold">
            diagram
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-0.5 justify-center">
        {["a", "b", "c"].map((x) => (
          <div
            key={x}
            className="text-[6px] px-1 py-0.5 rounded border border-teal-200 bg-white text-teal-900"
          >
            term
          </div>
        ))}
      </div>
    </div>
  );
}

function SequencePreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-stretch gap-1.5`}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="flex-1 flex flex-col items-center gap-1 min-w-0"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/90 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            {n}
          </div>
          <div className="w-full h-6 rounded border border-amber-200/80 bg-amber-50/50" />
        </div>
      ))}
    </div>
  );
}

function MatchingPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex gap-0`}>
      <div className="flex-1 flex flex-col justify-center gap-2 pr-2 border-r border-sky-300/60">
        <div className="h-2 rounded bg-sky-200/85" />
        <div className="h-2 rounded bg-sky-200/70" />
        <div className="h-2 rounded bg-sky-200/75" />
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2 pl-2 relative">
        <span
          className="absolute left-0 top-[14px] text-[10px] text-sky-500 select-none"
          aria-hidden
        >
          ╱
        </span>
        <span
          className="absolute left-0 top-[30px] text-[10px] text-sky-500 select-none"
          aria-hidden
        >
          —
        </span>
        <span
          className="absolute left-0 top-[46px] text-[10px] text-sky-500 select-none"
          aria-hidden
        >
          ╲
        </span>
        <div className="h-2 rounded bg-sky-100 border border-sky-300/50" />
        <div className="h-2 rounded bg-sky-100 border border-sky-300/50" />
        <div className="h-2 rounded bg-sky-100 border border-sky-300/50" />
      </div>
    </div>
  );
}

function ConceptPracticePreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex flex-col gap-1.5`}>
      <div className="flex flex-wrap gap-1">
        {["term", "idea", "vocab"].map((w) => (
          <span
            key={w}
            className="text-[7px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800 font-medium border border-violet-200"
          >
            {w}
          </span>
        ))}
      </div>
      <div className="space-y-1 flex-1 flex flex-col justify-center">
        <div className="h-2 rounded bg-foreground/8" />
        <div className="h-2 rounded bg-foreground/8 w-4/5" />
      </div>
    </div>
  );
}

/** Stacked fractions + equation blanks — math_practice */
function MathPracticeStackedPreview({
  variant = "A",
}: {
  variant?: "A" | "B" | "C";
}) {
  if (variant === "B") {
    return (
      <div
        className={`${shell} p-2 h-[76px] flex flex-col gap-1.5 justify-center`}
      >
        <div className="rounded-md border border-orange-300/80 bg-orange-50/50 px-1.5 py-1 space-y-0.5">
          <div className="text-[6px] font-bold text-orange-800/80 uppercase tracking-tighter">
            Problem 1
          </div>
          <div className="flex items-center gap-0.5 justify-center">
            <StackedFraction
              numerator="1"
              denominator="2"
              className="text-[8px]"
            />
            <span className="font-mono text-[8px]">+</span>
            <span className="w-5 h-4 rounded border border-dashed border-orange-400/60 bg-white" />
          </div>
        </div>
        <div className="rounded-md border border-orange-300/80 bg-orange-50/50 px-1.5 py-1">
          <div className="text-[6px] font-bold text-orange-800/80 uppercase tracking-tighter">
            Problem 2
          </div>
          <div className="h-3 border-b border-orange-200/80 mt-0.5" />
        </div>
      </div>
    );
  }
  if (variant === "C") {
    return (
      <div className={`${shell} p-1.5 h-[76px] grid grid-cols-2 gap-1`}>
        <div className="flex flex-col justify-center gap-0.5 rounded border border-orange-200/90 bg-white px-1">
          <div className="h-1 w-full rounded bg-foreground/10" />
          <div className="h-4 border-b-2 border-dashed border-orange-300/60" />
        </div>
        <div className="flex flex-col justify-center gap-0.5 rounded border border-orange-200/90 bg-white px-1">
          <div className="h-1 w-full rounded bg-foreground/10" />
          <div className="h-4 border-b-2 border-dashed border-orange-300/60" />
        </div>
        <div className="flex flex-col justify-center gap-0.5 rounded border border-orange-200/90 bg-white px-1 col-span-2">
          <div className="h-1 w-2/3 rounded bg-foreground/10" />
          <div className="h-3 border-b border-orange-200/70" />
        </div>
      </div>
    );
  }
  return (
    <div className={`${shell} p-2 h-[76px] flex flex-col justify-center gap-3`}>
      <div className="flex items-center justify-around gap-1 text-[10px] text-foreground/85">
        <div className="flex items-center gap-0.5">
          <StackedFraction
            numerator="1"
            denominator="2"
            className="text-[9px]"
          />
          <span className="font-mono">+</span>
          <StackedFraction
            numerator="1"
            denominator="4"
            className="text-[9px]"
          />
          <span className="font-mono">=</span>
          <span className="w-6 h-5 rounded border border-dashed border-orange-400/70 bg-orange-50/80" />
        </div>
      </div>
      <div className="flex items-center justify-around gap-2">
        <div className="flex items-center gap-1 font-mono text-[9px] text-foreground/75">
          <span>□</span>
          <span>×</span>
          <span>□</span>
          <span>=</span>
          <span className="w-7 h-4 rounded border-b-2 border-foreground/25" />
        </div>
        <div className="flex items-center gap-0.5">
          <StackedFraction
            numerator="3"
            denominator="5"
            className="text-[9px]"
          />
          <span className="font-mono text-[9px]">−</span>
          <StackedFraction
            numerator="1"
            denominator="5"
            className="text-[9px]"
          />
        </div>
      </div>
    </div>
  );
}

function MathEquationsPreview({
  variant = "A",
}: {
  variant?: "A" | "B" | "C";
}) {
  return <MathPracticeStackedPreview variant={variant} />;
}

/** Number bond: one whole, two parts */
function NumberBondMiniPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-9 h-9 rounded-full border-2 border-violet-500/75 bg-violet-50 flex items-center justify-center text-[10px] font-bold text-violet-900">
          10
        </div>
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-full border-2 border-violet-400/70 bg-white text-[9px] flex items-center justify-center font-semibold text-violet-800">
            6
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-violet-400/70 bg-white text-[9px] flex items-center justify-center font-semibold text-violet-800">
            ?
          </div>
        </div>
      </div>
    </div>
  );
}

function TenFrameMiniPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-center justify-center`}>
      <div className="grid grid-cols-5 gap-0.5 p-1 rounded border border-slate-400/50 bg-slate-50">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${i < 6 ? "bg-slate-600/85" : "border border-slate-300 bg-white"}`}
          />
        ))}
      </div>
    </div>
  );
}

function MathWordProblemsPreview({
  variant = "A",
}: {
  variant?: "A" | "B" | "C";
}) {
  if (variant === "B") {
    return (
      <div
        className={`${shell} p-2 h-[76px] flex flex-col gap-1 justify-center`}
      >
        <div className="rounded border border-amber-300/80 bg-amber-50/60 p-1 space-y-0.5">
          <div className="text-[6px] font-bold text-amber-900/80">
            Problem 1
          </div>
          <div className="h-1 rounded bg-foreground/12 w-full" />
          <div className="h-1 rounded bg-foreground/10 w-[80%]" />
        </div>
        <div className="rounded border border-amber-300/80 bg-amber-50/60 p-1">
          <div className="text-[6px] font-bold text-amber-900/80">
            Problem 2
          </div>
          <div className="h-3 border-b border-amber-200/90 mt-0.5" />
        </div>
      </div>
    );
  }
  if (variant === "C") {
    return (
      <div className={`${shell} p-1.5 h-[76px] grid grid-cols-2 gap-1`}>
        <div className="rounded border border-amber-200/90 p-1 space-y-0.5">
          <div className="h-1 rounded bg-foreground/10 w-full" />
          <div className="h-4 border-b border-dashed border-amber-400/50" />
        </div>
        <div className="rounded border border-amber-200/90 p-1 space-y-0.5">
          <div className="h-1 rounded bg-foreground/10 w-full" />
          <div className="h-4 border-b border-dashed border-amber-400/50" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${shell} p-2 h-[76px] flex flex-col gap-1.5 justify-between`}
    >
      <div className="space-y-1">
        <div className="rounded border border-orange-200/80 bg-orange-50/50 p-1.5 space-y-0.5">
          <div className="h-1 rounded bg-foreground/12 w-full" />
          <div className="h-1 rounded bg-foreground/10 w-[88%]" />
          <div className="h-1 rounded bg-foreground/8 w-[65%]" />
        </div>
        <div className="rounded border border-orange-200/80 bg-orange-50/50 p-1.5 space-y-0.5">
          <div className="h-1 rounded bg-foreground/12 w-[95%]" />
          <div className="h-1 rounded bg-foreground/10 w-[72%]" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1 h-5 border-b-2 border-dashed border-orange-400/50" />
        <span className="text-[7px] text-orange-700 font-semibold shrink-0">
          answer
        </span>
      </div>
    </div>
  );
}

function DataGraphPreview() {
  return (
    <div
      className={`${shell} p-2 h-[76px] flex items-end gap-1 justify-center`}
    >
      {[40, 65, 35, 80, 50].map((h, i) => (
        <div
          key={i}
          className="w-3 rounded-t bg-emerald-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function WritingPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex flex-col gap-1`}>
      <div className="h-2 w-3/4 rounded bg-foreground/12" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-1.5 rounded bg-foreground/6 w-full" />
      ))}
    </div>
  );
}

function MindMapPreview() {
  return (
    <div
      className={`${shell} p-2 h-[76px] relative flex items-center justify-center`}
    >
      <div className="w-10 h-6 rounded-full border-2 border-indigo-400/70 bg-indigo-50 text-[7px] flex items-center justify-center font-bold text-indigo-800">
        topic
      </div>
      <div className="absolute top-1 right-2 w-6 h-3 rounded border border-indigo-200 text-[6px] flex items-center justify-center bg-white">
        a
      </div>
      <div className="absolute bottom-2 left-2 w-6 h-3 rounded border border-indigo-200 text-[6px] flex items-center justify-center bg-white">
        b
      </div>
    </div>
  );
}

function VennPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-center justify-center`}>
      <div className="relative w-[88px] h-[52px]">
        <div className="absolute left-2 top-2 w-10 h-10 rounded-full border-2 border-rose-400/60 bg-rose-50/50" />
        <div className="absolute right-2 top-2 w-10 h-10 rounded-full border-2 border-sky-400/60 bg-sky-50/50" />
      </div>
    </div>
  );
}

function KwlPreview() {
  return (
    <div
      className={`${shell} p-1.5 h-[76px] grid grid-cols-3 gap-1 text-[7px] font-bold`}
    >
      {["K", "W", "L"].map((c) => (
        <div
          key={c}
          className="rounded border border-blue-200 bg-blue-50/40 flex flex-col p-1 gap-1"
        >
          <span className="text-blue-800">{c}</span>
          <div className="flex-1 rounded bg-white/80 border border-blue-100/80" />
        </div>
      ))}
    </div>
  );
}

function StoryMapPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] grid grid-cols-2 gap-1`}>
      {["set", "plot", "char", "theme"].map((k) => (
        <div
          key={k}
          className="rounded border border-blue-200/60 bg-blue-50/30 text-[7px] p-1 font-medium text-blue-900"
        >
          {k}
        </div>
      ))}
    </div>
  );
}

function FrayerPreview() {
  return (
    <div
      className={`${shell} p-1 h-[76px] grid grid-cols-2 grid-rows-2 gap-0.5`}
    >
      {["def", "ex", "non", "ill"].map((k) => (
        <div
          key={k}
          className="rounded border border-indigo-200/50 bg-indigo-50/40 text-[6px] flex items-center justify-center font-medium text-indigo-900"
        >
          {k}
        </div>
      ))}
    </div>
  );
}

function WordSearchPreview() {
  return (
    <div
      className={`${shell} p-1.5 h-[76px] grid grid-cols-5 gap-px bg-foreground/15`}
    >
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="bg-white text-[6px] flex items-center justify-center font-mono text-foreground/40"
        >
          {String.fromCharCode(65 + (i % 6))}
        </div>
      ))}
    </div>
  );
}

function SortingPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex gap-2`}>
      <div className="flex-1 rounded border border-dashed border-amber-400/60 bg-amber-50/30 flex flex-col gap-1 p-1">
        <div className="h-2 bg-amber-200/50 rounded" />
        <div className="h-2 bg-amber-200/40 rounded" />
      </div>
      <div className="flex-1 rounded border border-dashed border-lime-400/60 bg-lime-50/30 flex flex-col gap-1 p-1">
        <div className="h-2 bg-lime-200/50 rounded" />
        <div className="h-2 bg-lime-200/40 rounded" />
      </div>
    </div>
  );
}

function TimelinePreview() {
  return (
    <div
      className={`${shell} p-2 h-[76px] flex flex-col justify-center gap-1.5`}
    >
      <div className="h-0.5 bg-foreground/20 relative">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400 border border-white shadow"
            style={{ left: `${20 + i * 32}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[6px] text-muted-foreground px-1">
        <span>t₁</span>
        <span>t₂</span>
        <span>t₃</span>
      </div>
    </div>
  );
}

function BingoPreview() {
  return (
    <div className={`${shell} p-1.5 h-[76px] grid grid-cols-3 gap-0.5`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="rounded border border-pink-300/40 bg-pink-50/50 min-h-[18px]"
        />
      ))}
    </div>
  );
}

function ColoringPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-center justify-center`}>
      <div className="w-14 h-14 rounded-full border-4 border-fuchsia-300/70 border-dashed bg-fuchsia-50/40" />
    </div>
  );
}

function MiniBookPreview() {
  return (
    <div
      className={`${shell} p-2 h-[76px] flex items-center justify-center gap-2`}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-5 h-12 rounded-sm border border-foreground/20 bg-white shadow-sm"
          style={{ transform: `translateX(${i * -2}px)` }}
        />
      ))}
    </div>
  );
}

function AcrosticPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex items-start gap-1 font-mono`}>
      {["W", "O", "R", "D"].map((letter, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-bold text-violet-700">
            {letter}
          </span>
          <div className="w-4 h-8 border-b border-foreground/20" />
        </div>
      ))}
    </div>
  );
}

function GenericPreview() {
  return (
    <div className={`${shell} p-2 h-[76px] flex flex-col gap-1 justify-center`}>
      <div className="h-2 rounded bg-foreground/10 w-2/3" />
      <div className="grid grid-cols-2 gap-1">
        <div className="h-8 rounded border border-foreground/10 bg-muted/20" />
        <div className="h-8 rounded border border-foreground/10 bg-muted/20" />
      </div>
    </div>
  );
}

function previewForActivity(
  activityType: string | undefined,
  layoutType: string | undefined,
  layoutVariant: "A" | "B" | "C" = "A",
): React.ReactNode | null {
  const act = activityType?.trim();
  const v = layoutVariant;
  if (!act) return null;
  if (act === "math_practice")
    return <MathPracticeStackedPreview variant={v} />;
  if (act === "number_bond") return <NumberBondMiniPreview />;
  if (act === "ten_frame") return <TenFrameMiniPreview />;
  if (act === "math_word_problems" || act === "measurement")
    return <MathWordProblemsPreview variant={v} />;
  if (
    act === "label_diagram" ||
    act === "map_activity" ||
    act === "observation_sheet"
  )
    return <DiagramPreview variant={v} />;
  if (act === "sequence_chart" || act === "timeline")
    return <SequencePreview />;
  if (act === "line_matching") return <MatchingPreview />;
  if (act === "cut_and_sort") return <SortingPreview />;
  if (act === "word_search") return <WordSearchPreview />;
  if (act === "graph_page") return <DataGraphPreview />;
  const lt = layoutType?.trim();
  if (lt === "word_problems") return <MathWordProblemsPreview variant={v} />;
  if (lt === "data_representation") return <DataGraphPreview />;
  return null;
}

export function QuickGenOptionMiniPreview({
  kind,
  activityType,
  layoutType,
  layoutVariant = "A",
  className = "",
}: {
  kind: QuickGenPreviewKind;
  /** When set, selects a layout-specific schematic before falling back to kind. */
  activityType?: string;
  layoutType?: string;
  /** Quick Gen A/B/C — changes wireframe for diagram & math families. */
  layoutVariant?: "A" | "B" | "C";
  className?: string;
}) {
  const inner = (() => {
    const byAct = previewForActivity(activityType, layoutType, layoutVariant);
    if (byAct) return byAct;
    switch (kind) {
      case "diagram":
        return <DiagramPreview variant={layoutVariant} />;
      case "sequence":
        return <SequencePreview />;
      case "matching":
        return <MatchingPreview />;
      case "concept_practice":
        return <ConceptPracticePreview />;
      case "math_equations":
        return <MathEquationsPreview variant={layoutVariant} />;
      case "number_bond":
        return <NumberBondMiniPreview />;
      case "math_word_problems":
        return <MathWordProblemsPreview variant={layoutVariant} />;
      case "data_graph":
        return <DataGraphPreview />;
      case "writing":
        return <WritingPreview />;
      case "mind_map":
        return <MindMapPreview />;
      case "venn":
        return <VennPreview />;
      case "kwl":
        return <KwlPreview />;
      case "story_map":
        return <StoryMapPreview />;
      case "frayer":
        return <FrayerPreview />;
      case "word_search":
        return <WordSearchPreview />;
      case "sorting":
        return <SortingPreview />;
      case "timeline":
        return <TimelinePreview />;
      case "bingo":
        return <BingoPreview />;
      case "coloring":
        return <ColoringPreview />;
      case "mini_book":
        return <MiniBookPreview />;
      case "acrostic":
        return <AcrosticPreview />;
      default:
        return <GenericPreview />;
    }
  })();

  return <div className={`mt-1 mb-2 ${className}`}>{inner}</div>;
}
