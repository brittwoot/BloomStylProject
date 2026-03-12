import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useBloomStore } from "../store";
import { StepIndicator } from "./UploadPage";
import { useGenerateWorksheet } from "@workspace/api-client-react";
import { ArrowLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

type TemplateType = "reading" | "practice" | "vocabulary";
type Theme = "clean" | "classroom" | "fun";

const TEMPLATES: { value: TemplateType; label: string; desc: string; emoji: string }[] = [
  { value: "reading",   label: "Reading Worksheet",   desc: "Passage + comprehension questions",   emoji: "📖" },
  { value: "practice",  label: "Practice Worksheet",   desc: "Mixed exercises to reinforce concepts", emoji: "✏️" },
  { value: "vocabulary",label: "Vocabulary Worksheet", desc: "Word definitions and usage practice",  emoji: "📝" },
];

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: "clean",     label: "Clean",     desc: "Simple and minimal" },
  { value: "classroom", label: "Classroom", desc: "Friendly and structured" },
  { value: "fun",       label: "Fun",       desc: "Colorful and engaging" },
];

function RadioCard<T extends string>({
  value, current, onChange, label, desc, emoji
}: { value: T; current: T; onChange: (v: T) => void; label: string; desc: string; emoji?: string }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-start gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-white hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      {emoji && <span className="text-xl mt-0.5">{emoji}</span>}
      <div className="flex-1">
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      {active && <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

export function SettingsPage() {
  const [_, setLocation] = useLocation();
  const { blocks, settings, setSettings, setWorksheet, lessonText } = useBloomStore();

  useEffect(() => {
    if (!lessonText) setLocation("/");
  }, [lessonText, setLocation]);

  const { mutate: generate, isPending } = useGenerateWorksheet({
    mutation: {
      onSuccess: (data) => {
        setWorksheet(data);
        setLocation("/result");
      },
      onError: () => {
        alert("Failed to generate worksheet. Please try again.");
      },
    },
  });

  const handleGenerate = () => {
    generate({
      data: {
        blocks: blocks as any,
        settings: settings as any,
        lessonText,
      },
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <StepIndicator current={3} />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Configure worksheet settings
        </h1>
        <p className="text-muted-foreground text-sm">Choose a template, theme, and layout options for your worksheet.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-6">

        {/* Template */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-foreground">Template Type</h2>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <RadioCard
                key={t.value}
                value={t.value}
                current={settings.templateType}
                onChange={(v) => setSettings({ templateType: v })}
                label={t.label}
                desc={t.desc}
                emoji={t.emoji}
              />
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-foreground">Theme</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <RadioCard
                key={t.value}
                value={t.value}
                current={settings.theme}
                onChange={(v) => setSettings({ theme: v })}
                label={t.label}
                desc={t.desc}
              />
            ))}
          </div>
        </div>

        {/* Layout options */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-foreground">Layout Options</h2>
          <div className="space-y-3.5">
            <Toggle
              checked={settings.includeName}
              onChange={(v) => setSettings({ includeName: v })}
              label="Include Name line"
            />
            <Toggle
              checked={settings.includeDate}
              onChange={(v) => setSettings({ includeDate: v })}
              label="Include Date line"
            />
            <Toggle
              checked={settings.generateAnswerKey}
              onChange={(v) => setSettings({ generateAnswerKey: v })}
              label="Generate Answer Key"
            />
          </div>
        </div>

      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setLocation("/detect")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleGenerate}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating worksheet…</>
          ) : (
            <>Generate Worksheet <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
