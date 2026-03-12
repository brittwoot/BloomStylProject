import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useBloomStore } from "../store";
import { StepIndicator } from "./UploadPage";
import { Printer, ArrowLeft, Pencil, Check, ChevronDown, ChevronUp } from "lucide-react";

// ── Inline editable text ──────────────────────────────────────────────────────
function EditableText({
  value,
  onChange,
  className = "",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={Math.max(3, draft.split("\n").length)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className={`w-full resize-none rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`w-full rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
      />
    );
  }

  return (
    <span
      className={`group relative cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value}
      <Pencil className="inline w-3 h-3 ml-1 text-primary/40 group-hover:text-primary transition-colors" />
    </span>
  );
}

// ── Writing lines ─────────────────────────────────────────────────────────────
function WritingLines({ count = 3 }: { count: number }) {
  return (
    <div className="mt-2 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-foreground/20 h-6" />
      ))}
    </div>
  );
}

// ── Question renderer ─────────────────────────────────────────────────────────
function QuestionBlock({ q, number, sectionId, updateQuestion }: {
  q: any; number: number; sectionId: string;
  updateQuestion: (sectionId: string, qId: string, updates: any) => void;
}) {
  const type = q.question_type || q.type || "short_answer";
  const lines = q.lines ?? (type === "essay" ? 8 : 3);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-sm">
        <span className="font-bold text-foreground shrink-0">{number}.</span>
        <EditableText
          value={q.text}
          onChange={(v) => updateQuestion(sectionId, q.id, { text: v })}
          multiline
          className="text-foreground leading-relaxed"
        />
      </div>

      {type === "multiple_choice" && Array.isArray(q.options) && q.options.length > 0 && (
        <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
          {q.options.map((opt: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 rounded-full border border-foreground/40 shrink-0 mt-0.5" />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}

      {type === "true_false" && (
        <div className="ml-5 flex gap-6 text-sm mt-1">
          {["True", "False"].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-foreground/40" />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}

      {(type === "short_answer" || type === "fill_in_blank" || type === "essay") && (
        <WritingLines count={lines} />
      )}
    </div>
  );
}

// ── Section renderer ──────────────────────────────────────────────────────────
function SectionBlock({ section, index, total, onMoveUp, onMoveDown, updateSection, updateQuestion }: {
  section: any; index: number; total: number;
  onMoveUp: () => void; onMoveDown: () => void;
  updateSection: (id: string, u: any) => void;
  updateQuestion: (sectionId: string, qId: string, u: any) => void;
}) {
  return (
    <div className="space-y-4 print-break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">
          <EditableText value={section.title} onChange={(v) => updateSection(section.id, { title: v })} />
        </h2>
        <div className="print:hidden flex gap-1 shrink-0">
          <button disabled={index === 0} onClick={onMoveUp}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button disabled={index === total - 1} onClick={onMoveDown}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {section.instructions && (
        <p className="text-sm italic text-foreground/70">
          <EditableText value={section.instructions} onChange={(v) => updateSection(section.id, { instructions: v })} multiline />
        </p>
      )}

      {section.type === "passage" && section.passage && (
        <div className="bg-muted/30 rounded-xl p-4 text-sm leading-7 text-foreground whitespace-pre-wrap border border-border">
          <EditableText value={section.passage} onChange={(v) => updateSection(section.id, { passage: v })} multiline />
        </div>
      )}

      {Array.isArray(section.vocabulary) && section.vocabulary.length > 0 && (
        <div className="space-y-2">
          {section.vocabulary.map((item: any, i: number) => (
            <div key={item.id || i} className="flex gap-2 text-sm">
              <span className="font-bold">{i + 1}.</span>
              <span className="font-semibold">{item.word}</span>
              <span className="text-foreground/70">— {item.definition}</span>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(section.questions) && section.questions.length > 0 && (
        <div className="space-y-5 mt-2">
          {section.questions.map((q: any, qi: number) => (
            <QuestionBlock
              key={q.id || qi}
              q={q}
              number={qi + 1}
              sectionId={section.id}
              updateQuestion={updateQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Result page ───────────────────────────────────────────────────────────────
export function Result() {
  const [_, setLocation] = useLocation();
  const { worksheet, settings, updateSection, updateQuestion, reset } = useBloomStore();

  useEffect(() => {
    if (!worksheet) setLocation("/");
  }, [worksheet, setLocation]);

  if (!worksheet) return null;

  const sections: any[] = worksheet.sections || [];

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newSections = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    updateSection(newSections[idx].id, { order: idx + 1 });
    updateSection(newSections[target].id, { order: target + 1 });
    // Persist reorder in store
    useBloomStore.setState((s) => ({
      worksheet: { ...s.worksheet, sections: newSections },
    }));
  };

  const theme = worksheet.theme || settings?.theme || "clean";
  const themeClasses: Record<string, string> = {
    clean:     "font-sans",
    classroom: "font-sans bg-amber-50/30",
    fun:       "font-sans",
  };

  return (
    <div className={`min-h-screen pb-20 ${themeClasses[theme] || ""}`}>

      {/* Action bar */}
      <div className="print:hidden sticky top-16 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { reset(); setLocation("/"); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Start over
            </button>
            <button
              onClick={() => setLocation("/settings")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
            >
              Back to settings
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pencil className="w-3 h-3" />
            Click any text to edit inline
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
          >
            <Printer className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Step indicator (hidden in print) */}
      <div className="print:hidden max-w-[850px] mx-auto px-4 pt-6 pb-2">
        <StepIndicator current={4} />
      </div>

      {/* Printable worksheet */}
      <div className="max-w-[850px] mx-auto bg-white sm:rounded-2xl sm:shadow-xl sm:mt-4 p-8 sm:p-14 print:p-0 print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="border-b-2 border-foreground pb-6 mb-8 space-y-4">
          {/* Name / Date */}
          <div className="flex gap-8 justify-end text-sm">
            {settings.includeName && (
              <div className="flex-1 max-w-[260px]">
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-1">Name</p>
                <div className="border-b border-foreground/50 h-6" />
              </div>
            )}
            {settings.includeDate && (
              <div className="w-36">
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-1">Date</p>
                <div className="border-b border-foreground/50 h-6" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            <EditableText
              value={worksheet.title}
              onChange={(v) => updateSection(worksheet.worksheet_id, { title: v })}
            />
          </h1>

          {/* Subject / Grade */}
          <div className="flex justify-center items-center gap-2 text-base text-foreground/70 font-medium">
            {worksheet.subject && <span>{worksheet.subject}</span>}
            {worksheet.gradeLevel && <><span>·</span><span>{worksheet.gradeLevel}</span></>}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section: any, i: number) => (
            <SectionBlock
              key={section.id || i}
              section={section}
              index={i}
              total={sections.length}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
              updateSection={updateSection}
              updateQuestion={updateQuestion}
            />
          ))}
        </div>

        {/* Answer Key */}
        {settings.generateAnswerKey && worksheet.answer_key && Object.keys(worksheet.answer_key).length > 0 && (
          <div className="mt-14 pt-8 border-t-2 border-dashed border-foreground/30 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Answer Key
            </h2>
            <div className="space-y-2 text-sm">
              {Object.entries(worksheet.answer_key).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-semibold w-8">{k}.</span>
                  <span className="text-foreground/80">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
