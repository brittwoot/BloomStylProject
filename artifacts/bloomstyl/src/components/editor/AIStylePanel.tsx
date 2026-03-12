import { useBloomStore } from "../../store";
import { AI_STYLE_PRESETS } from "./aiStyleData";

export function AIStylePanel() {
  const { applyGlobalTypography, setWorksheetPageStyle, worksheetPageStyle } = useBloomStore();

  const handleApply = (preset: typeof AI_STYLE_PRESETS[0]) => {
    if (preset.typography) {
      applyGlobalTypography(preset.typography as any);
    }
    if (preset.pageStyle?.bgColor) {
      setWorksheetPageStyle({ bgColor: preset.pageStyle.bgColor });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Pick a preset to instantly style fonts, colors, and heading decorations across the whole worksheet.
      </p>

      <div className="space-y-2">
        {AI_STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleApply(preset)}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/3 transition-all text-left group"
          >
            <span className="text-xl shrink-0 mt-0.5">{preset.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Apply →</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{preset.desc}</p>

              {/* Font preview strip */}
              <div className="mt-2 flex gap-3 text-[11px]">
                <span
                  style={{ fontFamily: `'${preset.typography?.titleFont}', sans-serif` }}
                  className="text-foreground font-bold"
                >
                  {preset.typography?.titleFont}
                </span>
                {preset.typography?.bodyFont !== preset.typography?.titleFont && (
                  <span
                    style={{ fontFamily: `'${preset.typography?.bodyFont}', sans-serif` }}
                    className="text-muted-foreground"
                  >
                    {preset.typography?.bodyFont}
                  </span>
                )}
                {preset.typography?.accentColor && (
                  <span
                    className="ml-auto w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: preset.typography.accentColor }}
                  />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
