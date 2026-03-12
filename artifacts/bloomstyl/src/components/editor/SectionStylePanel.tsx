import { useBloomStore, DEFAULT_SECTION_STYLE, DEFAULT_PAGE_STYLE, type SectionStyle } from "../../store";

const BG_PRESETS = [
  { label: "None",       value: "transparent" },
  { label: "Cream",      value: "#fef9ef" },
  { label: "Light Blue", value: "#eff6ff" },
  { label: "Light Green",value: "#f0fdf4" },
  { label: "Lavender",   value: "#f5f3ff" },
  { label: "Rose",       value: "#fff1f2" },
  { label: "Yellow",     value: "#fefce8" },
  { label: "Gray",       value: "#f9fafb" },
];

const PAGE_BG_PRESETS = [
  { label: "White",       value: "#ffffff" },
  { label: "Cream",       value: "#fffdf7" },
  { label: "Light Gray",  value: "#f9fafb" },
  { label: "Sky Blue",    value: "#f0f9ff" },
  { label: "Mint",        value: "#f0fdf4" },
  { label: "Lavender",    value: "#faf5ff" },
];

const BORDER_COLORS = [
  "#d1d5db", "#9ca3af", "#6b7280",
  "#7c3aed", "#2563eb", "#059669",
  "#d97706", "#dc2626", "#ec4899",
];

type Props = { sectionId: string };

export function SectionStylePanel({ sectionId }: Props) {
  const { sectionStyles, setSectionStyle, worksheetPageStyle, setWorksheetPageStyle } = useBloomStore();
  const style: SectionStyle = sectionStyles[sectionId] ?? DEFAULT_SECTION_STYLE;
  const pageStyle = worksheetPageStyle ?? DEFAULT_PAGE_STYLE;

  const update = (updates: Partial<SectionStyle>) => setSectionStyle(sectionId, updates);

  return (
    <div className="space-y-5">

      {/* Page background */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Page Background</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {PAGE_BG_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setWorksheetPageStyle({ bgColor: p.value })}
              className={`text-xs py-1.5 px-1 rounded-lg border transition-all text-center ${
                pageStyle.bgColor === p.value
                  ? "border-primary ring-1 ring-primary/40 font-semibold"
                  : "border-border hover:border-primary/40"
              }`}
              style={{ backgroundColor: p.value }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Section background */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Section Background</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {BG_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update({ bgColor: p.value })}
              className={`text-xs py-2 rounded-lg border transition-all ${
                style.bgColor === p.value
                  ? "border-primary ring-1 ring-primary/40 font-semibold"
                  : "border-border hover:border-primary/40"
              }`}
              style={{ backgroundColor: p.value === "transparent" ? "#fff" : p.value }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Custom:</span>
          <input
            type="color"
            value={style.bgColor === "transparent" ? "#ffffff" : style.bgColor}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="h-7 w-7 rounded border border-border cursor-pointer"
          />
        </div>
      </div>

      {/* Border */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Border</h4>

        {/* Style */}
        <div className="flex gap-1.5 flex-wrap">
          {(["none", "solid", "dashed", "dotted"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ borderStyle: s })}
              className={`px-2.5 py-1 text-xs rounded-lg border capitalize transition-colors ${
                style.borderStyle === s
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {style.borderStyle !== "none" && (
          <>
            {/* Width */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Thickness</span>
              <input
                type="range"
                min={1}
                max={6}
                value={style.borderWidth}
                onChange={(e) => update({ borderWidth: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs w-6 text-center">{style.borderWidth}px</span>
            </div>

            {/* Color */}
            <div className="flex flex-wrap gap-1.5">
              {BORDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ borderColor: c })}
                  title={c}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    style.borderColor === c ? "border-white ring-2 ring-primary/60" : "border-white/80"
                  }`}
                />
              ))}
              <input
                type="color"
                value={style.borderColor}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="h-5 w-5 rounded-full border border-border cursor-pointer"
                title="Custom color"
              />
            </div>
          </>
        )}
      </div>

      {/* Rounded corners */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rounded Corners</span>
        <button
          type="button"
          onClick={() => update({ rounded: !style.rounded })}
          className={`relative w-9 h-5 rounded-full transition-colors ${style.rounded ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${style.rounded ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}
