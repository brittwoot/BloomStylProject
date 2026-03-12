import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateWorksheet } from "@workspace/api-client-react";
import { useWorksheetStore } from "../store";
import { FileDropzone } from "../components/Dropzone";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";

// ── Subject definitions ──────────────────────────────────────
const SUBJECTS = [
  { id: "reading",        label: "Reading",        emoji: "📖" },
  { id: "writing",        label: "Writing",        emoji: "✏️" },
  { id: "math",           label: "Math",           emoji: "🔢" },
  { id: "science",        label: "Science",        emoji: "🔬" },
  { id: "social_studies", label: "Social Studies", emoji: "🌍" },
  { id: "phonics",        label: "Phonics",        emoji: "🔤" },
  { id: "art",            label: "Art",            emoji: "🎨" },
  { id: "sel",            label: "SEL",            emoji: "💬" },
  { id: "ell",            label: "ELL / ESL",      emoji: "🌐" },
  { id: "holiday",        label: "Holiday",        emoji: "🎉" },
  { id: "general",        label: "General",        emoji: "📋" },
  { id: "custom",         label: "Custom",         emoji: "⚡" },
];

// ── Activity chips per subject ───────────────────────────────
const ACTIVITY_CHIPS: Record<string, string[]> = {
  reading:        ["Comprehension", "Vocabulary", "Graphic Organizer", "Writing Response"],
  writing:        ["Writing Prompt", "Sentence Frames", "Story Map", "Journal"],
  math:           ["Practice Problems", "Word Problems", "Number Bonds", "Graphing"],
  science:        ["Diagram to Label", "Sequence / Cycle", "Observation Sheet", "Reading + Questions"],
  social_studies: ["Timeline", "Map Activity", "Compare & Contrast", "Reading + Questions"],
  phonics:        ["Color by Sound", "Tracing", "Sort Activity", "Letter Find"],
  art:            ["Coloring Page", "Craft Instructions", "Writing Prompt"],
  sel:            ["Journal Prompt", "Feelings Check-in", "Scenario Response"],
  ell:            ["Bilingual Vocabulary", "Picture + Word", "Sentence Frames"],
  holiday:        ["Coloring Page", "Writing Prompt", "Matching", "Bingo"],
  general:        ["Mixed Questions", "Study Guide", "Exit Ticket", "Graphic Organizer"],
  custom:         [],
};

// ── Grade pills ──────────────────────────────────────────────
const GRADES = ["PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8"];

// ── Topic placeholders per subject ──────────────────────────
const PLACEHOLDERS: Record<string, string> = {
  reading:        "e.g. Main idea, Charlotte's Web, nonfiction features...",
  writing:        "e.g. Opinion writing, narrative story starter...",
  math:           "e.g. Adding fractions, place value, word problems...",
  science:        "e.g. Water cycle, animal adaptations, states of matter...",
  social_studies: "e.g. American Revolution, map skills, communities...",
  phonics:        "e.g. Long vowel sounds, digraphs sh/ch/th, CVC words...",
  art:            "e.g. Color wheel, famous artists, drawing techniques...",
  sel:            "e.g. Managing emotions, kindness, growth mindset...",
  ell:            "e.g. Greetings vocabulary, classroom objects, colors...",
  holiday:        "e.g. Halloween, Thanksgiving, end of year, Valentine's...",
  general:        "e.g. Any topic — the AI will choose the best format...",
  custom:         "Describe exactly what you need...",
};

