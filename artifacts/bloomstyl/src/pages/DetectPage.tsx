import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useBloomStore, type ContentBlock } from "../store";
import { StepIndicator } from "./UploadPage";
import {
  ChevronRight, ArrowLeft, GripVertical, CheckSquare, Square,
  AlertTriangle, BookOpen, FileText, List, Bookmark, StickyNote,
  Activity, Target, Table2, FileQuestion, ChevronUp, ChevronDown
} from "lucide-react";

const BLOCK_TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  title:         { label: "Title",         color: "bg-violet-100 text-violet-700 border-violet-200",    icon: Bookmark },
  directions:    { label: "Directions",    color: "bg-blue-100 text-blue-700 border-blue-200",          icon: FileText },
  passage:       { label: "Passage",       color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: BookOpen },
  questions:     { label: "Questions",     color: "bg-amber-100 text-amber-700 border-amber-200",       icon: FileQuestion },
  vocabulary:    { label: "Vocabulary",    color: "bg-pink-100 text-pink-700 border-pink-200",          icon: List },
  teacher_notes: { label: "Teacher Notes", color: "bg-slate-100 text-slate-600 border-slate-200",       icon: StickyNote },
  activity:      { label: "Activity",      color: "bg-orange-100 text-orange-700 border-orange-200",    icon: Activity },
  objective:     { label: "Objective",     color: "bg-indigo-100 text-indigo-700 border-indigo-200",    icon: Target },
  table:         { label: "Table",         color: "bg-teal-100 text-teal-700 border-teal-200",          icon: Table2 },
  extra:         { label: "Extra",         color: "bg-gray-100 text-gray-600 border-gray-200",          icon: FileText },
};

function BlockCard({
  block, index, total, onToggle, onMoveUp, onMoveDown,
}: {
  block: ContentBlock; index: number; total: number;
  onToggle: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const meta = BLOCK_TYPE_META[block.type] || BLOCK_TYPE_META.extra;
  const Icon = meta.icon;
  const preview = block.text.slice(0, 220) + (block.text.length > 220 ? "…" : "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-4 rounded-xl border transition-all ${
        block.is_selected
          ? "bg-white border-primary/30 shadow-sm shadow-primary/5"
          : "bg-muted/30 border-border opacity-55"
      }`}
    >
      {/* Reorder controls */}
      <div className="flex flex-col gap-1 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <GripVertical className="w-4 h-4 text-muted-foreground/30 mx-auto" />
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="mt-1 shrink-0 transition-colors"
        aria-label={block.is_selected ? "Exclude block" : "Include block"}
      >
        {block.is_selected
          ? <CheckSquare className="w-5 h-5 text-primary" />
          : <Square className="w-5 h-5 text-muted-foreground/40" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">Page {block.page}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{preview}</p>
      </div>
    </motion.div>
  );
}

export function DetectPage() {
  const [_, setLocation] = useLocation();
  const { blocks, safetyPassed, safetyFlags, detectedLanguage, toggleBlock, reorderBlocks, lessonText } = useBloomStore();

  useEffect(() => {
    if (!lessonText) setLocation("/");
  }, [lessonText, setLocation]);

  const selectedCount = blocks.filter((b) => b.is_selected).length;

  const selectAll = () => {
    const updated = blocks.map((b) => ({ ...b, is_selected: true }));
    useBloomStore.setState({ blocks: updated });
  };
  const deselectAll = () => {
    const updated = blocks.map((b) => ({ ...b, is_selected: false }));
    useBloomStore.setState({ blocks: updated });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <StepIndicator current={2} />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Review detected sections
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Found <strong>{blocks.length}</strong> instructional section{blocks.length !== 1 ? "s" : ""}.
          {detectedLanguage && detectedLanguage !== "auto" && <> Language: <strong>{detectedLanguage}</strong>.</>}
          {" "}Toggle sections to include or exclude, and use the arrows to reorder.
        </p>
      </motion.div>

      {/* Safety warning */}
      {!safetyPassed && safetyFlags?.length > 0 && (
        <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Content safety warning</p>
            <p className="text-xs mt-0.5">Flagged content detected: {safetyFlags.join(", ")}. Please review your content before continuing.</p>
          </div>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No content sections were detected. Go back and try different content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">{selectedCount} of {blocks.length} selected</span>
            <div className="flex gap-3">
              <button type="button" onClick={selectAll} className="text-primary hover:underline font-semibold">Select all</button>
              <span className="text-border">|</span>
              <button type="button" onClick={deselectAll} className="text-muted-foreground hover:underline">Deselect all</button>
            </div>
          </div>

          <div className="space-y-2">
            {blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                index={i}
                total={blocks.length}
                onToggle={() => toggleBlock(block.id)}
                onMoveUp={() => reorderBlocks(i, i - 1)}
                onMoveDown={() => reorderBlocks(i, i + 1)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => setLocation("/settings")}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Settings
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
