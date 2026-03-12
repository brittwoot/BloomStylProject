import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import {
  CLIPART_CATEGORIES, CLIPART_DATA, getSuggestedClipart,
  type ClipartCategory, type ClipartEntry,
} from "./clipartData";
import { useBloomStore } from "../../store";

const SIZE_OPTIONS: { value: "sm" | "md" | "lg"; label: string; preview: string }[] = [
  { value: "sm", label: "S", preview: "text-2xl" },
  { value: "md", label: "M", preview: "text-3xl" },
  { value: "lg", label: "L", preview: "text-5xl" },
];

const CATEGORY_LABELS: Record<ClipartCategory, string> = {
  school:    "🏫 School",
  reading:   "📖 Reading",
  writing:   "✏️ Writing",
  math:      "➕ Math",
  science:   "🔬 Science",
  animals:   "🐘 Animals",
  weather:   "🌧️ Weather",
  holidays:  "🎉 Holidays",
  classroom: "🎨 Classroom",
};

type Tab = "browse" | "suggested";

interface Props {
  activeSectionId: string | null;
}

export function ClipartPanel({ activeSectionId }: Props) {
  const [tab, setTab] = useState<Tab>("browse");
  const [category, setCategory] = useState<ClipartCategory>("school");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [search, setSearch] = useState("");
  const { addClipart, removeClipart, sectionClipart, worksheet } = useBloomStore();

  const worksheetText = worksheet
    ? [worksheet.title, ...(worksheet.sections?.map((s: any) => `${s.title} ${s.instructions ?? ""} ${s.questions?.map((q: any) => q.text).join(" ") ?? ""}`) ?? [])].join(" ")
    : "";

  const suggestions = getSuggestedClipart(worksheetText);

  const filteredBrowse = search
    ? CLIPART_DATA.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      )
    : CLIPART_DATA.filter((c) => c.category === category);

  const insertClipart = (item: ClipartEntry) => {
    if (!activeSectionId) return;
    addClipart(activeSectionId, {
      emoji: item.emoji,
      label: item.label,
      category: item.category,
      size,
    });
  };

  const activeClipart = activeSectionId ? (sectionClipart[activeSectionId] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* No active section warning */}
      {!activeSectionId && (
        <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          Click a section in the preview to select it, then add clipart here.
        </div>
      )}

      {/* Size picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Clipart Size</label>
        <div className="flex gap-1.5">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSize(s.value)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                size === s.value
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setTab("browse")}
          className={`flex-1 text-xs font-semibold py-2 transition-colors ${
            tab === "browse" ? "bg-primary text-white" : "hover:bg-muted/60"
          }`}
        >
          Browse
        </button>
        <button
          type="button"
          onClick={() => setTab("suggested")}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 transition-colors ${
            tab === "suggested" ? "bg-primary text-white" : "hover:bg-muted/60"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Suggested
        </button>
      </div>

      {/* Browse tab */}
      {tab === "browse" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clipart…"
              className="w-full text-sm rounded-lg border border-border bg-muted/40 pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          {/* Category selector (hidden during search) */}
          {!search && (
            <div className="flex flex-wrap gap-1">
              {CLIPART_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    category === cat
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Clipart grid */}
          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredBrowse.map((item) => (
              <button
                key={item.emoji + item.label}
                type="button"
                disabled={!activeSectionId}
                onClick={() => insertClipart(item)}
                title={item.label}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="text-2xl leading-none">{item.emoji}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested tab */}
      {tab === "suggested" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Based on your worksheet content:</p>
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Generate a worksheet first to get suggestions.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {suggestions.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  disabled={!activeSectionId}
                  onClick={() => insertClipart(item)}
                  title={item.label}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl leading-none">{item.emoji}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-1">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active clipart in selected section */}
      {activeClipart.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Added to Section</label>
          <div className="flex flex-wrap gap-2">
            {activeClipart.map((c) => (
              <div key={c.id} className="relative group">
                <span className={`leading-none ${c.size === "sm" ? "text-2xl" : c.size === "lg" ? "text-5xl" : "text-3xl"}`}>
                  {c.emoji}
                </span>
                <button
                  type="button"
                  onClick={() => activeSectionId && removeClipart(activeSectionId, c.id)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
