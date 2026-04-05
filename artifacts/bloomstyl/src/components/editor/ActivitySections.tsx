import { useState } from "react";
import { EditableTextBlock } from "./EditableTextBlock";

// ── Word Search Grid Generator ────────────────────────────────────────────────

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function generateGrid(word: string, cols = 8, rows = 4): string[][] {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)])
  );
  // Place word horizontally at a random valid row/col
  const maxCol = cols - word.length;
  if (maxCol >= 0) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * (maxCol + 1));
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i] = word[i].toLowerCase();
    }
  }
  return grid;
}

function generateFillBlanks(word: string): string[] {
  if (!word || word.length < 3) return [`_${word.slice(1)}`, `${word.slice(0, -1)}_`];
  const patterns: string[] = [];
  // Remove letters at different positions
  const positions = [
    Math.floor(word.length * 0.3),
    Math.floor(word.length * 0.6),
    0,
  ];
  const usedPos = new Set<number>();
  for (const pos of positions) {
    let p = pos;
    while (usedPos.has(p)) p = (p + 1) % word.length;
    usedPos.add(p);
    patterns.push(word.slice(0, p) + "_" + word.slice(p + 1));
    if (patterns.length >= 3) break;
  }
  return patterns.slice(0, 3);
}

// ── WordPracticeSection ───────────────────────────────────────────────────────
// Column labels only; task directions live in section.instructions (Directions block).

