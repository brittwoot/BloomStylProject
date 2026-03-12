import { useEffect, useRef, useState } from "react";
import type { CanvasLayer, SelectedObjectProps } from "./canvasTypes";

interface Suggestion {
  id: string;
  message: string;
  fixLabel?: string;
  onFix?: () => void;
}

interface Props {
  layers: CanvasLayer[];
  selectedProps: SelectedObjectProps | null;
  onFix?: (suggestion: Suggestion) => void;
}

export default function AISuggestionsChip({ layers, selectedProps, onFix }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (analysisTimer.current) clearTimeout(analysisTimer.current);
    analysisTimer.current = setTimeout(() => {
      analyze(layers);
    }, 1200);
    return () => {
      if (analysisTimer.current) clearTimeout(analysisTimer.current);
    };
  }, [layers]);

  function analyze(layers: CanvasLayer[]) {
    const next: Suggestion[] = [];

    const hasTitle = layers.some((l) => l.name === "Title");
    const hasDirections = layers.some((l) => l.name === "Directions" || l.name === "Directions BG");
    const hasNameDate = layers.some((l) => l.name.includes("Name"));

    if (layers.length > 0 && !hasTitle) {
      const id = "no-title";
      if (!dismissed.has(id)) {
        next.push({ id, message: "No title found — add one to the canvas?", fixLabel: "Add Title" });
      }
    }

    if (layers.length > 2 && !hasDirections) {
      const id = "no-directions";
      if (!dismissed.has(id)) {
        next.push({ id, message: "No directions found — students may not know what to do.", fixLabel: "Add Directions" });
      }
    }

    if (layers.length > 3 && !hasNameDate) {
      const id = "no-namedate";
      if (!dismissed.has(id)) {
        next.push({ id, message: "No name/date line — consider adding one at the top.", fixLabel: "Add Name Line" });
      }
    }

    setSuggestions(next.slice(0, 3));
  }

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="ai-chip-container">
      {!open ? (
        <button className="ai-chip" onClick={() => setOpen(true)}>
          ✦ {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
        </button>
      ) : (
        <div className="ai-chip-panel">
          <div className="ai-chip-header">
            <span className="ai-chip-title">✦ AI Suggestions</span>
            <button className="ai-chip-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          {suggestions.map((s) => (
            <div key={s.id} className="ai-chip-card">
              <p className="ai-chip-message">{s.message}</p>
              <div className="ai-chip-actions">
                {s.fixLabel && (
                  <button
                    className="btn-xs btn-primary-xs"
                    onClick={() => { onFix?.(s); dismiss(s.id); setOpen(false); }}
                  >
                    {s.fixLabel}
                  </button>
                )}
                <button className="btn-xs" onClick={() => dismiss(s.id)}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
