import { useState } from "react";
import type { LevelType, LevelPreset } from "../../types/differentiationTypes";
import { LEVEL_PRESETS } from "../../types/differentiationTypes";

type Props = {
  onConfirm: (selectedLevels: LevelPreset[]) => void;
};

const LEVEL_TYPE_LABELS: Record<LevelType, { label: string; description: string }> = {
  grade: { label: "Grade Band", description: "Below, on, and above grade level" },
  readiness: { label: "Readiness", description: "Approaching, on-grade, and above" },
  ell: { label: "ELL Levels", description: "Beginning, intermediate, and advanced ELL" },
  "learning-profile": { label: "Learning Profile", description: "Dyslexia-friendly, reduced content, standard" },
};

export function LevelSelector({ onConfirm }: Props) {
  const [selectedType, setSelectedType] = useState<LevelType>("grade");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const presets = LEVEL_PRESETS[selectedType];

  const toggleLevel = (preset: LevelPreset) => {
    const next = new Set(selectedIds);
    if (next.has(preset.id)) {
      next.delete(preset.id);
    } else {
      if (next.size >= 5) return;
      next.add(preset.id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    const selected = presets.filter((p) => selectedIds.has(p.id));
    if (selected.length >= 2) {
      onConfirm(selected);
    }
  };

  const handleSelectType = (type: LevelType) => {
    setSelectedType(type);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LEVEL_TYPE_LABELS) as LevelType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleSelectType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === type
                ? "bg-primary text-white shadow-sm"
                : "bg-muted/50 text-foreground/70 hover:bg-muted border border-border"
            }`}
          >
            {LEVEL_TYPE_LABELS[type].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{LEVEL_TYPE_LABELS[selectedType].description}</p>

      <div className="space-y-2">
        {presets.map((preset) => {
          const isSelected = selectedIds.has(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => toggleLevel(preset)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-primary" : "border-border"
                }`}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.color }} />
              <span className="text-sm font-semibold text-foreground">{preset.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={selectedIds.size < 2}
        className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 hover:bg-primary/90 transition-all"
      >
        Create {selectedIds.size} Versions
      </button>
    </div>
  );
}
