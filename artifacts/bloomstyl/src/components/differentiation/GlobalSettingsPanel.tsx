import type { GlobalDiffSettings, VersionIndicator, PrintMode } from "../../types/differentiationTypes";

type Props = {
  settings: GlobalDiffSettings;
  onChange: (updates: Partial<GlobalDiffSettings>) => void;
};

export function GlobalSettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="space-y-5 p-4">
      <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border">
        Global Settings
      </h3>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.sameTitle}
          onChange={(e) => onChange({ sameTitle: e.target.checked })}
          className="rounded accent-primary w-4 h-4"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Same Title</p>
          <p className="text-[10px] text-muted-foreground">All versions share the same worksheet title</p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.sameTheme}
          onChange={(e) => onChange({ sameTheme: e.target.checked })}
          className="rounded accent-primary w-4 h-4"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Same Visual Theme</p>
          <p className="text-[10px] text-muted-foreground">Consistent colors and styling across versions</p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.sameLayout}
          onChange={(e) => onChange({ sameLayout: e.target.checked })}
          className="rounded accent-primary w-4 h-4"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Same Page Layout</p>
          <p className="text-[10px] text-muted-foreground">Matching section order and page structure</p>
        </div>
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">Version Indicator (on printed copies)</label>
        <div className="flex flex-wrap gap-1.5">
          {([
            { value: "none", label: "None" },
            { value: "subtle-dot", label: "Subtle Dot" },
            { value: "corner-tab", label: "Corner Tab" },
            { value: "letter", label: "Letter (A, B, C)" },
          ] as { value: VersionIndicator; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ versionIndicator: opt.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                settings.versionIndicator === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">Print Mode</label>
        <div className="flex flex-wrap gap-1.5">
          {([
            { value: "all-together", label: "All Together" },
            { value: "separately", label: "Separately" },
          ] as { value: PrintMode; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ printMode: opt.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                settings.printMode === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
