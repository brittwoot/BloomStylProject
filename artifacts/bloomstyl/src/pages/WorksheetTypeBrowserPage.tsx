import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, ArrowLeft, ChevronRight } from "lucide-react";
import {
  WORKSHEET_TYPES,
  TYPES_BY_CATEGORY,
  CATEGORY_META,
  type WorksheetCategory,
  type WorksheetTypeDef,
} from "../types/worksheetTypes";
import { useBloomStore } from "../store";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function TypeCard({ type, onPick }: { type: WorksheetTypeDef; onPick: () => void }) {
  const meta = CATEGORY_META[type.category];
  return (
    <motion.button
      type="button"
      onClick={onPick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="text-left rounded-xl border-2 border-border bg-white hover:border-primary hover:shadow-md transition-all duration-150 group overflow-hidden"
    >
      {/* Card header strip */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: meta.bgColor, borderBottom: `2px solid ${meta.color}20` }}
      >
        <span className="text-xl leading-none">{type.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: meta.color }}>
          {CATEGORY_META[type.category].label}
        </span>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-1.5">
        <p className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
          {type.label}
        </p>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {type.description}
        </p>
        <p className="text-[10px] text-muted-foreground/60 font-medium">Grades: {type.gradeRange}</p>
      </div>

      {/* Preview rows */}
      <div className="px-3 pb-3 space-y-1">
        {type.previewRows.map((row, i) => (
          <div
            key={i}
            className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 font-mono leading-tight truncate"
          >
            {row}
          </div>
        ))}
      </div>

      <div className="px-3 pb-3 flex items-center justify-end">
        <span className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-0.5">
          Use this type <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.button>
  );
}

export function WorksheetTypeBrowserPage() {
  const [, setLocation] = useLocation();
  const { setChosenActivityType } = useBloomStore();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<WorksheetCategory | "all">("all");

  const categories: WorksheetCategory[] = ["coloring", "matching", "writing", "organizer", "math", "science", "games"];

  const filtered = useMemo(() => {
    let types = WORKSHEET_TYPES;
    if (activeCategory !== "all") types = TYPES_BY_CATEGORY[activeCategory];
    if (query.trim()) {
      const q = query.toLowerCase();
      types = types.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.includes(q)
      );
    }
    return types;
  }, [query, activeCategory]);

  const handlePick = (type: WorksheetTypeDef) => {
    setChosenActivityType(type.id);
    setLocation(`${BASE}/customize`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setLocation(`${BASE}/prompt`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to prompt
          </button>
          <h1 className="text-2xl font-bold text-foreground">Choose a Worksheet Type</h1>
          <p className="text-sm text-muted-foreground">
            {WORKSHEET_TYPES.length} formats available — pick the one that fits your lesson.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search types…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === "all"
              ? "bg-primary text-white border-primary"
              : "bg-white border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          All ({WORKSHEET_TYPES.length})
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = TYPES_BY_CATEGORY[cat].length;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive ? "text-white border-transparent" : "bg-white border-border text-muted-foreground hover:border-primary/40"
              }`}
              style={isActive ? { backgroundColor: meta.color, borderColor: meta.color } : undefined}
            >
              {meta.icon} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {query && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Type grid — grouped by category if no search/filter */}
      {!query && activeCategory === "all" ? (
        <div className="space-y-8">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const types = TYPES_BY_CATEGORY[cat];
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.icon}</span>
                  <h2 className="text-base font-bold text-foreground">{meta.label}</h2>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: meta.bgColor, color: meta.color }}
                  >
                    {types.length} formats
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {types.map((type) => (
                    <TypeCard key={type.id} type={type} onPick={() => handlePick(type)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.length > 0 ? (
            filtered.map((type) => (
              <TypeCard key={type.id} type={type} onPick={() => handlePick(type)} />
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-lg">No types match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
