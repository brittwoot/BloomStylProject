import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LayoutGrid, Star, CheckCircle2, X, Lightbulb } from "lucide-react";
import { useBloomStore, type ActivitySuggestion } from "../store";
import { TYPE_MAP, CATEGORY_META } from "../types/worksheetTypes";
import { StepIndicator } from "./UploadPage";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Upgrade suggestion banner ─────────────────────────────────────────────────

function UpgradeBanner({
  message,
  onSwitch,
  onDismiss,
}: {
  message: string;
  onSwitch: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm"
    >
      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="flex-1 text-amber-900">{message}</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
        >
          Switch
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── SuggestionCard ────────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  index,
  onPick,
}: {
  suggestion: ActivitySuggestion;
  index: number;
  onPick: () => void;
}) {
  const typeDef = TYPE_MAP[suggestion.typeId as keyof typeof TYPE_MAP];
  const categoryMeta = typeDef ? CATEGORY_META[typeDef.category] : null;

  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-2xl border-2 transition-all group overflow-hidden ${
        suggestion.isPrimary
          ? "border-primary bg-primary/3 shadow-md shadow-primary/10"
          : "border-border bg-white hover:border-primary/50 hover:shadow-md"
      }`}
    >
      {/* Primary badge */}
      {suggestion.isPrimary && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold">
          <Star className="w-3 h-3" />
          Best Match for Your Prompt
        </div>
      )}

      {/* Category + type */}
      {categoryMeta && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40"
          style={{ backgroundColor: categoryMeta.bgColor }}
        >
          <span className="text-base">{typeDef?.icon ?? "📋"}</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: categoryMeta.color }}>
              {categoryMeta.label}
            </p>
            <p className="text-sm font-bold text-foreground">{suggestion.typeName}</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* AI reason */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {suggestion.reason}
        </p>

        {/* Preview description */}
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            What you&apos;ll get
          </p>
          <p className="text-sm text-foreground">{suggestion.previewDescription}</p>
        </div>

        {/* Type preview rows */}
        {typeDef && (
          <div className="space-y-1">
            {typeDef.previewRows.map((row, i) => (
              <div
                key={i}
                className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1 font-mono truncate"
              >
                {row}
              </div>
            ))}
          </div>
        )}

        <div
          className={`flex items-center gap-2 text-sm font-semibold ${
            suggestion.isPrimary ? "text-primary" : "text-foreground group-hover:text-primary"
          } transition-colors`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {suggestion.isPrimary ? "Use this format →" : "Choose this instead →"}
        </div>
      </div>
    </motion.button>
  );
}

// ── ActivitySuggestionPage ────────────────────────────────────────────────────

export function ActivitySuggestionPage() {
  const [, setLocation] = useLocation();
  const {
    activitySuggestions,
    parsedPromptData,
    originalPrompt,
    setChosenActivityType,
    setCustomizeOptions,
  } = useBloomStore();

  const [upgradeBanner, setUpgradeBanner] = useState<{
    message: string;
    switchTypeId: string;
  } | null>(null);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activitySuggestions || activitySuggestions.length === 0) {
      setLocation(`${BASE}/prompt`);
    }
  }, [activitySuggestions]);

  if (!activitySuggestions || activitySuggestions.length === 0) return null;

  const handlePick = (suggestion: ActivitySuggestion) => {
    setChosenActivityType(suggestion.typeId);
    setCustomizeOptions({
      title: suggestion.suggestedTitle || "",
      gradeLevel: parsedPromptData?.gradeLevel ?? "General",
      ...suggestion.suggestedOptions,
    });
    setLocation(`${BASE}/customize`);
  };

  const handleBrowseAll = () => {
    setLocation(`${BASE}/types`);
  };

  const primarySuggestion = activitySuggestions.find((s) => s.isPrimary);
  const alternativeSuggestions = activitySuggestions.filter((s) => !s.isPrimary);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <StepIndicator current={1} />

      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => setLocation(`${BASE}/prompt`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Edit prompt
        </button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold text-foreground">
            AI recommends these formats
          </h1>
          {originalPrompt && (
            <p className="text-sm text-muted-foreground">
              For: <span className="italic text-foreground/70">&ldquo;{originalPrompt}&rdquo;</span>
            </p>
          )}
          {parsedPromptData && (
            <div className="flex flex-wrap gap-2 mt-2">
              {parsedPromptData.gradeLevel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  Grade: {parsedPromptData.gradeLevel}
                </span>
              )}
              {parsedPromptData.topic && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {parsedPromptData.topic}
                </span>
              )}
              {parsedPromptData.skillFocus && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {parsedPromptData.skillFocus}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upgrade banner */}
      <AnimatePresence>
        {upgradeBanner && !dismissedBanners.has(upgradeBanner.switchTypeId) && (
          <UpgradeBanner
            message={upgradeBanner.message}
            onSwitch={() => {
              const match = activitySuggestions.find(
                (s) => s.typeId === upgradeBanner.switchTypeId
              );
              if (match) handlePick(match);
              setUpgradeBanner(null);
            }}
            onDismiss={() => {
              setDismissedBanners((prev) => new Set([...prev, upgradeBanner.switchTypeId]));
              setUpgradeBanner(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Primary suggestion */}
      {primarySuggestion && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Top Recommendation
          </p>
          <SuggestionCard
            suggestion={primarySuggestion}
            index={0}
            onPick={() => handlePick(primarySuggestion)}
          />
        </div>
      )}

      {/* Alternative suggestions */}
      {alternativeSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Other great options
          </p>
          <div className="space-y-3">
            {alternativeSuggestions.map((s, i) => (
              <SuggestionCard
                key={s.typeId}
                suggestion={s}
                index={i + 1}
                onPick={() => handlePick(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Browse all types */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-2 border-t border-border"
      >
        <button
          type="button"
          onClick={handleBrowseAll}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/3 text-muted-foreground hover:text-primary transition-all text-sm font-semibold"
        >
          <LayoutGrid className="w-4 h-4" />
          Browse all 30 worksheet formats
        </button>
      </motion.div>
    </div>
  );
}
