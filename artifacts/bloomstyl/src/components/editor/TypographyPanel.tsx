import { useBloomStore, type GlobalTypography } from "../../store";
import { ALL_FONTS, HEADING_STYLES, FONT_CATEGORIES, type DecorativeHeadingStyle } from "./fontData";

const ACCENT_COLORS = [
  { label: "Purple", value: "#7c3aed" },
  { label: "Blue", value: "#2563eb" },
  { label: "Pink", value: "#db2777" },
  { label: "Teal", value: "#0891b2" },
  { label: "Green", value: "#15803d" },
  { label: "Orange", value: "#ea580c" },
  { label: "Red", value: "#dc2626" },
  { label: "Slate", value: "#475569" },
];

function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ fontFamily: `'${value}', sans-serif` }}
      >
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat.id} label={`${cat.emoji} ${cat.label}`}>
            {ALL_FONTS.filter((f) => f.category === cat.id).map((f) => (
              <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', sans-serif` }}>
                {f.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p
        className="text-base text-foreground/60 mt-1 leading-tight"
        style={{ fontFamily: `'${value}', sans-serif` }}
      >
        The quick brown fox
      </p>
    </div>
  );
}

export function TypographyPanel() {
  const { globalTypography, setGlobalTypography } = useBloomStore();
  const t = globalTypography;

  const update = (updates: Partial<GlobalTypography>) => setGlobalTypography(updates);

  return (
    <div className="space-y-5">

      {/* Title font */}
      <FontPicker label="Title Font" value={t.titleFont} onChange={(v) => update({ titleFont: v })} />

      {/* Title heading style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title Style</label>
        <div className="grid grid-cols-3 gap-1.5">
          {HEADING_STYLES.map((hs) => (
            <button
              key={hs.id}
              type="button"
              onClick={() => update({ titleHeadingStyle: hs.id as DecorativeHeadingStyle })}
              className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all border ${
                t.titleHeadingStyle === hs.id
                  ? "bg-primary text-white border-primary"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5 text-foreground"
              }`}
            >
              {hs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body font */}
      <FontPicker label="Body Font" value={t.bodyFont} onChange={(v) => update({ bodyFont: v, questionFont: v, vocabFont: v })} />

      {/* Heading font */}
      <FontPicker label="Section Heading Font" value={t.headingFont} onChange={(v) => update({ headingFont: v })} />

      {/* Accent color */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accent Color</label>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => update({ accentColor: c.value })}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                t.accentColor === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <label className="w-7 h-7 rounded-full border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center" title="Custom color">
            <span className="text-[10px] text-muted-foreground font-bold">+</span>
            <input
              type="color"
              className="sr-only"
              value={t.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
            />
          </label>
        </div>
      </div>

      {/* Title color */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title Color</label>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-border overflow-hidden">
            <input
              type="color"
              className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer"
              value={t.titleColor}
              onChange={(e) => update({ titleColor: e.target.value })}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">{t.titleColor}</span>
        </div>
      </div>

      {/* Heading color */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Heading Color</label>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-border overflow-hidden">
            <input
              type="color"
              className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer"
              value={t.headingColor}
              onChange={(e) => update({ headingColor: e.target.value })}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">{t.headingColor}</span>
        </div>
      </div>

      {/* Line height */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Line Spacing</label>
          <span className="text-xs text-muted-foreground font-mono">{t.lineHeight.toFixed(1)}×</span>
        </div>
        <input
          type="range"
          min={1.2}
          max={2.5}
          step={0.1}
          value={t.lineHeight}
          onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Tight</span>
          <span>Spacious</span>
        </div>
      </div>

      {/* Base size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Text Size</label>
          <span className="text-xs text-muted-foreground font-mono">{t.baseSize >= 1 ? `+${Math.round((t.baseSize - 1) * 100)}%` : `${Math.round((t.baseSize - 1) * 100)}%`}</span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.05}
          value={t.baseSize}
          onChange={(e) => update({ baseSize: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Smaller</span>
          <span>Larger</span>
        </div>
      </div>

    </div>
  );
}
