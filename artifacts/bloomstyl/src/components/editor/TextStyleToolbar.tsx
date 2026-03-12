import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "lucide-react";
import { useBloomStore, DEFAULT_SECTION_STYLE, type TextStyle } from "../../store";

const FONTS = [
  { value: "DM Sans",    label: "DM Sans" },
  { value: "Poppins",    label: "Poppins" },
  { value: "Nunito",     label: "Nunito" },
  { value: "Inter",      label: "Inter" },
  { value: "Open Sans",  label: "Open Sans" },
  { value: "Roboto",     label: "Roboto" },
  { value: "Outfit",     label: "Outfit" },
  { value: "Pacifico",   label: "Pacifico (decorative)" },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32];

const PRESET_COLORS = [
  "#1a1a2e", "#374151", "#6b7280",
  "#7c3aed", "#2563eb", "#0891b2",
  "#059669", "#d97706", "#dc2626",
  "#9f1239", "#1d4ed8", "#7e22ce",
];

function IconBtn({
  active, onClick, children, title,
}: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function TextStyleToolbar({ sectionId }: { sectionId: string }) {
  const { sectionStyles, setTextStyle } = useBloomStore();
  const style = sectionStyles[sectionId]?.textStyle ?? DEFAULT_SECTION_STYLE.textStyle;

  const update = (updates: Partial<TextStyle>) => setTextStyle(sectionId, updates);

  return (
    <div className="space-y-4">
      {/* Font family */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Font</label>
        <select
          value={style.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          style={{ fontFamily: `'${style.fontFamily}', sans-serif` }}
          className="w-full text-sm rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', sans-serif` }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size + color */}
      <div className="flex gap-2">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Size</label>
          <select
            value={style.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-full text-sm rounded-lg border border-border bg-muted/40 px-2 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Color</label>
          <input
            type="color"
            value={style.fontColor}
            onChange={(e) => update({ fontColor: e.target.value })}
            className="h-9 w-9 rounded-lg border border-border cursor-pointer"
          />
        </div>
      </div>

      {/* Preset colors */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quick Colors</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ fontColor: c })}
              title={c}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                style.fontColor === c ? "border-primary ring-2 ring-primary/40" : "border-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bold / Italic / Underline */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Style</label>
        <div className="flex gap-1 flex-wrap">
          <IconBtn active={style.bold} onClick={() => update({ bold: !style.bold })} title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn active={style.italic} onClick={() => update({ italic: !style.italic })} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn active={style.underline} onClick={() => update({ underline: !style.underline })} title="Underline">
            <Underline className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Align</label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <IconBtn
              key={a}
              active={style.alignment === a}
              onClick={() => update({ alignment: a })}
              title={`Align ${a}`}
            >
              {a === "left" && <AlignLeft className="w-3.5 h-3.5" />}
              {a === "center" && <AlignCenter className="w-3.5 h-3.5" />}
              {a === "right" && <AlignRight className="w-3.5 h-3.5" />}
            </IconBtn>
          ))}
        </div>
      </div>

      {/* List style */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">List</label>
        <div className="flex gap-1">
          <IconBtn
            active={style.listStyle === "bullet"}
            onClick={() => update({ listStyle: style.listStyle === "bullet" ? "none" : "bullet" })}
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn
            active={style.listStyle === "number"}
            onClick={() => update({ listStyle: style.listStyle === "number" ? "none" : "number" })}
            title="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </IconBtn>
          {style.listStyle !== "none" && (
            <button
              type="button"
              onClick={() => update({ listStyle: "none" })}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
