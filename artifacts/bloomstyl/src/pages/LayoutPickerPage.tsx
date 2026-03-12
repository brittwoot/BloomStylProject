import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, Layers } from "lucide-react";
import { useBloomStore, type LayoutVariation } from "../store";
import { StepIndicator } from "./UploadPage";

const STYLE_ICONS: Record<string, string> = {
  stacked: "📄",
  grid: "⊞",
  organizer: "🗂️",
  creative: "🎨",
};

const DECORATIVE_LABELS: Record<string, string> = {
  clean: "Clean & Clear",
  playful: "Playful & Fun",
  cursive: "Elegant Cursive",
  bold: "Bold & Strong",
};

function SectionPreview({ type, title }: { type: string; title: string }) {
  const colors: Record<string, string> = {
    directions: "#e0e7ff",
    passage: "#fef9c3",
    questions: "#dcfce7",
    vocabulary: "#fce7f3",
    activity: "#dbeafe",
    title: "#f3e8ff",
  };
  const color = colors[type] || "#f1f5f9";
  return (
    <div
      className="rounded-lg p-2 border border-black/5 text-center"
      style={{ backgroundColor: color }}
    >
      <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-wide truncate">{title}</p>
    </div>
  );
}

function LayoutCard({
  variation,
  index,
  onPick,
}: {
  variation: LayoutVariation;
  index: number;
  onPick: () => void;
}) {
  const sections: any[] = variation.worksheet?.sections ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <button
        type="button"
        onClick={onPick}
        className="w-full text-left rounded-2xl border-2 border-border bg-white shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-1 transition-all duration-200 group overflow-hidden"
      >
        {/* Card header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: `${variation.accentColor}18` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{STYLE_ICONS[variation.layoutStyle] ?? "📋"}</span>
            <div>
              <p className="font-bold text-sm text-foreground">{variation.label}</p>
              <p className="text-xs text-muted-foreground">{DECORATIVE_LABELS[variation.decorativeStyle ?? "clean"] ?? variation.decorativeStyle}</p>
            </div>
          </div>
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: variation.accentColor }}
          />
        </div>

        {/* Worksheet structure thumbnail */}
        <div className="p-4 space-y-2">
          {/* Title bar mock */}
          <div
            className="rounded-lg h-7 flex items-center justify-center"
            style={{ backgroundColor: variation.accentColor + "30" }}
          >
            <div
              className="h-2.5 rounded-full w-2/3"
              style={{ backgroundColor: variation.accentColor + "80" }}
            />
          </div>

          {/* Section blocks */}
          <div
            className={`grid gap-2 ${
              variation.layoutStyle === "grid" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {sections.slice(0, 4).map((sec: any, i: number) => (
              <SectionPreview key={sec.id || i} type={sec.type} title={sec.title} />
            ))}
            {sections.length > 4 && (
              <div className="rounded-lg p-2 border border-dashed border-border text-center col-span-full">
                <p className="text-[10px] text-muted-foreground">+{sections.length - 4} more sections</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{variation.description}</p>
        </div>

        {/* CTA */}
        <div
          className="px-4 py-3 flex items-center justify-between border-t border-border group-hover:bg-primary group-hover:border-primary transition-colors"
        >
          <span className="text-sm font-bold text-foreground group-hover:text-white transition-colors">
            Use this layout
          </span>
          <CheckCircle className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
        </div>
      </button>
    </motion.div>
  );
}

export function LayoutPickerPage() {
  const [, setLocation] = useLocation();
  const { layoutVariations, setWorksheet, setSettings, setLayoutVariations } = useBloomStore();

  useEffect(() => {
    if (!layoutVariations || layoutVariations.length === 0) {
      setLocation("/prompt");
    }
  }, [layoutVariations, setLocation]);

  if (!layoutVariations || layoutVariations.length === 0) return null;

  const handlePick = (variation: LayoutVariation) => {
    setWorksheet(variation.worksheet);
    if (variation.worksheet?.settings) {
      setSettings(variation.worksheet.settings);
    }
    setLocation("/result");
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <StepIndicator current={1} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <button
          type="button"
          onClick={() => { setLayoutVariations(null); setLocation("/prompt"); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to prompt
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-primary" />
          <h1
            className="text-2xl sm:text-3xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Choose a layout
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick one of these AI-designed variations. You'll be able to edit everything in the next step.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        {layoutVariations.map((v, i) => (
          <LayoutCard
            key={v.id}
            variation={v}
            index={i}
            onPick={() => handlePick(v)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Each layout contains real AI-generated content — just pick and edit to taste.
      </p>
    </div>
  );
}
