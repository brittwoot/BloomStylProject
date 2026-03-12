import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Download, ArrowLeft, ChevronDown, ChevronUp, PanelRight, Check, RotateCcw, Pencil } from "lucide-react";
import { useBloomStore, DEFAULT_SECTION_STYLE, type SectionStyle, type GlobalTypography } from "../store";
import { StepIndicator } from "./UploadPage";
import { EditorSidebar } from "../components/editor/EditorSidebar";
import { EditableTextBlock } from "../components/editor/EditableTextBlock";
import { ExportModal } from "../components/ExportModal";
import { getHeadingCSS } from "../components/editor/fontData";
import {
  WordPracticeSection,
  WordSightRow,
  FillBlanksSection,
  SentencePracticeSection,
  ColoringActivitySection,
  TracingSection,
} from "../components/editor/ActivitySections";

// ── Typography helpers ─────────────────────────────────────────────────────────

function titleStyle(t: GlobalTypography): React.CSSProperties {
  const { containerStyle, textStyle } = getHeadingCSS(t.titleHeadingStyle, t.accentColor);
  return {
    fontFamily: `'${t.titleFont}', sans-serif`,
    color: t.titleColor,
    lineHeight: t.lineHeight,
    ...containerStyle,
    ...textStyle,
  };
}

function headingStyle(t: GlobalTypography): React.CSSProperties {
  return {
    fontFamily: `'${t.headingFont}', sans-serif`,
    color: t.headingColor,
  };
}

function bodyFontStyle(t: GlobalTypography): React.CSSProperties {
  return {
    fontFamily: `'${t.bodyFont}', sans-serif`,
    lineHeight: t.lineHeight,
    fontSize: `${14 * t.baseSize}px`,
  };
}

// ── CSS helpers ───────────────────────────────────────────────────────────────

function sectionCSS(style: SectionStyle): React.CSSProperties {
  return {
    backgroundColor: style.bgColor === "transparent" ? undefined : style.bgColor,
    border: style.borderStyle !== "none"
      ? `${style.borderWidth}px ${style.borderStyle} ${style.borderColor}`
      : undefined,
    borderRadius: style.rounded ? "12px" : undefined,
    padding: style.bgColor !== "transparent" || style.borderStyle !== "none" ? "16px" : undefined,
  };
}

// ── ClipartRow ───────────────────────────────────────────────────────────────

function ClipartRow({ sectionId }: { sectionId: string }) {
  const { sectionClipart, removeClipart } = useBloomStore();
  const items = sectionClipart[sectionId] ?? [];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {items.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => removeClipart(sectionId, c.id)}
          title={`Remove ${c.label} (click to remove)`}
          className="print:pointer-events-none group relative leading-none hover:opacity-80 transition-opacity"
        >
          <span className={c.size === "sm" ? "text-3xl" : c.size === "lg" ? "text-6xl" : "text-4xl"}>
            {c.emoji}
          </span>
          <span className="print:hidden absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
        </button>
      ))}
    </div>
  );
}

// ── WritingLines ──────────────────────────────────────────────────────────────

function WritingLines({ count = 3, accentColor }: { count: number; accentColor?: string }) {
  return (
    <div className="mt-2 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-b h-7"
          style={{ borderColor: accentColor ? `${accentColor}40` : "rgba(0,0,0,0.15)" }}
        />
      ))}
    </div>
  );
}

// ── QuestionItem ──────────────────────────────────────────────────────────────

