import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { useBloomStore } from "../store";
import { TYPE_MAP, CATEGORY_META, WORKSHEET_TYPES, type WorksheetTypeOption } from "../types/worksheetTypes";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Common options every worksheet type shows ─────────────────────────────────

const GRADE_LEVELS = ["K", "1", "2", "3", "4", "5", "6+", "General"];

// ── Type-specific option renderers ────────────────────────────────────────────

function ChipsField({
  opt,
  value,
  onChange,
}: {
  opt: WorksheetTypeOption;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{opt.label}</label>
      <div className="flex flex-wrap gap-2">
        {opt.options?.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              value === o
                ? "bg-primary text-white border-primary"
                : "bg-white border-border text-foreground hover:border-primary/50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {opt.description && (
        <p className="text-[11px] text-muted-foreground">{opt.description}</p>
      )}
    </div>
  );
}

function ToggleField({
  opt,
  value,
  onChange,
}: {
  opt: WorksheetTypeOption;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
        {opt.description && (
          <p className="text-[11px] text-muted-foreground">{opt.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function TextField({
  opt,
  value,
  onChange,
}: {
  opt: WorksheetTypeOption;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{opt.label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opt.description ?? `Enter ${opt.label.toLowerCase()}…`}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function TextareaField({
  opt,
  value,
  onChange,
}: {
  opt: WorksheetTypeOption;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{opt.label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opt.description ?? `Enter ${opt.label.toLowerCase()}…`}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />
    </div>
  );
}

function NumberField({
  opt,
  value,
  onChange,
}: {
  opt: WorksheetTypeOption;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{opt.label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={1}
        className="w-28 px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

// ── Live worksheet preview ─────────────────────────────────────────────────────

function WorksheetPreview({
  typeId,
  opts,
}: {
  typeId: string;
  opts: Record<string, any>;
}) {
  const typeDef = TYPE_MAP[typeId as keyof typeof TYPE_MAP];
  if (!typeDef) return null;
  const meta = CATEGORY_META[typeDef.category];
  const borderMap: Record<string, string> = {
    none: "border border-gray-200",
    simple: "border-2 border-gray-700",
    dashed: "border-2 border-dashed border-gray-600",
    heavy: "border-4 border-gray-900",
    decorative: "border-4 border-double border-gray-700",
  };
  const borderCls = borderMap[opts.borderStyle ?? "none"] || "border border-gray-200";

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden" style={{ minHeight: 480 }}>
      {/* Paper */}
      <div className={`${borderCls} mx-3 my-3 rounded-lg overflow-hidden`} style={{ minHeight: 440 }}>
        {/* Header row */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          {(opts.includeName || opts.includeDate) && (
            <div className="flex gap-6 mb-2">
              {opts.includeName && (
                <div className="flex items-end gap-2 text-[10px] text-gray-400">
                  Name: <div className="w-24 border-b border-gray-300" />
                </div>
              )}
              {opts.includeDate && (
                <div className="flex items-end gap-2 text-[10px] text-gray-400">
                  Date: <div className="w-20 border-b border-gray-300" />
                </div>
              )}
            </div>
          )}
          <h1
            className="text-base font-bold text-center leading-tight"
            style={{
              fontFamily:
                opts.fontStyle === "cursive"
                  ? "Pacifico, cursive"
                  : opts.fontStyle === "playful"
                  ? "Outfit, sans-serif"
                  : "DM Sans, sans-serif",
              fontWeight: opts.fontStyle === "bold" ? 900 : 700,
            }}
          >
            {opts.title || typeDef.label}
          </h1>
          {opts.teacherInfo && (
            <p className="text-[10px] text-center text-gray-400 mt-0.5">{opts.teacherInfo}</p>
          )}
        </div>

        {/* Type-specific preview content */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeDef.icon}</span>
            <p className="text-xs font-semibold text-gray-500">{typeDef.shortLabel}</p>
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: meta.bgColor, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          {typeDef.previewRows.map((row, i) => (
            <div
              key={i}
              className="rounded-lg px-3 py-2 text-xs text-gray-500 font-mono"
              style={{ backgroundColor: meta.bgColor + "80" }}
            >
              {row}
            </div>
          ))}

          {/* Grade badge */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[10px] text-gray-400">Grade:</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {opts.gradeLevel || "General"}
            </span>
            <span className="text-[10px] text-gray-400 ml-auto">Orientation: {opts.orientation ?? "portrait"}</span>
          </div>
        </div>
      </div>

      {/* Color scheme indicator */}
      <div className="absolute bottom-0 right-0 text-[10px] text-gray-400 px-3 py-1.5">
        {opts.colorScheme ?? "b&w"}
      </div>
    </div>
  );
}

// ── CustomizePage ─────────────────────────────────────────────────────────────

export function CustomizePage() {
  const [, setLocation] = useLocation();
  const {
    chosenActivityType,
    customizeOptions,
    setCustomizeOptions,
    parsedPromptData,
    originalPrompt,
    setWorksheet,
    worksheet,
    hasEdited,
  } = useBloomStore();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chosenActivityType) setLocation(`${BASE}/prompt`);
  }, [chosenActivityType]);

  if (!chosenActivityType) return null;

  const typeDef = TYPE_MAP[chosenActivityType as keyof typeof TYPE_MAP];
  if (!typeDef) return null;

  const meta = CATEGORY_META[typeDef.category];
  const opts = customizeOptions;

  const setOpt = (key: string, value: any) => setCustomizeOptions({ [key]: value });

  const handleCreate = async () => {
    // If there is an existing, edited worksheet, confirm before overwriting it.
    if (worksheet && hasEdited) {
      const ok = window.confirm(
        "You have edits in the current worksheet. Creating a new worksheet will replace your changes. Continue?"
      );
      if (!ok) return;
    }

    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/worksheet/customize-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: chosenActivityType,
          options: opts,
          originalPrompt,
          parsedPromptData,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.worksheet) throw new Error("No worksheet in response");
      setWorksheet(data.worksheet);
      setLocation(`${BASE}/result`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const resetDefaults = () => {
    const defaults: Record<string, any> = {};
    typeDef.typeOptions.forEach((o) => { defaults[o.key] = o.default; });
    setCustomizeOptions({
      title: parsedPromptData?.topic ? `${parsedPromptData.topic} — ${typeDef.shortLabel}` : typeDef.label,
      gradeLevel: parsedPromptData?.gradeLevel ?? "General",
      ...defaults,
    });
  };

  const renderTypeOption = (opt: WorksheetTypeOption) => {
    const value = opts[opt.key] ?? opt.default;
    const onChange = (v: any) => setOpt(opt.key, v);
    switch (opt.type) {
      case "chips": return <ChipsField key={opt.key} opt={opt} value={value} onChange={onChange} />;
      case "toggle": return <ToggleField key={opt.key} opt={opt} value={!!value} onChange={onChange} />;
      case "text": return <TextField key={opt.key} opt={opt} value={value as string} onChange={onChange} />;
      case "textarea": return <TextareaField key={opt.key} opt={opt} value={value as string} onChange={onChange} />;
      case "number": return <NumberField key={opt.key} opt={opt} value={value as number} onChange={onChange} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocation(`${BASE}/suggest`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeDef.icon}</span>
              <span className="font-semibold text-sm text-foreground">{typeDef.label}</span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: meta.bgColor, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset defaults
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full px-4 py-6 gap-6">

        {/* LEFT: Customization panel */}
        <div className="w-80 shrink-0 overflow-y-auto space-y-6 pr-1 pb-24">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Customize</h2>
            <p className="text-xs text-muted-foreground">{typeDef.description}</p>
          </div>

          {/* Common settings */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
              All Worksheets
            </p>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Worksheet Title</label>
              <input
                type="text"
                value={opts.title}
                onChange={(e) => setOpt("title", e.target.value)}
                placeholder="Title…"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Grade level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Grade Level</label>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_LEVELS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setOpt("gradeLevel", g)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                      opts.gradeLevel === g
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Orientation</label>
              <div className="flex gap-2">
                {["portrait", "landscape"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOpt("orientation", o)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      opts.orientation === o
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{o === "portrait" ? "📄" : "📋"}</span>
                    <span className="capitalize">{o}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name / Date toggles */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opts.includeName}
                  onChange={(e) => setOpt("includeName", e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span className="text-xs font-semibold">Name line</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opts.includeDate}
                  onChange={(e) => setOpt("includeDate", e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span className="text-xs font-semibold">Date line</span>
              </label>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Fonts, colors, and borders can be adjusted in the worksheet editor after creation.
            </p>

            {/* Teacher info */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Teacher / Class Info (optional)</label>
              <input
                type="text"
                value={opts.teacherInfo ?? ""}
                onChange={(e) => setOpt("teacherInfo", e.target.value)}
                placeholder="e.g. Mrs. Johnson — Room 12"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Type-specific options */}
          {typeDef.typeOptions.length > 0 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
                {typeDef.label} Options
              </p>
              {typeDef.typeOptions.map(renderTypeOption)}
            </div>
          )}
        </div>

        {/* RIGHT: Live preview */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-lg mx-auto space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">
              Live Preview
            </p>
            <motion.div
              key={JSON.stringify({ ...opts, t: chosenActivityType })}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <WorksheetPreview typeId={chosenActivityType} opts={opts} />
            </motion.div>
            <p className="text-[11px] text-center text-muted-foreground">
              The full worksheet generates after you click Create Worksheet below.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky bottom Create button */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {error && <p className="text-sm text-red-500 flex-1">{error}</p>}
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCreate}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating worksheet…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Create Worksheet</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