export function WordPracticeSection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const word = section.targetWord || "";
  const [editWord, setEditWord] = useState(word);

  const handleWordChange = (v: string) => {
    setEditWord(v);
    onUpdate({ targetWord: v });
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-3 border-b-2 border-gray-300 bg-gray-50 text-sm font-bold">
        <div className="p-2 text-center border-r border-gray-300">Read</div>
        <div className="p-2 text-center border-r border-gray-300 flex items-center justify-center gap-1">
          <span>🖍️</span> Color
        </div>
        <div className="p-2 text-center flex items-center justify-center gap-1">
          Write <span>✏️</span>
        </div>
      </div>

      {/* Activity columns */}
      <div className="grid grid-cols-3 min-h-[120px]">
        {/* Read */}
        <div className="p-4 flex flex-col items-center justify-center border-r border-gray-200">
          <EditableTextBlock
            value={editWord || "word"}
            onChange={(v) => handleWordChange(v.trim().toLowerCase())}
            className="text-5xl font-black text-gray-900 leading-none text-center"
            placeholder="word"
          />
        </div>

        {/* Color (hollow outline for coloring) */}
        <div className="p-4 flex flex-col items-center justify-center border-r border-gray-200">
          <span
            className="text-5xl font-black leading-none select-none"
            style={{
              WebkitTextStroke: "2px #555",
              color: "transparent",
              fontFamily: "Arial Black, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {editWord || "word"}
          </span>
        </div>

        {/* Write (trace guide + blank line) */}
        <div className="p-4 flex flex-col items-center justify-center gap-2">
          <div className="w-full border-b-2 border-gray-400 h-7" />
          <span
            className="text-4xl font-black leading-none select-none"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px #ccc",
              fontFamily: "Arial, sans-serif",
              letterSpacing: "0.08em",
            }}
          >
            {editWord || "word"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── WordSearchSection ─────────────────────────────────────────────────────────

export function WordSearchSection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const word = section.targetWord || "";
  const grid: string[][] = section.searchGrid ?? generateGrid(word, 8, 4);

  const handleRegenerate = () => {
    onUpdate({ searchGrid: generateGrid(word, 8, 4) });
  };

  return (
    <div className="space-y-2">
      <div className="inline-block border border-gray-300 rounded overflow-hidden">
        {grid.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => (
              <div
                key={ci}
                className="w-8 h-8 border border-gray-200 flex items-center justify-center text-sm font-mono font-bold uppercase bg-white"
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleRegenerate}
        className="print:hidden text-[10px] text-primary hover:underline ml-2"
      >
        ↻ Regenerate grid
      </button>
    </div>
  );
}

// ── LetterConnectSection ──────────────────────────────────────────────────────

export function LetterConnectSection({ section }: { section: any }) {
  const word = section.targetWord || "";
  const letters = word.toLowerCase().split("");

  // Arrange in 2 rows
  const row1 = letters.slice(0, Math.ceil(letters.length / 2));
  const row2 = letters.slice(Math.ceil(letters.length / 2));

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {[row1, row2].map((row, ri) => (
          <div key={ri} className="flex gap-2 flex-wrap">
            {row.map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-gray-800 flex items-center justify-center text-lg font-bold uppercase bg-white shadow-sm"
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FillBlanksSection ─────────────────────────────────────────────────────────

export function FillBlanksSection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const word = section.targetWord || "";
  const patterns: string[] = section.fillPatterns ?? generateFillBlanks(word);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        {patterns.map((pattern, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <span
              className="text-3xl font-black font-mono tracking-wider"
              style={{ fontFamily: "Courier New, monospace" }}
            >
              {pattern.split("").map((ch, ci) => (
                <span
                  key={ci}
                  className={ch === "_" ? "border-b-2 border-gray-400 inline-block w-5 mx-0.5 align-bottom" : ""}
                >
                  {ch === "_" ? "\u00A0" : ch}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SentencePracticeSection ───────────────────────────────────────────────────

export function SentencePracticeSection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const title = typeof section.title === "string" ? section.title.trim() : "";

  return (
    <div className="space-y-2 border-t-2 border-gray-200 pt-4">
      {title ? (
        <p className="text-sm font-bold text-center underline">{section.title}</p>
      ) : null}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold whitespace-nowrap" style={{ fontFamily: "Comic Sans MS, cursive" }}>
          <EditableTextBlock
            value={section.sentenceStarter ?? ""}
            onChange={(v) => onUpdate({ sentenceStarter: v })}
            placeholder="Sentence starter…"
          />
        </span>
        <div className="flex-1 border-b-2 border-gray-400 h-8 min-w-[80px]" />
      </div>
    </div>
  );
}

// ── ColoringActivitySection ───────────────────────────────────────────────────
// Shows a color key and activity instructions for color-by-word/sound worksheets

export function ColoringActivitySection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const colorKey: { word: string; color: string }[] = section.colorKey ?? [
    { word: "cat", color: "#FFD700" },
    { word: "dog", color: "#87CEEB" },
    { word: "fish", color: "#FF6B6B" },
    { word: "bird", color: "#90EE90" },
  ];

  return (
    <div className="space-y-4">
      {/* Section directions use the Directions callout in Result; no duplicate instructions here. */}

      {/* Color key */}
      <div className="border-2 border-gray-300 rounded-lg p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Color Key</p>
        <div className="grid grid-cols-2 gap-2">
          {colorKey.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-gray-300 shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-semibold">{entry.word}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drawing/coloring area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center"
        style={{ minHeight: "200px" }}>
        <p className="text-gray-300 text-sm italic select-none">Illustration</p>
      </div>
    </div>
  );
}

// ── TracingSection ────────────────────────────────────────────────────────────

export function TracingSection({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  const word = section.targetWord || "";
  const lineCount = section.lineCount ?? 4;

  return (
    <div className="space-y-4">
      {/* Demonstration row */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <span
          className="text-4xl font-black"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px #aaa",
            fontFamily: "Arial, sans-serif",
            letterSpacing: "0.08em",
          }}
        >
          {word || "word"}
        </span>
      </div>

      {/* Repeating trace lines */}
      {Array.from({ length: lineCount }).map((_, i) => (
        <div key={i} className="flex items-end gap-4 border-b-2 border-gray-300 pb-1 mb-3">
          <span
            className="text-2xl font-black opacity-15 select-none"
            style={{ fontFamily: "Arial, sans-serif", letterSpacing: "0.08em" }}
          >
            {word || "_ _ _"}
          </span>
          <div className="flex-1" />
        </div>
      ))}
    </div>
  );
}

// ── WordSightRow ──────────────────────────────────────────────────────────────
// Combines word search + letter connect side by side (bottom half of sight word sheet)

export function WordSightRow({ section, onUpdate }: { section: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 border-2 border-gray-300 rounded-lg overflow-hidden">
      <div className="p-4 border-r border-gray-200">
        <WordSearchSection section={section} onUpdate={onUpdate} />
      </div>
      <div className="p-4">
        <LetterConnectSection section={section} />
      </div>
    </div>
  );
}