function QuestionItem({
  q, number, sectionId, textStyle, globalTypo,
}: {
  q: any; number: number; sectionId: string; textStyle: any; globalTypo: GlobalTypography;
}) {
  const { updateQuestion } = useBloomStore();
  const type = q.question_type || q.type || "short_answer";
  const lines = q.lines ?? (type === "essay" ? 8 : 3);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-sm" style={bodyFontStyle(globalTypo)}>
        <span className="font-bold shrink-0">{number}.</span>
        <EditableTextBlock
          value={q.text ?? q.prompt ?? ""}
          onChange={(v) => updateQuestion(sectionId, q.id, { text: v, prompt: v })}
          multiline
          textStyle={textStyle}
          className="flex-1"
        />
      </div>
      {type === "multiple_choice" && Array.isArray(q.options) && q.options.length > 0 && (
        <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
          {q.options.map((opt: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={bodyFontStyle(globalTypo)}>
              <div
                className="w-4 h-4 rounded-full border shrink-0 mt-0.5"
                style={{ borderColor: `${globalTypo.accentColor}60` }}
              />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
      {type === "true_false" && (
        <div className="ml-5 flex gap-6 text-sm mt-1" style={bodyFontStyle(globalTypo)}>
          {["True", "False"].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ borderColor: `${globalTypo.accentColor}60` }}
              />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
      {(type === "short_answer" || type === "fill_in_blank" || type === "essay") && (
        <WritingLines count={lines} accentColor={globalTypo.accentColor} />
      )}
    </div>
  );
}

// ── SectionBlock ──────────────────────────────────────────────────────────────

function SectionBlock({
  section, index, total, isActive, onSelect, onMoveUp, onMoveDown, globalTypo,
}: {
  section: any; index: number; total: number;
  isActive: boolean; onSelect: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
  globalTypo: GlobalTypography;
}) {
  const { updateSection, updateQuestion, sectionStyles } = useBloomStore();
  const style: SectionStyle = sectionStyles[section.id] ?? DEFAULT_SECTION_STYLE;
  const ts = style.textStyle;

  return (
    <div
      className={`relative transition-all cursor-pointer ${
        isActive
          ? "ring-2 ring-primary/50 ring-offset-2 rounded-xl"
          : "hover:ring-1 hover:ring-primary/20 hover:ring-offset-1 rounded-xl"
      }`}
      onClick={onSelect}
    >
      <div style={sectionCSS(style)} className="space-y-4 rounded-xl">
        {/* Clipart row */}
        <ClipartRow sectionId={section.id} />

        {/* Section header */}
        <div className="flex items-start justify-between gap-3">
          <h2
            className="text-lg font-bold"
            style={{ ...headingStyle(globalTypo), fontFamily: `'${ts.fontFamily !== "DM Sans" ? ts.fontFamily : globalTypo.headingFont}', sans-serif`, color: ts.fontColor !== "#1a1a2e" ? ts.fontColor : globalTypo.headingColor }}
          >
            <EditableTextBlock
              value={section.title}
              onChange={(v) => updateSection(section.id, { title: v })}
              onFocus={onSelect}
              onClick={onSelect}
              textStyle={{ ...ts, bold: true, fontFamily: ts.fontFamily !== "DM Sans" ? ts.fontFamily : globalTypo.headingFont }}
            />
          </h2>

          {/* Reorder controls (print hidden) */}
          <div className="print:hidden flex gap-1 shrink-0">
            <button
              type="button"
              disabled={index === 0}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        {section.instructions && (
          <p className="text-sm italic text-foreground/70" style={bodyFontStyle(globalTypo)}>
            <EditableTextBlock
              value={section.instructions}
              onChange={(v) => updateSection(section.id, { instructions: v })}
              onFocus={onSelect}
              onClick={onSelect}
              multiline
              textStyle={ts}
            />
          </p>
        )}

        {/* Passage */}
        {section.type === "passage" && section.passage && (
          <div
            className="rounded-xl p-4 text-sm border border-border"
            style={{
              backgroundColor: style.bgColor !== "transparent" ? "rgba(255,255,255,0.5)" : "#f9f9f9",
              ...bodyFontStyle(globalTypo),
            }}
          >
            <EditableTextBlock
              value={section.passage}
              onChange={(v) => updateSection(section.id, { passage: v })}
              onFocus={onSelect}
              onClick={onSelect}
              multiline
              textStyle={ts}
            />
          </div>
        )}

        {/* Vocabulary */}
        {Array.isArray(section.vocabulary) && section.vocabulary.length > 0 && (
          <div className="space-y-2">
            {section.vocabulary.map((item: any, i: number) => (
              <div
                key={item.id || i}
                className="flex gap-2 text-sm"
                style={{ fontFamily: `'${globalTypo.vocabFont}', sans-serif`, fontSize: `${14 * globalTypo.baseSize}px`, color: ts.fontColor }}
              >
                <span className="font-bold shrink-0">{i + 1}.</span>
                <span className="font-semibold" style={{ color: globalTypo.headingColor }}>{item.word}</span>
                <span className="text-foreground/70">— {item.definition}</span>
              </div>
            ))}
          </div>
        )}

        {/* Questions */}
        {Array.isArray(section.questions) && section.questions.length > 0 && (
          <div className="space-y-5 mt-2">
            {section.questions.map((q: any, qi: number) => (
              <QuestionItem
                key={q.id || qi}
                q={q}
                number={qi + 1}
                sectionId={section.id}
                textStyle={{ ...ts, fontFamily: ts.fontFamily !== "DM Sans" ? ts.fontFamily : globalTypo.questionFont }}
                globalTypo={globalTypo}
              />
            ))}
          </div>
        )}

        {/* ── Activity-specific section renderers ── */}

        {section.type === "word_practice" && (
          <WordPracticeSection
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}

        {section.type === "word_sight_row" && (
          <WordSightRow
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}

        {section.type === "fill_blanks" && (
          <FillBlanksSection
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}

        {section.type === "sentence_practice" && (
          <SentencePracticeSection
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}

        {section.type === "coloring_activity" && (
          <ColoringActivitySection
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}

        {section.type === "tracing" && (
          <TracingSection
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
          />
        )}
      </div>

      {/* Active section indicator */}
      {isActive && (
        <div className="print:hidden absolute -top-3 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Pencil className="w-2.5 h-2.5" />
          Editing
        </div>
      )}
    </div>
  );
}

// ── Result page ───────────────────────────────────────────────────────────────

export function Result() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const {
    worksheet, settings, worksheetPageStyle, globalTypography,
    activeSectionId, setActiveSection,
    updateSection, reset,
  } = useBloomStore();

  useEffect(() => {
    if (!worksheet) setLocation("/");
  }, [worksheet, setLocation]);

  if (!worksheet) return null;

  const sections: any[] = worksheet.sections ?? [];
  const typo = globalTypography;

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const newSections = [...sections];
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    useBloomStore.setState((s) => ({
      worksheet: { ...s.worksheet, sections: newSections },
    }));
  };

  // Title wrapper for decorative heading style
  const { containerClass, containerStyle, textStyle: titleTextStyle } = getHeadingCSS(typo.titleHeadingStyle, typo.accentColor);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">

      {/* ── Main scroll area ── */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-16">

        {/* Action bar */}
        <div className="print:hidden sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
          <div className="max-w-[860px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { reset(); setLocation("/"); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New
              </button>
              <button
                onClick={() => setLocation("/settings")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground font-semibold hover:bg-muted/60 border border-border transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Settings
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                <Pencil className="w-3 h-3 text-primary" />
                Click any section or text to edit
              </div>
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold border transition-colors text-sm ${
                  sidebarOpen
                    ? "bg-primary text-white border-primary"
                    : "text-foreground border-border hover:bg-muted/60"
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                {sidebarOpen ? "Hide Editor" : "Open Editor"}
              </button>
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="print:hidden max-w-[860px] mx-auto px-4 pt-5 pb-2">
          <StepIndicator current={4} />
        </div>

        {/* ── Worksheet paper ── */}
        <div
          id="worksheet-paper"
          className="max-w-[860px] mx-auto sm:my-4 bg-white sm:rounded-2xl sm:shadow-xl overflow-hidden print:shadow-none print:rounded-none print:my-0"
          style={{ backgroundColor: worksheetPageStyle.bgColor }}
          onClick={() => setActiveSection(null)}
        >
          <div className="p-8 sm:p-14 print:p-0 space-y-1">

            {/* Name / Date header */}
            <div className="flex gap-8 justify-end mb-4">
              {settings.includeName && (
                <div className="flex-1 max-w-[260px]">
                  <p
                    className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    Name
                  </p>
                  <div
                    className="border-b h-6"
                    style={{ borderColor: `${typo.accentColor}50` }}
                  />
                </div>
              )}
              {settings.includeDate && (
                <div className="w-36">
                  <p
                    className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1"
                    style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                  >
                    Date
                  </p>
                  <div
                    className="border-b h-6"
                    style={{ borderColor: `${typo.accentColor}50` }}
                  />
                </div>
              )}
            </div>

            {/* Worksheet title with decorative heading style */}
            <div className="pb-5 mb-8 text-center border-b-2" style={{ borderColor: `${typo.accentColor}40` }}>
              <div className={`${containerClass} inline-block w-full`} style={containerStyle}>
                <h1
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: `'${typo.titleFont}', sans-serif`,
                    color: typo.titleColor,
                    ...titleTextStyle,
                  }}
                >
                  <EditableTextBlock
                    value={worksheet.title}
                    onChange={(v) =>
                      useBloomStore.setState((s) => ({
                        worksheet: { ...s.worksheet, title: v },
                      }))
                    }
                    textStyle={{ bold: true, fontFamily: typo.titleFont, fontSize: 28, fontColor: typo.titleColor, alignment: "center", italic: false, underline: false, listStyle: "none" }}
                  />
                </h1>
              </div>
              {(worksheet.subject || worksheet.gradeLevel) && (
                <p
                  className="text-base text-foreground/60 font-medium mt-2"
                  style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}
                >
                  {[worksheet.subject, worksheet.gradeLevel].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {/* Sections */}
            <div
              className="space-y-10"
              onClick={(e) => e.stopPropagation()}
            >
              {sections.map((section: any, i: number) => (
                <motion.div key={section.id || i} layout>
                  <SectionBlock
                    section={section}
                    index={i}
                    total={sections.length}
                    isActive={activeSectionId === section.id}
                    onSelect={() => setActiveSection(section.id)}
                    onMoveUp={() => moveSection(i, -1)}
                    onMoveDown={() => moveSection(i, 1)}
                    globalTypo={typo}
                  />
                </motion.div>
              ))}
            </div>

            {/* Answer Key */}
            {settings.generateAnswerKey && worksheet.answer_key && Object.keys(worksheet.answer_key).length > 0 && (
              <div className="mt-14 pt-8 border-t-2 border-dashed border-foreground/30 space-y-4">
                <h2
                  className="text-xl font-bold text-foreground flex items-center gap-2"
                  style={{ fontFamily: `'${typo.headingFont}', sans-serif`, color: typo.headingColor }}
                >
                  <Check className="w-5 h-5 text-green-600" />
                  Answer Key
                </h2>
                <div className="space-y-2 text-sm" style={{ fontFamily: `'${typo.bodyFont}', sans-serif` }}>
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
      </div>

      {/* ── Editor sidebar ── */}
      <EditorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Export modal ── */}
      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          worksheetTitle={worksheet.title}
        />
      )}
    </div>
  );
}
