import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, Sparkles, RefreshCw } from "lucide-react";
import { useBloomStore } from "../store";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Types ──────────────────────────────────────────────────────────────────────

type LayoutStatus = "pending" | "loading" | "done" | "error";

type Layout = {
  id: "A" | "B" | "C";
  label: string;
  status: LayoutStatus;
  data: any | null;
  error: string | null;
};

// ── Customization options ──────────────────────────────────────────────────────

const COLOR_THEMES = [
  { id: "black & white", label: "B&W",    preview: "⬛" },
  { id: "light pastel",  label: "Pastel", preview: "🟪" },
  { id: "full color",    label: "Color",  preview: "🟦" },
];

const FONT_STYLES = [
  { id: "clean",   label: "Clean"   },
  { id: "playful", label: "Playful" },
  { id: "cursive", label: "Cursive" },
  { id: "bold",    label: "Bold"    },
];

const BORDER_STYLES = [
  { id: "none",       label: "None"       },
  { id: "simple",     label: "Simple"     },
  { id: "decorative", label: "Decorative" },
  { id: "heavy",      label: "Heavy"      },
];

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border-2 border-border bg-white p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="space-y-2 mt-4">
        {[70, 90, 60, 80, 50].map((w, i) => (
          <div key={i} className="h-2.5 bg-muted rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        {[1,2,3].map((i) => (
          <div key={i} className="h-6 bg-muted/60 rounded" />
        ))}
      </div>
    </div>
  );
}

// ── Layout preview card ────────────────────────────────────────────────────────