export function Home() {
  const [_, setLocation] = useLocation();
  const setWorksheet = useWorksheetStore((state) => state.setWorksheet);

  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Generation lock — prevents double-fire
  const [isLocked, setIsLocked] = useState(false);

  const { mutate: generate, isPending } = useGenerateWorksheet({
    mutation: {
      onSuccess: (data) => {
        setWorksheet(data);
        setIsLocked(false);
        setLocation("/result");
      },
      onError: (err) => {
        console.error("Generation failed:", err);
        setIsLocked(false);
        alert("Generation failed — please try again.");
      },
      // Disable automatic retries — failed = show error, teacher retries manually
      retry: false,
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isPending) return; // hard stop on double-fire
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    setIsLocked(true);

    const lessonText = [
      selectedSubject ? `Subject: ${selectedSubject}` : "",
      selectedGrade   ? `Grade: ${selectedGrade}` : "",
      selectedActivity ? `Activity type: ${selectedActivity}` : "",
      `Topic: ${topic}`,
    ].filter(Boolean).join("\n");

    generate({
      data: {
        lessonText,
        gradeLevel:    selectedGrade    || undefined,
        worksheetType: selectedActivity || undefined,
      }
    });
  };

  const isGenerating = isPending || isLocked;
  const canGenerate  = !isGenerating && topic.trim().length >= 3;

  const chips = selectedSubject ? (ACTIVITY_CHIPS[selectedSubject] ?? []) : [];

  return (
    <div className="min-h-screen w-full pb-24 pt-10 sm:pt-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            AI-Powered for Teachers
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground">
            BloomStyl
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pick a subject, enter your topic, and get a print-ready worksheet in seconds.
          </p>
        </motion.div>

        {/* ── Main card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3, ease: "easeOut" }}
          className="rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-8"
        >

          {/* STEP 1 — Subject grid */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step 1 — Choose a subject
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(s.id);
                    setSelectedActivity(null);
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-1.5
                    rounded-2xl border-2 py-3 px-2
                    text-sm font-semibold
                    transition-all duration-100
                    ${selectedSubject === s.id
                      ? "border-primary bg-primary text-white scale-[1.03] shadow-md"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                    }
                  `}
                >
                  <span className="text-xl leading-none">{s.emoji}</span>
                  <span className="text-xs leading-tight text-center">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2 — Topic input (slides in after subject selected) */}
          <AnimatePresence>
            {selectedSubject && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Topic input */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Step 2 — What's the topic?
                  </p>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={PLACEHOLDERS[selectedSubject] ?? "Describe your topic..."}
                    autoFocus
                    className="w-full p-3.5 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground placeholder:text-muted-foreground/50 text-base"
                  />
                </div>

                {/* Grade pills */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Grade <span className="normal-case font-normal">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGrade(selectedGrade === g ? null : g)}
                        className={`
                          px-3.5 py-1.5 rounded-full text-sm font-semibold border-2
                          transition-all duration-100
                          ${selectedGrade === g
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }
                        `}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity chips */}
                {chips.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Activity type <span className="normal-case font-normal">(optional — AI picks if skipped)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setSelectedActivity(selectedActivity === chip ? null : chip)}
                          className={`
                            px-3.5 py-1.5 rounded-full text-sm font-medium border
                            transition-all duration-100
                            ${selectedActivity === chip
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }
                          `}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowUpload(!showUpload)}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    {showUpload ? "▾ Hide file upload" : "▸ Upload a document instead"}
                  </button>
                  <AnimatePresence>
                    {showUpload && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="mt-3 overflow-hidden"
                      >
                        <FileDropzone
                          isExtracting={isExtracting}
                          onFileExtracted={(text) => {
                            if (text) setTopic(text.slice(0, 200));
                            setIsExtracting(false);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Generate button ── */}
          <form onSubmit={handleGenerate}>
            <button
              type="submit"
              disabled={!canGenerate}
              className={`
                w-full py-4 px-8 rounded-2xl font-bold text-lg
                flex items-center justify-center gap-3
                transition-all duration-150
                ${canGenerate
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your worksheet...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Worksheet
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Inline loading message — no overlay blocking the form */}
            <AnimatePresence>
              {isGenerating && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-muted-foreground mt-3"
                >
                  Usually takes 10–15 seconds. You can adjust style options while you wait.
                </motion.p>
              )}
            </AnimatePresence>
          </form>

        </motion.div>
      </div>
    </div>
  );
}