// NewSections.tsx — renderers for all new worksheet types from CustomizePage flow
// Each renderer accepts { section, onUpdate } and renders a print-friendly view.

import React from "react";
import { EditableTextBlock } from "./EditableTextBlock";

// ── Utilities ─────────────────────────────────────────────────────────────────

function WritingLines({ count = 5, label }: { count?: number; label?: string }) {
  return (
    <div className="space-y-1 mt-2">
      {label && <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-gray-300 h-6" />
      ))}
    </div>
  );
}

function SectionBox({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ── Graphic Organizers ─────────────────────────────────────────────────────────

export function MindMapSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const branches: string[] = section.branches || Array.from({ length: section.branchCount || 4 }, (_, i) => `Branch ${i + 1}`);
  const center = section.centerTerm || "Main Idea";
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-400 text-center italic">Fill in the mind map</p>
      <div className="relative flex items-center justify-center min-h-64">
        {/* Center bubble */}
        <div className="z-10 relative bg-primary/10 border-2 border-primary rounded-full px-6 py-4 text-center">
          <EditableTextBlock
            value={center}
            onChange={(v) => onUpdate({ centerTerm: v })}
            className="text-base font-bold text-primary text-center"
            placeholder="Main Idea"
          />
        </div>

        {/* Branch bubbles arranged around center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {branches.map((b, i) => {
            const count = branches.length;
            const angle = (360 / count) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 110;
            const x = Math.cos(rad) * r;
            const y = Math.sin(rad) * r;
            return (
              <div
                key={i}
                className="absolute flex items-center justify-center"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {/* Connector line (SVG trick using box-shadow) */}
                <div className="bg-gray-200 border border-gray-300 rounded-xl px-3 py-2 text-center min-w-[80px] max-w-[120px]">
                  <EditableTextBlock
                    value={b}
                    onChange={(v) => {
                      const next = [...branches];
                      next[i] = v;
                      onUpdate({ branches: next });
                    }}
                    className="text-xs text-center text-gray-700"
                    placeholder={`Branch ${i + 1}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function VennDiagramSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const leftLabel = section.leftLabel || "Topic A";
  const rightLabel = section.rightLabel || "Topic B";
  const centerLabel = section.centerLabel || "Both";
  const leftItems: string[] = section.leftItems || [];
  const rightItems: string[] = section.rightItems || [];
  const centerItems: string[] = section.centerItems || [];

  return (
    <div className="space-y-2">
      {/* Labels row */}
      <div className="grid grid-cols-3 text-center gap-2">
        <EditableTextBlock
          value={leftLabel}
          onChange={(v) => onUpdate({ leftLabel: v })}
          className="font-bold text-sm text-gray-700"
          placeholder="Topic A"
        />
        <EditableTextBlock
          value={centerLabel}
          onChange={(v) => onUpdate({ centerLabel: v })}
          className="font-bold text-sm text-gray-500"
          placeholder="Both"
        />
        <EditableTextBlock
          value={rightLabel}
          onChange={(v) => onUpdate({ rightLabel: v })}
          className="font-bold text-sm text-gray-700"
          placeholder="Topic B"
        />
      </div>

      {/* Three columns representing Venn areas */}
      <div className="grid grid-cols-3 gap-0 border-2 border-gray-300 rounded-xl overflow-hidden min-h-48">
        <div className="p-3 border-r border-gray-200 space-y-2">
          {leftItems.map((item, i) => (
            <EditableTextBlock
              key={i}
              value={item}
              onChange={(v) => {
                const next = [...leftItems];
                next[i] = v;
                onUpdate({ leftItems: next });
              }}
              className="text-xs text-gray-600 border-b border-gray-100 pb-1 block"
              placeholder="Left idea"
            />
          ))}
          {Array.from({ length: Math.max(0, 5 - leftItems.length) }).map((_, i) => (
            <div key={`empty-l-${i}`} className="h-5 border-b border-gray-100" />
          ))}
        </div>
        <div className="p-3 bg-gray-50 border-r border-gray-200 space-y-2">
          {centerItems.map((item, i) => (
            <EditableTextBlock
              key={i}
              value={item}
              onChange={(v) => {
                const next = [...centerItems];
                next[i] = v;
                onUpdate({ centerItems: next });
              }}
              className="text-xs text-gray-600 border-b border-gray-100 pb-1 text-center block"
              placeholder="Both"
            />
          ))}
          {Array.from({ length: Math.max(0, 5 - centerItems.length) }).map((_, i) => (
            <div key={`empty-c-${i}`} className="h-5 border-b border-gray-100" />
          ))}
        </div>
        <div className="p-3 space-y-2">
          {rightItems.map((item, i) => (
            <EditableTextBlock
              key={i}
              value={item}
              onChange={(v) => {
                const next = [...rightItems];
                next[i] = v;
                onUpdate({ rightItems: next });
              }}
              className="text-xs text-gray-600 border-b border-gray-100 pb-1 block"
              placeholder="Right idea"
            />
          ))}
          {Array.from({ length: Math.max(0, 5 - rightItems.length) }).map((_, i) => (
            <div key={`empty-r-${i}`} className="h-5 border-b border-gray-100" />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Draw a circle around each section to complete the Venn diagram.
      </p>
    </div>
  );
}

export function KWLChartSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const variant = section.variant || "KWL (3 columns)";
  const is4col = variant.includes("4");
  const rowCount = section.rowCount || 8;
  const cols = is4col
    ? (section.columns || ["K — What I Know", "W — Want to Know", "H — How to Find Out", "L — Learned"])
    : (section.columns || ["K — What I Know", "W — Want to Know", "L — Learned"]);

  return (
    <div>
      <div className={`grid divide-x divide-gray-300 border border-gray-300 rounded-xl overflow-hidden`}
        style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map((col, ci) => (
          <div key={ci}>
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <EditableTextBlock
                value={col}
                onChange={(v) => {
                  const next = [...cols];
                  next[ci] = v;
                  onUpdate({ columns: next });
                }}
                className="text-xs font-bold text-gray-700 text-center"
                placeholder="Column label"
              />
            </div>
            <div className="p-2">
              {Array.from({ length: rowCount }).map((_, i) => (
                <div key={i} className="border-b border-gray-200 h-6" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SequenceChartSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const steps: any[] = section.steps || Array.from({ length: section.stepCount || 4 }, (_, i) => ({
    id: `step${i + 1}`, number: i + 1, title: "", content: "",
  }));
  const linesPerStep = section.linesPerStep || 3;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={step.id || i} className="flex gap-3 items-start">
          {/* Step number */}
          <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{step.number || i + 1}</span>
          </div>
          {/* Step box */}
          <div className="flex-1 border border-gray-300 rounded-lg p-3 space-y-1.5">
            <EditableTextBlock
              value={step.title || ""}
              onChange={(v) => {
                const next = [...steps];
                next[i] = { ...next[i], title: v };
                onUpdate({ steps: next });
              }}
              className="text-sm font-bold text-gray-700 block"
              placeholder={`Step ${i + 1} title`}
            />
            <EditableTextBlock
              value={step.content || ""}
              onChange={(v) => {
                const next = [...steps];
                next[i] = { ...next[i], content: v };
                onUpdate({ steps: next });
              }}
              className="text-xs text-gray-500 block"
              multiline
              placeholder="Step details…"
            />
            {Array.from({ length: linesPerStep }).map((_, li) => (
              <div key={li} className="border-b border-gray-200 h-5" />
            ))}
          </div>
          {/* Arrow (except last) */}
          {i < steps.length - 1 && (
            <div className="text-gray-300 text-2xl self-center shrink-0">↓</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FrayerModelSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const centerTerm = section.centerTerm || "";
  const quadrants = [
    { key: "q1", label: section.q1Label || "Definition", content: section.q1Content || "" },
    { key: "q2", label: section.q2Label || "Example", content: section.q2Content || "" },
    { key: "q3", label: section.q3Label || "Non-Example", content: section.q3Content || "" },
    { key: "q4", label: section.q4Label || "Draw It", content: section.q4Content || "" },
  ];

  return (
    <div className="space-y-2">
      {/* 2x2 grid with center */}
      <div className="relative border-2 border-gray-400 rounded-xl overflow-hidden min-h-64">
        <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-gray-400" style={{ minHeight: 256 }}>
          {quadrants.map((q, i) => (
            <div key={q.key} className="p-3 space-y-2">
              <EditableTextBlock
                value={q.label}
                onChange={(v) => {
                  const key = q.key;
                  const labelKey = `${key}Label`;
                  onUpdate({ [labelKey]: v });
                }}
                className="text-xs font-bold text-gray-600 uppercase tracking-wide border-b pb-1 block"
                placeholder="Label"
              />
              <EditableTextBlock
                value={q.content}
                onChange={(v) => {
                  const key = q.key;
                  const contentKey = `${key}Content`;
                  onUpdate({ [contentKey]: v });
                }}
                className="text-xs text-gray-600 block"
                multiline
                placeholder="Notes…"
              />
              {Array.from({ length: 4 }).map((_, li) => (
                <div key={li} className="border-b border-gray-200 h-5" />
              ))}
            </div>
          ))}
        </div>
        {/* Center term overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white border-2 border-primary rounded-full px-4 py-2 shadow-md">
            <p className="font-black text-sm text-primary text-center whitespace-nowrap">
              {centerTerm || "Term"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryMapSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const fields: any[] = section.fields || [
    { label: "Characters", content: "" },
    { label: "Setting", content: "" },
    { label: "Problem", content: "" },
    { label: "Event 1", content: "" },
    { label: "Event 2", content: "" },
    { label: "Solution", content: "" },
  ];

  return (
    <div className="space-y-2">
      {/* First row: Characters + Setting + Problem */}
      <div className="grid grid-cols-3 gap-2">
        {fields.slice(0, 3).map((f, i) => (
          <SectionBox key={i} label={f.label}>
            <EditableTextBlock
              value={f.content || ""}
              onChange={(v) => {
                const next = [...fields];
                next[i] = { ...next[i], content: v };
                onUpdate({ fields: next });
              }}
              className="text-xs text-gray-600 block"
              multiline
              placeholder={f.label}
            />
            <WritingLines count={3} />
          </SectionBox>
        ))}
      </div>
      {/* Event boxes */}
      {fields.slice(3).map((f, i) => (
        <SectionBox key={i + 3} label={f.label}>
          <EditableTextBlock
            value={f.content || ""}
            onChange={(v) => {
              const idx = i + 3;
              const next = [...fields];
              next[idx] = { ...next[idx], content: v };
              onUpdate({ fields: next });
            }}
            className="text-xs text-gray-600 block"
            multiline
            placeholder={f.label}
          />
          <WritingLines count={2} />
        </SectionBox>
      ))}
    </div>
  );
}

// ── Writing ────────────────────────────────────────────────────────────────────

export function AcrosticSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const word = (section.acrosticWord || "WORD").toUpperCase();
  const linesPerLetter = section.linesPerLetter || 1;

  return (
    <div className="space-y-3">
      {word.split("").map((letter, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-primary">{letter}</span>
          </div>
          <div className="flex-1 space-y-1 pt-1">
            {Array.from({ length: linesPerLetter }).map((_, li) => (
              <div key={li} className="border-b-2 border-gray-300 h-7" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniBookSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const panels: any[] = section.panels || Array.from({ length: section.panelCount || 4 }, (_, i) => ({
    id: `p${i + 1}`, number: i + 1, label: `Page ${i + 1}`, prompt: "",
  }));
  const cols = panels.length <= 4 ? 2 : 3;

  return (
    <div>
      <p className="text-[11px] text-gray-400 text-center mb-2">Cut and fold to make a mini book</p>
      <div className={`grid grid-cols-${cols} gap-2 border-2 border-dashed border-gray-300 rounded-xl p-3`}>
        {panels.map((panel, i) => (
          <div key={panel.id || i} className="border border-gray-300 rounded-lg p-3 min-h-28 space-y-2">
            {/* Illustration box */}
            <div className="border border-gray-200 rounded h-16 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] text-gray-300">Draw here</span>
            </div>
            <p className="text-[10px] font-bold text-gray-500">{panel.label || `Page ${i + 1}`}</p>
            {panel.prompt ? <p className="text-[11px] text-gray-500 italic">{panel.prompt}</p> : null}
            <div className="border-b border-gray-300 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WritingPromptHeader({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const lineCount = section.lineCount || 15;
  const illustrationBox = section.illustrationBox || "None";

  return (
    <div className="space-y-4">
      {/* Illustration box - Top */}
      {illustrationBox === "Top" && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center bg-gray-50">
          <span className="text-sm text-gray-300">Illustration Space</span>
        </div>
      )}

      {/* Prompt box */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Writing Prompt</p>
        <EditableTextBlock
          value={section.prompt || ""}
          onChange={(v) => onUpdate({ prompt: v })}
          className="text-sm font-medium text-foreground leading-relaxed"
          placeholder="Your writing prompt will appear here…"
        />
      </div>

      {/* Side illustration */}
      {illustrationBox === "Side" && (
        <div className="flex gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl w-32 shrink-0 flex items-center justify-center bg-gray-50">
            <span className="text-[10px] text-gray-300 rotate-90">Draw</span>
          </div>
          <div className="flex-1">
            <WritingLines count={lineCount} />
          </div>
        </div>
      )}

      {/* Normal lines */}
      {illustrationBox !== "Side" && <WritingLines count={lineCount} />}

      {/* Bottom illustration */}
      {illustrationBox === "Bottom" && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center bg-gray-50">
          <span className="text-sm text-gray-300">Illustration Space</span>
        </div>
      )}
    </div>
  );
}

export function WordBankSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const words: string[] = section.words || [];
  return (
    <div className="border border-gray-300 rounded-xl p-3 bg-blue-50/30">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Word Bank</p>
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <span key={i} className="text-sm font-medium border border-gray-300 bg-white px-3 py-1 rounded-lg">
            {w}
          </span>
        ))}
        {words.length === 0 && (
          <span className="text-xs text-gray-400 italic">Word bank words will appear here</span>
        )}
      </div>
    </div>
  );
}

export function SentenceFramesSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const frames: any[] = section.frames || [];
  const linesPerFrame = section.writingLines || 2;
  return (
    <div className="space-y-4">
      {frames.map((frame, i) => (
        <div key={frame.id || i} className="space-y-1">
          <p className="text-sm font-bold text-foreground">{frame.stem || `Sentence ${i + 1}: ___`}</p>
          {Array.from({ length: linesPerFrame }).map((_, li) => (
            <div key={li} className="border-b-2 border-gray-300 h-7" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Math ──────────────────────────────────────────────────────────────────────

export function NumberBondSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const bonds: any[] = section.bonds || Array.from({ length: section.bondCount || 6 }, (_, i) => ({
    whole: null, part1: null, part2: null,
  }));
  const cols = bonds.length <= 4 ? 2 : 3;

  return (
    <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, 1fr)` }}>
      {bonds.map((bond, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          {/* Whole (top) */}
          <div className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white">
            <span className="font-bold text-sm text-gray-700">{bond.whole ?? ""}</span>
          </div>
          {/* Divider line */}
          <div className="w-24 h-px bg-gray-400 relative">
            <div className="absolute left-0 top-0 w-12 h-4 border-l-2 border-gray-300" style={{ height: 8, borderLeft: "2px solid #aaa", transform: "rotate(30deg) translateX(0px) translateY(4px)" }} />
            <div className="absolute right-0 top-0 w-12 h-4" style={{ height: 8, borderRight: "2px solid #aaa", transform: "rotate(-30deg) translateX(0px) translateY(4px)" }} />
          </div>
          {/* Parts (bottom two) */}
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white">
              <span className="font-bold text-sm text-gray-700">{bond.part1 ?? ""}</span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white">
              <span className="font-bold text-sm text-gray-700">{bond.part2 ?? ""}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TenFrameSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const frameCount = section.frameCount || 4;
  const problems: any[] = section.problems || Array.from({ length: frameCount }, (_, i) => ({ number: null }));
  const cols = frameCount <= 2 ? 1 : 2;

  return (
    <div className="space-y-6">
      {problems.map((prob, pi) => (
        <div key={pi} className="space-y-2">
          {prob.number !== null && (
            <p className="text-sm font-bold text-gray-700">Show the number: {prob.number}</p>
          )}
          <div className="border-2 border-gray-400 rounded-lg overflow-hidden inline-block">
            <div className="grid grid-cols-5">
              {Array.from({ length: 10 }).map((_, ci) => (
                <div
                  key={ci}
                  className="w-10 h-10 border border-gray-300 flex items-center justify-center"
                  style={{ borderTop: ci >= 5 ? "2px solid #666" : undefined }}
                />
              ))}
            </div>
          </div>
          {section.activity === "Write the number" && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Number:</span>
              <div className="w-16 border-b-2 border-gray-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ClockPracticeSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const clockCount = section.clockCount || 6;
  const times: string[] = section.times || Array.from({ length: clockCount }, (_, i) => "");
  const direction = section.direction || "Draw the hands";
  const cols = Math.min(clockCount, 3);

  return (
    <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: clockCount }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          {/* Clock circle */}
          <div className="w-24 h-24 rounded-full border-2 border-gray-700 bg-white relative flex items-center justify-center">
            {/* Hour markers */}
            {[12, 3, 6, 9].map((n, ni) => {
              const angle = ni * 90 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * 36 + 48;
              const y = Math.sin(rad) * 36 + 48;
              return (
                <span
                  key={n}
                  className="absolute text-[10px] font-bold text-gray-700"
                  style={{ left: x - 6, top: y - 7, width: 14, textAlign: "center" }}
                >
                  {n}
                </span>
              );
            })}
            {/* Center dot */}
            <div className="w-2 h-2 rounded-full bg-gray-700 z-10" />
          </div>

          {/* Time label or blank */}
          {direction === "Write the time" ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-600">Time:</span>
              <div className="w-16 border-b-2 border-gray-400" />
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-700 text-center">
              {times[i] ? `Show ${times[i]}` : `__:__`}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Science / Social Studies ──────────────────────────────────────────────────

export function LabelDiagramSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const parts: string[] = section.parts || ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5", "Part 6"];
  const subject = section.subject || "";
  const hasWordBank = section.wordBank !== false;

  return (
    <div className="space-y-4">
      {/* Illustration placeholder */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl min-h-48 bg-gray-50 flex items-center justify-center relative">
        <div className="text-center">
          <p className="text-sm text-gray-400 font-medium">Diagram: {subject || "Illustration"}</p>
          <p className="text-[11px] text-gray-300">Label the numbered parts</p>
        </div>
        {/* Numbered callout indicators */}
        {parts.map((_, i) => {
          const angles = [15, 60, 110, 160, 200, 300, 350];
          const angle = (angles[i] || i * 51) * Math.PI / 180;
          const r = 70;
          const x = Math.cos(angle) * r + 50;
          const y = Math.sin(angle) * r + 50;
          return (
            <div
              key={i}
              className="absolute w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Label lines */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {parts.map((part, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary text-[10px] font-bold text-primary flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <EditableTextBlock
              value={part}
              onChange={(v) => {
                const next = [...parts];
                next[i] = v;
                onUpdate({ parts: next });
              }}
              className="flex-1 text-xs text-gray-700 border-b border-gray-300 h-6 flex items-center"
              placeholder={`Label ${i + 1}`}
            />
          </div>
        ))}
      </div>

      {/* Word bank */}
      {hasWordBank && (
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Word Bank</p>
          <div className="flex flex-wrap gap-2">
            {parts.map((part, i) => (
              <span key={i} className="text-xs border border-gray-300 bg-white px-2 py-1 rounded">
                {part}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ObservationSheetSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const sections_: string[] = section.sections || ["My Hypothesis:", "What I Observed:", "What I Learned:"];
  const includeDrawing = section.includeDrawing !== false;

  return (
    <div className="space-y-4">
      {sections_.map((label, i) => (
        <SectionBox key={i} label={label}>
          <WritingLines count={4} />
        </SectionBox>
      ))}
      {includeDrawing && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl min-h-32 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">My Drawing / Observations</p>
        </div>
      )}
    </div>
  );
}

export function TimelineSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const events: any[] = section.events || Array.from({ length: 5 }, (_, i) => ({ id: `e${i + 1}`, label: `Event ${i + 1}`, content: "" }));
  const orientation = section.orientation || "Horizontal";

  if (orientation === "Horizontal") {
    return (
      <div className="space-y-2 overflow-x-auto pb-4">
        <div className="flex items-center gap-0 min-w-max">
          {events.map((event, i) => (
            <div key={event.id || i} className="flex items-center">
              {/* Event box */}
              <div className="flex flex-col items-center gap-2" style={{ width: 120 }}>
                <div className="w-full border border-gray-300 rounded-lg p-2 min-h-16 text-center">
                  <EditableTextBlock
                    value={event.label || ""}
                    onChange={(v) => {
                      const next = [...events];
                      next[i] = { ...next[i], label: v };
                      onUpdate({ events: next });
                    }}
                    className="text-[10px] font-bold text-gray-500 mb-1 block"
                    placeholder={`Event ${i + 1}`}
                  />
                  <EditableTextBlock
                    value={event.content || ""}
                    onChange={(v) => {
                      const next = [...events];
                      next[i] = { ...next[i], content: v };
                      onUpdate({ events: next });
                    }}
                    className="text-[11px] text-gray-600 block"
                    multiline
                    placeholder="Event details…"
                  />
                  <div className="border-b border-gray-200 h-4" />
                </div>
                {/* Dot on timeline */}
                <div className="w-4 h-4 rounded-full border-2 border-primary bg-white" />
              </div>
              {/* Arrow */}
              {i < events.length - 1 && (
                <div className="flex items-center gap-0 mb-8">
                  <div className="w-8 h-0.5 bg-primary" />
                  <span className="text-primary text-xs">▶</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Vertical line */}
      <div className="flex flex-col items-center gap-0">
        {events.map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full border-2 border-primary bg-white shrink-0" />
            {i < events.length - 1 && <div className="w-0.5 h-12 bg-primary/30" />}
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 space-y-2">
        {events.map((event, i) => (
          <div key={event.id || i} className="border border-gray-300 rounded-lg p-3 min-h-14">
            <EditableTextBlock
              value={event.label || ""}
              onChange={(v) => {
                const next = [...events];
                next[i] = { ...next[i], label: v };
                onUpdate({ events: next });
              }}
              className="text-xs font-bold text-gray-500 mb-1 block"
              placeholder={`Event ${i + 1}`}
            />
            <EditableTextBlock
              value={event.content || ""}
              onChange={(v) => {
                const next = [...events];
                next[i] = { ...next[i], content: v };
                onUpdate({ events: next });
              }}
              className="text-xs text-gray-600 block"
              multiline
              placeholder="Event details…"
            />
            <div className="border-b border-gray-200 h-4 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineMatchingSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const pairs: any[] = section.pairs || [];
  const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 text-center italic mb-3">Draw a line to match each pair.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border border-gray-400 text-[10px] flex items-center justify-center text-gray-500">{i + 1}</span>
              <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
                {pair.left}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {shuffledRight.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
                {pair.right}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CutAndSortSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const categories: string[] = section.categories || ["Category A", "Category B"];
  const items: string[] = section.items || [];
  const cols = categories.length;

  return (
    <div className="space-y-4">
      {/* Category headers */}
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {categories.map((cat, i) => (
          <div key={i} className="border-2 border-gray-400 rounded-xl min-h-32 p-3">
            <div className="border-b-2 border-gray-400 pb-2 mb-3">
              <p className="font-bold text-sm text-center text-gray-700">{cat}</p>
            </div>
            {/* Empty paste area */}
            <div className="min-h-16 border border-dashed border-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Cut-out items */}
      <div className="border-2 border-dashed border-gray-400 rounded-xl p-3 bg-gray-50">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 text-center">✂️ Cut these out and sort them above</p>
        <div className="grid grid-cols-4 gap-2">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-400 rounded px-2 py-1.5 text-xs text-center font-medium text-gray-700 bg-white">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Games ─────────────────────────────────────────────────────────────────────

export function BingoCardSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const is5x5 = (section.gridSize || "5×5") === "5×5";
  const cols = is5x5 ? 5 : 4;
  const rows = is5x5 ? 5 : 4;
  const totalCells = cols * rows;
  const hasFreeSpace = section.freeSpace !== false;
  const words: string[] = section.wordList || [];
  const freeIndex = hasFreeSpace ? Math.floor(totalCells / 2) : -1;

  // Fill grid with words, shuffled
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const cells: string[] = [];
  let wordIdx = 0;
  for (let i = 0; i < totalCells; i++) {
    if (i === freeIndex) {
      cells.push("FREE");
    } else {
      cells.push(shuffled[wordIdx++] || "");
    }
  }

  const letters = is5x5 ? ["B", "I", "N", "G", "O"] : ["B", "I", "N", "G"];

  return (
    <div className="space-y-2">
      {/* BINGO header */}
      <div className={`grid`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {letters.map((l) => (
          <div key={l} className="bg-primary text-white font-black text-lg text-center py-2">
            {l}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className={`grid border border-gray-400`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`border border-gray-300 flex items-center justify-center text-center min-h-10 p-1 text-[11px] font-semibold ${
              cell === "FREE" ? "bg-primary/10 text-primary font-black" : "text-gray-700"
            }`}
          >
            {cell === "FREE" ? "★ FREE ★" : cell}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FullWordSearchSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const words: string[] = section.wordList || [];
  const sizeStr = section.gridSize || "10×10";
  const dim = parseInt(sizeStr.split("×")[0]) || 10;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Simple grid generator - place words horizontally and vertically, fill rest randomly
  const grid: string[][] = Array.from({ length: dim }, () =>
    Array.from({ length: dim }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)])
  );

  // Place words horizontally
  const directions = section.directions || "Horiz + Vertical";
  words.slice(0, Math.floor(dim / 2)).forEach((word) => {
    const w = word.toUpperCase().replace(/\s/g, "");
    if (w.length > dim) return;
    let placed = false;
    for (let attempt = 0; attempt < 20 && !placed; attempt++) {
      const row = Math.floor(Math.random() * dim);
      const col = Math.floor(Math.random() * (dim - w.length + 1));
      for (let i = 0; i < w.length; i++) grid[row][col + i] = w[i];
      placed = true;
    }
  });

  if (directions !== "Horizontal only") {
    words.slice(Math.floor(dim / 2)).forEach((word) => {
      const w = word.toUpperCase().replace(/\s/g, "");
      if (w.length > dim) return;
      let placed = false;
      for (let attempt = 0; attempt < 20 && !placed; attempt++) {
        const col = Math.floor(Math.random() * dim);
        const row = Math.floor(Math.random() * (dim - w.length + 1));
        for (let i = 0; i < w.length; i++) grid[row + i][col] = w[i];
        placed = true;
      }
    });
  }

  const fontSize = dim <= 8 ? "text-sm" : dim <= 10 ? "text-[11px]" : "text-[9px]";

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="inline-block border-2 border-gray-400 rounded-lg overflow-hidden font-mono">
        {grid.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={`w-7 h-7 flex items-center justify-center border-b border-r border-gray-200 font-bold text-gray-700 ${fontSize}`}
                style={{ borderBottom: ri === dim - 1 ? "none" : undefined, borderRight: ci === row.length - 1 ? "none" : undefined }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Word list */}
      {section.showWordList !== false && words.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Find these words:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {words.map((w, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
                <div className="w-3 h-3 rounded border border-gray-400" />
                {w}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SpinnerSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const sectionCount = section.sections || 6;
  const labels: string[] = section.sectionLabels || Array.from({ length: sectionCount }, (_, i) => `Option ${i + 1}`);
  const hasRecord = section.recordSheet !== false;
  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize / 2 - 10;

  const slices = Array.from({ length: sectionCount });
  const angleStep = (2 * Math.PI) / sectionCount;
  const colors = ["#f97316","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#ec4899","#3b82f6","#22c55e"];

  const getArc = (i: number) => {
    const startAngle = i * angleStep - Math.PI / 2;
    const endAngle = (i + 1) * angleStep - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angleStep > Math.PI ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
  };

  const getLabelPos = (i: number) => {
    const midAngle = (i + 0.5) * angleStep - Math.PI / 2;
    return {
      x: cx + (r * 0.65) * Math.cos(midAngle),
      y: cy + (r * 0.65) * Math.sin(midAngle),
    };
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      {/* Spinner SVG */}
      <div className="relative">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {slices.map((_, i) => {
            const pos = getLabelPos(i);
            const label = labels[i] || `${i + 1}`;
            return (
              <g key={i}>
                <path d={getArc(i)} fill={colors[i % colors.length]} stroke="white" strokeWidth="2" />
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="white">
                  {label.slice(0, 8)}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={8} fill="white" stroke="#666" strokeWidth="2" />
        </svg>
        <p className="text-[10px] text-center text-gray-400 mt-1">Use a pencil + paper clip as a spinner</p>
      </div>

      {/* Record sheet */}
      {hasRecord && (
        <div className="w-full border border-gray-300 rounded-xl p-3">
          <p className="text-xs font-bold text-gray-600 mb-2">Tally Sheet</p>
          <div className="grid grid-cols-2 gap-2">
            {labels.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] + "40", border: `1px solid ${colors[i % colors.length]}` }}
                />
                <span className="text-xs text-gray-600 truncate">{l}</span>
                <div className="flex-1 border-b border-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DiceActivitySection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const activityTitle = section.activityTitle || "Write";
  const faces = section.faces || ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const instructions: string[] = section.instructions || Array.from({ length: 6 }, (_, i) => `Action for ${i + 1}`);

  return (
    <div className="space-y-4">
      <p className="text-base font-bold text-center text-gray-700">Roll and {activityTitle}!</p>
      <div className="grid grid-cols-2 gap-3">
        {faces.map((face, i) => (
          <div key={i} className="flex items-center gap-3 border border-gray-300 rounded-xl p-3">
            <span className="text-3xl shrink-0">{face}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">{instructions[i] || ""}</p>
              <div className="border-b border-gray-300 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GraphPageSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const maxValue = section.maxValue || 10;
  const categories: string[] = section.categories || ["A", "B", "C", "D"];
  const graphType = section.graphType || "Bar graph";

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-center text-gray-700">{section.title || graphType}</p>
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        {/* Y-axis + grid */}
        <div className="flex">
          {/* Y-axis labels */}
          <div className="w-10 flex flex-col-reverse justify-between py-2 pr-1">
            {Array.from({ length: 6 }).map((_, i) => {
              const val = Math.round((maxValue / 5) * i);
              return (
                <span key={i} className="text-[9px] text-gray-500 text-right">{val}</span>
              );
            })}
          </div>
          {/* Chart area */}
          <div className="flex-1 border-l border-b border-gray-400 bg-white relative" style={{ height: 160 }}>
            {/* Horizontal grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-b border-gray-100"
                style={{ bottom: `${(i + 1) * 20}%` }}
              />
            ))}
            {/* Empty columns */}
            <div className="absolute inset-0 flex items-end gap-2 px-4 pb-1">
              {categories.map((cat, ci) => (
                <div key={ci} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full border-2 border-dashed border-gray-300 bg-gray-50 rounded-t" style={{ height: 80 }} />
                  <span className="text-[9px] text-gray-600 text-center truncate w-full">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* X-axis label */}
      <p className="text-[10px] text-center text-gray-400">{section.xLabel || "Categories"}</p>
    </div>
  );
}

export function ColoringPageSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 text-center">{section.instructions || "Color the picture below."}</p>
      {/* Big illustration placeholder */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex items-center justify-center"
        style={{ minHeight: section.size === "Half page" ? 160 : 320 }}
      >
        <div className="text-center space-y-2">
          <p className="text-4xl">🖍️</p>
          <p className="text-sm text-gray-400 font-medium">Coloring Illustration</p>
          <p className="text-xs text-gray-300">{section.theme || "Theme"}</p>
        </div>
      </div>
      {section.addWritingLines && (
        <WritingLines count={section.lineCount || 3} label="Write about your picture:" />
      )}
    </div>
  );
}

export function ColorByCodeSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const colorKey: any[] = section.colorKey || [];
  return (
    <div className="space-y-4">
      {/* Color Key */}
      <div className="border border-gray-300 rounded-xl p-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Color Key</p>
        <div className="flex flex-wrap gap-3">
          {colorKey.map((ck, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: ck.color }} />
              <span className="text-sm font-semibold text-gray-700">= {ck.code}</span>
            </div>
          ))}
          {colorKey.length === 0 && (
            <p className="text-xs text-gray-400 italic">Color key will appear here</p>
          )}
        </div>
      </div>
      {/* Illustration placeholder */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex items-center justify-center" style={{ minHeight: 220 }}>
        <div className="text-center space-y-2">
          <p className="text-3xl">🎨</p>
          <p className="text-sm text-gray-400 font-medium">Color-by-Code Illustration</p>
          <p className="text-xs text-gray-300">{section.theme || "Theme"} — regions labeled with color codes</p>
        </div>
      </div>
    </div>
  );
}

export function PictureSortSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const categories: string[] = section.categories || ["Category A", "Category B"];
  const cards: string[] = section.cards || [];

  return (
    <div className="space-y-4">
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((cat, i) => (
          <div key={i} className="border-2 border-gray-400 rounded-xl min-h-28 p-3">
            <p className="font-bold text-sm text-center text-gray-700 border-b border-gray-300 pb-2 mb-3">{cat}</p>
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="border border-dashed border-gray-200 rounded h-8 bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-2 border-dashed border-gray-400 rounded-xl p-3 bg-gray-50">
        <p className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2">✂️ Picture Cards — Cut and sort above</p>
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, i) => (
            <div key={i} className="border border-gray-400 rounded-lg p-2 text-xs text-center font-medium bg-white">
              <div className="h-10 border border-gray-200 rounded bg-gray-50 mb-1 flex items-center justify-center">
                <span className="text-[9px] text-gray-300">🖼</span>
              </div>
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CrosswordSection({ section, onUpdate }: { section: any; onUpdate: (u: any) => void }) {
  const clues: any[] = section.clues || [];
  const across = clues.filter((c) => c.direction === "Across");
  const down = clues.filter((c) => c.direction === "Down");

  return (
    <div className="space-y-4">
      {/* Grid placeholder */}
      <div className="border-2 border-gray-400 rounded-xl overflow-hidden">
        <div className="grid bg-gray-700" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
          {Array.from({ length: 12 * 8 }).map((_, i) => {
            const isBlocked = Math.random() < 0.3;
            const num = i % 13 === 0 && !isBlocked ? Math.floor(i / 13) + 1 : null;
            return (
              <div
                key={i}
                className={`w-7 h-7 border border-gray-500 relative ${isBlocked ? "bg-gray-700" : "bg-white"}`}
              >
                {num && (
                  <span className="absolute top-0 left-0 text-[7px] text-gray-500 leading-none p-0.5">{num}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clues */}
      <div className="grid grid-cols-2 gap-4">
        {across.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Across</p>
            <div className="space-y-1">
              {across.map((c, i) => (
                <p key={i} className="text-xs text-gray-600">{c.number}. {c.clue}</p>
              ))}
            </div>
          </div>
        )}
        {down.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Down</p>
            <div className="space-y-1">
              {down.map((c, i) => (
                <p key={i} className="text-xs text-gray-600">{c.number}. {c.clue}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