function LayoutCard({
  layout,
  selected,
  onSelect,
}: {
  layout: Layout;
  selected: boolean;
  onSelect: () => void;
}) {
  const ws = layout.data?.worksheet ?? layout.data;
  const sections: any[] = ws?.sections ?? [];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/15"
          : "border-border bg-white hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        }`}>
          Layout {layout.id}
        </span>
        {selected && <Check className="w-4 h-4 text-primary" />}
      </div>

      {ws?.title && (
        <p className="text-sm font-bold text-foreground mb-2 truncate">{ws.title}</p>
      )}

      <div className="space-y-1.5">
        {sections.slice(0, 5).map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? "bg-primary" : "bg-muted-foreground/40"}`} />
            <p className="text-[11px] text-muted-foreground truncate">
              {s.title ?? s.type ?? `Section ${i + 1}`}
            </p>
          </div>
        ))}
        {sections.length > 5 && (
          <p className="text-[10px] text-muted-foreground/60 pl-3">+{sections.length - 5} more</p>
        )}
      </div>

      {ws?.gradeLevel && (
        <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
          Grade {ws.gradeLevel}
        </p>
      )}
    </motion.button>
  );
}

// ── safeParseJSON ──────────────────────────────────────────────────────────────

function safeParseJSON(str: string): any | null {
  try {
    const cleaned = str
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[GEN] JSON parse failed:", e);
    return null;
  }
}

// ── Job queue (lightweight) ────────────────────────────────────────────────────

type Job = { jobFn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void };

const jobQueue = {
  jobs: [] as Job[],
  running: 0,
  maxConcurrent: 3,

  add(jobFn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      jobQueue.jobs.push({ jobFn, resolve, reject });
      jobQueue.flush();
    });
  },

  flush() {
    while (jobQueue.running < jobQueue.maxConcurrent && jobQueue.jobs.length > 0) {
      const job = jobQueue.jobs.shift()!;
      jobQueue.running++;
      job.jobFn()
        .then(job.resolve)
        .catch(job.reject)
        .finally(() => { jobQueue.running--; jobQueue.flush(); });
    }
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

export function GenerationViewPage() {
  const [, setLocation] = useLocation();
  const { quickGen, setWorksheet, setQuickGen } = useBloomStore();

  const [layouts, setLayouts] = useState<Layout[]>([
    { id: "A", label: "Layout A", status: "pending", data: null, error: null },
    { id: "B", label: "Layout B", status: "pending", data: null, error: null },
    { id: "C", label: "Layout C", status: "pending", data: null, error: null },
  ]);
  const [selectedLayout, setSelectedLayout] = useState<"A" | "B" | "C">("A");
  const [customization, setCustomization] = useState({
    colorTheme: quickGen?.colorTheme ?? "black & white",
    fontStyle:  quickGen?.fontStyle  ?? "clean",
    border:     quickGen?.border     ?? "none",
    nameLine:   quickGen?.nameLine   ?? true,
    dateLine:   quickGen?.dateLine   ?? true,
  });

  const abortRefs = useRef<Record<string, AbortController>>({});
  const generationKey = useRef(0);

  const updateLayout = useCallback((id: "A" | "B" | "C", updates: Partial<Layout>) => {
    setLayouts((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const generateLayout = useCallback(
    async (id: "A" | "B" | "C", gen: typeof quickGen, custom: typeof customization, genKey: number) => {
      if (!gen) return;
      console.log(`[GEN] Starting Layout ${id}...`);

      const controller = new AbortController();
      abortRefs.current[id] = controller;
      const timeout = setTimeout(() => controller.abort(), 30000);

      updateLayout(id, { status: "loading", data: null, error: null });

      try {
        console.log(`[GEN] Layout ${id}: Calling API...`);
        const res = await fetch(`${BASE}/api/worksheet/customize-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            activityType:   gen.activityType,
            originalPrompt: gen.topic,
            parsedPromptData: {
              topic:      gen.topic,
              gradeLevel: gen.grade,
              skillFocus: gen.subject,
            },
            options: {
              title:       `${gen.topic} — ${gen.activityTypeName}`,
              gradeLevel:  gen.grade,
              includeName: custom.nameLine,
              includeDate: custom.dateLine,
              colorScheme: custom.colorTheme,
              fontStyle:   custom.fontStyle,
              borderStyle: custom.border,
            },
            layoutVariant: id,
            subject: gen.subject,
            details: gen.details,
          }),
        });

        clearTimeout(timeout);

        if (controller.signal.aborted) return;

        console.log(`[GEN] Layout ${id}: Response received (${res.status})`);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Server error ${res.status}`);
        }

        const rawText = await res.text();
        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = safeParseJSON(rawText);
        }

        if (!data) throw new Error("Invalid response from server");

        if (generationKey.current !== genKey) return;
        console.log(`[GEN] Layout ${id}: Done ✓`);
        updateLayout(id, { status: "done", data });
      } catch (err: any) {
        clearTimeout(timeout);
        if (controller.signal.aborted || err?.name === "AbortError") {
          console.log(`[GEN] Layout ${id}: Aborted`);
          return;
        }
        console.error(`[GEN] Layout ${id}: Error —`, err);
        if (generationKey.current !== genKey) return;
        updateLayout(id, { status: "error", error: err?.message ?? "Unknown error" });
      }
    },
    [updateLayout]
  );

  const startGeneration = useCallback(
    (gen: typeof quickGen, custom: typeof customization) => {
      if (!gen) return;
      const genKey = ++generationKey.current;
      console.log("[GEN] === Starting parallel generation ===");
      console.log("[GEN] Subject:", gen.subject, "| Topic:", gen.topic, "| Grade:", gen.grade, "| Type:", gen.activityType);

      Object.values(abortRefs.current).forEach((c) => c.abort());
      abortRefs.current = {};

      setLayouts([
        { id: "A", label: "Layout A", status: "pending", data: null, error: null },
        { id: "B", label: "Layout B", status: "pending", data: null, error: null },
        { id: "C", label: "Layout C", status: "pending", data: null, error: null },
      ]);

      jobQueue.add(() => generateLayout("A", gen, custom, genKey));
      jobQueue.add(() => generateLayout("B", gen, custom, genKey));
      jobQueue.add(() => generateLayout("C", gen, custom, genKey));
    },
    [generateLayout]
  );

  useEffect(() => {
    if (!quickGen) {
      setLocation(`${BASE}/prompt`);
      return;
    }
    startGeneration(quickGen, customization);
    return () => { Object.values(abortRefs.current).forEach((c) => c.abort()); };
  }, []);

  const allDone    = layouts.every((l) => l.status === "done" || l.status === "error");
  const anyLoading = layouts.some((l) => l.status === "loading" || l.status === "pending");

  const handleCustomizationChange = (key: string, value: any) => {
    if (!quickGen) return;
    const next = { ...customization, [key]: value };
    setCustomization(next);
    setQuickGen({ ...quickGen, [key]: value });
    if (anyLoading) {
      startGeneration(quickGen, next);
    }
  };

  const handleOpenInEditor = () => {
    const chosen = layouts.find((l) => l.id === selectedLayout);
    if (chosen?.data) {
      const ws = chosen.data?.worksheet ?? chosen.data;
      setWorksheet(ws);
    }
    setLocation(`${BASE}/canvas`);
  };

  if (!quickGen) return null;

  return (
    <div className="flex flex-col bg-muted/30" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setLocation(`${BASE}/prompt`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Adjust
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            Creating your {quickGen.activityTypeName} for{" "}
            <span className="text-primary">{quickGen.topic}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Grade {quickGen.grade} · {quickGen.subject}
          </p>
        </div>

        <button
          type="button"
          disabled={!allDone}
          onClick={handleOpenInEditor}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Open in Editor <span className="text-base">→</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* ── Layout cards ── */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {layouts.map((layout) => (
              <div key={layout.id}>
                <AnimatePresence mode="wait">
                  {(layout.status === "pending" || layout.status === "loading") ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground">Layout {layout.id}</span>
                      </div>
                      <SkeletonCard />
                    </motion.div>
                  ) : layout.status === "error" ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border-2 border-red-200 bg-red-50 p-4"
                    >
                      <p className="text-xs font-bold text-red-600 mb-1">Layout {layout.id} failed</p>
                      <p className="text-xs text-red-500 mb-3">{layout.error ?? "Unknown error"}</p>
                      <button
                        type="button"
                        onClick={() => generateLayout(layout.id, quickGen, customization, generationKey.current)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-semibold text-foreground">Layout {layout.id} ready</span>
                      </div>
                      <LayoutCard
                        layout={layout}
                        selected={selectedLayout === layout.id}
                        onSelect={() => setSelectedLayout(layout.id)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Progress row */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {layouts.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5 text-xs font-semibold">
                {l.status === "done" && <Check className="w-3.5 h-3.5 text-green-500" />}
                {(l.status === "loading" || l.status === "pending") && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
                )}
                {l.status === "error" && <span className="text-red-500">✕</span>}
                <span className={l.status === "done" ? "text-foreground" : "text-muted-foreground"}>
                  Layout {l.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Customization panel ── */}
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-white p-5 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Customize While It Generates
          </p>

          <div className="space-y-5">
            {/* Color Theme */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Color Theme</p>
              <div className="space-y-1.5">
                {COLOR_THEMES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="colorTheme"
                      value={t.id}
                      checked={customization.colorTheme === t.id}
                      onChange={() => handleCustomizationChange("colorTheme", t.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Font Style</p>
              <div className="space-y-1.5">
                {FONT_STYLES.map((f) => (
                  <label key={f.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="fontStyle"
                      value={f.id}
                      checked={customization.fontStyle === f.id}
                      onChange={() => handleCustomizationChange("fontStyle", f.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Border */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Border</p>
              <div className="space-y-1.5">
                {BORDER_STYLES.map((b) => (
                  <label key={b.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="border"
                      value={b.id}
                      checked={customization.border === b.id}
                      onChange={() => handleCustomizationChange("border", b.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{b.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name / Date lines */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Header Lines</p>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Name line</span>
                  <button
                    type="button"
                    onClick={() => handleCustomizationChange("nameLine", !customization.nameLine)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      customization.nameLine ? "bg-primary" : "bg-muted"
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      customization.nameLine ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Date line</span>
                  <button
                    type="button"
                    onClick={() => handleCustomizationChange("dateLine", !customization.dateLine)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      customization.dateLine ? "bg-primary" : "bg-muted"
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      customization.dateLine ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 pt-5 border-t border-border"
            >
              <p className="text-xs text-muted-foreground mb-3">
                Layout <strong>{selectedLayout}</strong> selected — open it in the canvas editor to customize every detail.
              </p>
              <button
                type="button"
                onClick={handleOpenInEditor}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-4 h-4" />
                Open in Editor →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
