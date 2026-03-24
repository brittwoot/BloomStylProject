export function resolveQuickGenPreviewKind(
  layoutTypeLabel?: string,
  activityType?: string,
): string {
  const t = (activityType ?? layoutTypeLabel ?? "").toLowerCase().replace(/_/g, " ");
  if (t.includes("math") || t.includes("number") || t.includes("fraction") || t.includes("addition") || t.includes("subtract") || t.includes("multiply") || t.includes("divide") || t.includes("word problem")) return "math";
  if (t.includes("story map") || t.includes("comprehension") || t.includes("reading")) return "reading";
  if (t.includes("kwl")) return "kwl";
  if (t.includes("venn")) return "venn";
  if (t.includes("diagram") || t.includes("label")) return "diagram";
  if (t.includes("sequence") || t.includes("steps") || t.includes("process")) return "sequence";
  if (t.includes("match") || t.includes("line match")) return "matching";
  if (t.includes("word search")) return "wordsearch";
  if (t.includes("word sort") || t.includes("sort")) return "wordsort";
  if (t.includes("writing") || t.includes("prompt") || t.includes("essay") || t.includes("sentence")) return "writing";
  if (t.includes("fill") || t.includes("blank")) return "fillblank";
  if (t.includes("vocabulary") || t.includes("vocab") || t.includes("word bank")) return "vocab";
  return "general";
}

function MathPreview() {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 space-y-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-16 bg-amber-200 rounded" />
          <div className="h-2 w-4 bg-amber-300 rounded" />
          <div className="h-2 w-12 bg-amber-100 rounded border border-amber-200" />
        </div>
      ))}
    </div>
  );
}

function ReadingPreview() {
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 space-y-1.5">
      <div className="h-2 w-full bg-blue-200 rounded" />
      <div className="h-2 w-4/5 bg-blue-100 rounded" />
      <div className="h-2 w-full bg-blue-100 rounded" />
      <div className="mt-1.5 grid grid-cols-2 gap-1">
        <div className="h-6 rounded bg-blue-200 border border-blue-300" />
        <div className="h-6 rounded bg-blue-200 border border-blue-300" />
      </div>
    </div>
  );
}

function KWLPreview() {
  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-2">
      <div className="grid grid-cols-3 gap-1">
        {["K", "W", "L"].map((col) => (
          <div key={col} className="text-center">
            <div className="text-[9px] font-bold text-green-700 mb-1">{col}</div>
            <div className="h-8 rounded bg-green-100 border border-green-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VennPreview() {
  return (
    <div className="rounded-lg bg-purple-50 border border-purple-200 p-2 flex justify-center">
      <svg width="80" height="40" viewBox="0 0 80 40">
        <circle cx="28" cy="20" r="18" fill="none" stroke="#c4b5fd" strokeWidth="1.5" />
        <circle cx="52" cy="20" r="18" fill="none" stroke="#c4b5fd" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function DiagramPreview() {
  return (
    <div className="rounded-lg bg-teal-50 border border-teal-200 p-2 space-y-1">
      <div className="h-10 rounded bg-teal-100 border border-teal-200 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-teal-200" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-teal-100 border border-teal-200" />
        ))}
      </div>
    </div>
  );
}

function SequencePreview() {
  return (
    <div className="rounded-lg bg-orange-50 border border-orange-200 p-2 space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-orange-300 shrink-0 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">{i}</span>
          </div>
          <div className="h-2 flex-1 bg-orange-100 rounded border border-orange-200" />
        </div>
      ))}
    </div>
  );
}

function MatchingPreview() {
  return (
    <div className="rounded-lg bg-pink-50 border border-pink-200 p-2 space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-10 bg-pink-200 rounded" />
          <div className="flex-1 border-t border-dashed border-pink-300" />
          <div className="h-2 w-10 bg-pink-100 rounded border border-pink-200" />
        </div>
      ))}
    </div>
  );
}

function WritingPreview() {
  return (
    <div className="rounded-lg bg-violet-50 border border-violet-200 p-2 space-y-1">
      <div className="h-2 w-3/4 bg-violet-200 rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-1.5 w-full bg-violet-100 rounded border-b border-violet-200" />
      ))}
    </div>
  );
}

function FillBlankPreview() {
  return (
    <div className="rounded-lg bg-sky-50 border border-sky-200 p-2 space-y-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1 flex-wrap">
          <div className="h-1.5 w-8 bg-sky-200 rounded" />
          <div className="h-1.5 w-12 bg-sky-100 rounded border border-sky-300" />
          <div className="h-1.5 w-6 bg-sky-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function GeneralPreview() {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 space-y-1.5">
      <div className="h-2 w-3/4 bg-gray-300 rounded" />
      <div className="h-2 w-full bg-gray-200 rounded" />
      <div className="h-2 w-5/6 bg-gray-200 rounded" />
      <div className="h-6 rounded bg-gray-100 border border-gray-200 mt-1" />
    </div>
  );
}

export function QuickGenOptionMiniPreview({
  kind,
  activityType: _activityType,
}: {
  kind?: string;
  activityType?: string;
}) {
  const k = kind ?? "general";
  if (k === "math") return <MathPreview />;
  if (k === "reading") return <ReadingPreview />;
  if (k === "kwl") return <KWLPreview />;
  if (k === "venn") return <VennPreview />;
  if (k === "diagram") return <DiagramPreview />;
  if (k === "sequence") return <SequencePreview />;
  if (k === "matching") return <MatchingPreview />;
  if (k === "writing") return <WritingPreview />;
  if (k === "fillblank") return <FillBlankPreview />;
  return <GeneralPreview />;
}
