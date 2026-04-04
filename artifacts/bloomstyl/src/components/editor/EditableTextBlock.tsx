import React, { useRef, useState, useEffect, useMemo } from "react";
import { Pencil } from "lucide-react";
import { DEFAULT_TEXT_STYLE, type TextStyle } from "../../store";
import { useSectionActivation } from "./SectionActivationContext";
import { useSectionTextStyleOptional } from "./SectionTextStyleContext";

interface EditableTextBlockProps {
  value: string;
  onChange: (v: string) => void;
  textStyle?: Partial<TextStyle>;
  multiline?: boolean;
  alwaysEditing?: boolean;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onClick?: () => void;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  /** When set, used in view mode instead of plain text (e.g. math fraction rendering). */
  renderView?: (value: string) => React.ReactNode;
  hideEditHint?: boolean;
  subtleEditor?: boolean;
}

function buildStyleCSS(ts?: Partial<TextStyle>): React.CSSProperties {
  if (!ts) return {};
  return {
    fontFamily: ts.fontFamily ? `'${ts.fontFamily}', sans-serif` : undefined,
    fontSize: ts.fontSize ? `${ts.fontSize}px` : undefined,
    color: ts.fontColor ?? undefined,
    fontWeight: ts.bold ? "700" : undefined,
    fontStyle: ts.italic ? "italic" : undefined,
    textDecoration: ts.underline ? "underline" : undefined,
    textAlign: ts.alignment ?? undefined,
  };
}

export function EditableTextBlock({
  value,
  onChange,
  textStyle,
  multiline = false,
  alwaysEditing = false,
  placeholder = "Click to edit…",
  className = "",
  onFocus,
  onClick,
  renderView,
  hideEditHint = false,
  subtleEditor = false,
}: EditableTextBlockProps) {
  const activateSection = useSectionActivation();
  /** Select owning section for sidebar (context) + optional parent onFocus (e.g. explicit handlers). */
  const handleActivate = () => {
    onFocus?.();
    activateSection();
  };

  const safeValue = value ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(safeValue);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLTextAreaElement) {
        ref.current.setSelectionRange(draft.length, draft.length);
      }
    }
  }, [editing]);

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };

  const sectionTs = useSectionTextStyleOptional();
  const mergedTextStyle = useMemo(
    () =>
      ({
        ...DEFAULT_TEXT_STYLE,
        ...(sectionTs ?? {}),
        ...textStyle,
      }) as TextStyle,
    [sectionTs, textStyle],
  );

  const css = buildStyleCSS(mergedTextStyle);

  const listStyle = mergedTextStyle?.listStyle;
  const wrapList = listStyle && listStyle !== "none";
  const lines = safeValue.split("\n").filter(Boolean);

  // Always-editing mode: render input/textarea directly
  if (alwaysEditing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={Math.max(3, draft.split("\n").length + 1)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={handleActivate}
          onMouseDown={handleActivate}
          style={css}
          className={`w-full resize-none rounded-lg ${subtleEditor ? "border border-slate-200/80 bg-white/90" : "border-2 border-primary/40 bg-primary/5"} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onFocus={handleActivate}
        onMouseDown={handleActivate}
        style={css}
        className={`w-full rounded-lg ${subtleEditor ? "border border-slate-200/80 bg-white/90" : "border-2 border-primary/40 bg-primary/5"} px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
      />
    );
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={Math.max(3, draft.split("\n").length + 1)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={handleActivate}
          onMouseDown={handleActivate}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          style={css}
          className={`w-full resize-none rounded-lg ${subtleEditor ? "border border-slate-200/80 bg-white/90" : "border-2 border-primary/40 bg-primary/5"} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onFocus={handleActivate}
        onMouseDown={handleActivate}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={css}
        className={`w-full rounded-lg ${subtleEditor ? "border border-slate-200/80 bg-white/90" : "border-2 border-primary/40 bg-primary/5"} px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
      />
    );
  }

  // View mode — with edit hint on hover
  return (
    <span
      role="button"
      tabIndex={0}
      style={css}
      className={`group relative inline cursor-pointer rounded px-0.5 -mx-0.5 hover:bg-primary/8 transition-colors ${className}`}
      onClick={() => { onClick?.(); handleActivate(); setDraft(safeValue); setEditing(true); }}
      onFocus={handleActivate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setDraft(safeValue); setEditing(true); } }}
      title="Click to edit"
    >
      {wrapList ? (
        listStyle === "bullet" ? (
          <ul className="list-disc pl-5 space-y-1 w-full text-left">
            {lines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        ) : (
          <ol className="list-decimal pl-5 space-y-1 w-full text-left">
            {lines.map((l, i) => <li key={i}>{l}</li>)}
          </ol>
        )
      ) : renderView ? (
        safeValue ? (
          renderView(safeValue)
        ) : (
          <span className="text-muted-foreground/40 italic text-sm">{placeholder}</span>
        )
      ) : (
        safeValue || <span className="text-muted-foreground/40 italic text-sm">{placeholder}</span>
      )}
      {!hideEditHint && (
        <Pencil className="inline w-3 h-3 ml-1 text-primary/30 group-hover:text-primary/60 transition-colors align-middle" />
      )}
    </span>
  );
}
