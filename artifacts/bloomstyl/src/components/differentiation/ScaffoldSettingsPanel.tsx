import type { ScaffoldSettings, ReadingLevel, BloomsTaxonomy } from "../../types/differentiationTypes";

const READING_LEVELS: ReadingLevel[] = ["Pre-K", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const BLOOMS_LEVELS: { value: BloomsTaxonomy; label: string }[] = [
  { value: "remember", label: "Remember" },
  { value: "understand", label: "Understand" },
  { value: "apply", label: "Apply" },
  { value: "analyze", label: "Analyze" },
  { value: "evaluate", label: "Evaluate" },
  { value: "create", label: "Create" },
];

type Props = {
  settings: ScaffoldSettings;
  onChange: (updates: Partial<ScaffoldSettings>) => void;
  versionLabel: string;
  versionColor: string;
};

function ChipSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              value === opt.value
                ? "bg-primary text-white shadow-sm"
                : "bg-muted/50 text-foreground/70 hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScaffoldSettingsPanel({ settings, onChange, versionLabel, versionColor }: Props) {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: versionColor }} />
        <h3 className="font-bold text-sm text-foreground">{versionLabel}</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">Reading Level</label>
        <div className="flex flex-wrap gap-1">
          {READING_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ readingLevel: level })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                settings.readingLevel === level
                  ? "bg-primary text-white"
                  : "bg-muted/50 text-foreground/60 hover:bg-muted"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <ChipSelect
        label="Sentence Length"
        value={settings.sentenceLength}
        options={[
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" },
        ]}
        onChange={(v) => onChange({ sentenceLength: v })}
      />

      <ChipSelect
        label="Vocabulary Level"
        value={settings.vocabularyLevel}
        options={[
          { value: "simplified", label: "Simplified" },
          { value: "grade-level", label: "Grade Level" },
          { value: "advanced", label: "Advanced" },
        ]}
        onChange={(v) => onChange({ vocabularyLevel: v })}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">
          Text Reduction: {settings.textReduction}%
        </label>
        <input
          type="range"
          min={25}
          max={100}
          step={5}
          value={settings.textReduction}
          onChange={(e) => onChange({ textReduction: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>25%</span>
          <span>100%</span>
        </div>
      </div>

      <ChipSelect
        label="Image Support"
        value={settings.imageSupport}
        options={[
          { value: "none", label: "None" },
          { value: "some", label: "Some" },
          { value: "heavy", label: "Heavy" },
        ]}
        onChange={(v) => onChange({ imageSupport: v })}
      />

      <ChipSelect
        label="Word Bank"
        value={settings.wordBank}
        options={[
          { value: "none", label: "None" },
          { value: "partial", label: "Partial" },
          { value: "full", label: "Full" },
        ]}
        onChange={(v) => onChange({ wordBank: v })}
      />

      <ChipSelect
        label="Sentence Frames"
        value={settings.sentenceFrames}
        options={[
          { value: "none", label: "None" },
          { value: "partial", label: "Partial" },
          { value: "full", label: "Full" },
        ]}
        onChange={(v) => onChange({ sentenceFrames: v })}
      />

      <ChipSelect
        label="Example Answers"
        value={settings.exampleAnswers}
        options={[
          { value: "none", label: "None" },
          { value: "first-only", label: "First Only" },
          { value: "all", label: "All" },
        ]}
        onChange={(v) => onChange({ exampleAnswers: v })}
      />

      <ChipSelect
        label="Question Type"
        value={settings.questionType}
        options={[
          { value: "multiple_choice", label: "Multiple Choice" },
          { value: "short_answer", label: "Short Answer" },
          { value: "true_false", label: "True/False" },
          { value: "fill_in_blank", label: "Fill in Blank" },
          { value: "essay", label: "Essay" },
        ]}
        onChange={(v) => onChange({ questionType: v })}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">Bloom's Taxonomy Depth</label>
        <div className="flex flex-wrap gap-1.5">
          {BLOOMS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange({ bloomsDepth: level.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                settings.bloomsDepth === level.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/70">Question Count</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={20}
            value={settings.questionCount}
            onChange={(e) => onChange({ questionCount: Number(e.target.value) })}
            className="w-20 px-3 py-1.5 rounded-lg border border-border text-sm bg-white"
          />
          <label className="flex items-center gap-2 text-xs text-foreground/60">
            <input
              type="checkbox"
              checked={settings.questionCountSyncWithAnchor}
              onChange={(e) => onChange({ questionCountSyncWithAnchor: e.target.checked })}
              className="rounded accent-primary"
            />
            Sync with anchor
          </label>
        </div>
      </div>

      <ChipSelect
        label="Answer Space"
        value={settings.answerSpace}
        options={[
          { value: "compact", label: "Compact" },
          { value: "standard", label: "Standard" },
          { value: "expanded", label: "Expanded" },
        ]}
        onChange={(v) => onChange({ answerSpace: v })}
      />

      <div className="pt-3 border-t border-border space-y-4">
        <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wide">ELL Support</h4>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/70">Language Pair</label>
          <input
            type="text"
            value={settings.ellLanguagePair}
            onChange={(e) => onChange({ ellLanguagePair: e.target.value })}
            placeholder="e.g. English/Spanish"
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm bg-white"
          />
        </div>

        <ChipSelect
          label="Bilingual Mode"
          value={settings.bilingualMode}
          options={[
            { value: "none", label: "None" },
            { value: "side-by-side", label: "Side by Side" },
            { value: "glossary-only", label: "Glossary Only" },
          ]}
          onChange={(v) => onChange({ bilingualMode: v })}
        />
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wide">Accessibility</h4>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.dyslexiaFriendly}
            onChange={(e) => onChange({ dyslexiaFriendly: e.target.checked })}
            className="rounded accent-primary w-4 h-4"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">Dyslexia-Friendly Mode</p>
            <p className="text-[10px] text-muted-foreground">Larger spacing, sans-serif, no italics</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.reducedContent}
            onChange={(e) => onChange({ reducedContent: e.target.checked })}
            className="rounded accent-primary w-4 h-4"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">Reduced Content Mode</p>
            <p className="text-[10px] text-muted-foreground">Fewer items, simpler layout, core concepts only</p>
          </div>
        </label>
      </div>
    </div>
  );
}
