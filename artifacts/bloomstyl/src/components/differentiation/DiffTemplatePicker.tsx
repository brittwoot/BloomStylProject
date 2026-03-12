import { useState } from "react";
import { Save, Trash2, BookOpen } from "lucide-react";
import type { DiffTemplate } from "../../types/differentiationTypes";
import { BUILT_IN_DIFF_TEMPLATES } from "../../types/differentiationTypes";
import { useDifferentiationStore } from "../../stores/differentiationStore";

type Props = {
  onApply: (template: DiffTemplate) => void;
};

export function DiffTemplatePicker({ onApply }: Props) {
  const { savedTemplates, saveTemplate, deleteTemplate, activeSet } = useDifferentiationStore();
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const allTemplates = [...BUILT_IN_DIFF_TEMPLATES, ...savedTemplates];

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveTemplate(saveName.trim());
    setSaveName("");
    setShowSave(false);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Differentiation Templates
        </h3>
        {activeSet && activeSet.versions.length > 1 && (
          <button
            type="button"
            onClick={() => setShowSave(!showSave)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Save className="w-3 h-3" />
            Save Current
          </button>
        )}
      </div>

      {showSave && (
        <div className="flex gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Template name…"
            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-white"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      <div className="space-y-2">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
            onClick={() => onApply(template)}
          >
            <div className="flex -space-x-1">
              {template.levels.map((level, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: level.color }}
                />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {template.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {template.levels.map((l) => l.label).join(" · ")}
              </p>
            </div>
            {template.builtIn && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Built-in
              </span>
            )}
            {!template.builtIn && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTemplate(template.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
