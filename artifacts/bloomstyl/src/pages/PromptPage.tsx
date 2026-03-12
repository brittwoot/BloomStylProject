import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronRight, Lightbulb, MessageCircleQuestion, LayoutGrid } from "lucide-react";
import { useBloomStore } from "../store";
import { StepIndicator } from "./UploadPage";

const EXAMPLE_PROMPTS = [
  "Sight word practice for the word 'pretty' — kindergarten",
  "Butterfly life cycle — 2nd grade",
  "Fire safety for kindergarten (coloring page)",
  "Venn diagram: comparing frogs and toads — 3rd grade",
  "Halloween word search — 2nd grade",
  "Writing prompt: If I could fly... — 1st grade",
  "KWL chart about rainforests — 4th grade",
  "Frayer model for the word 'ecosystem' — 5th grade",
  "Number bonds 1–10 — kindergarten",
  "Sight word bingo card: sight words for 1st grade",
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function PromptPage() {
  const [, setLocation] = useLocation();
  const {
    setActivitySuggestions,
    setParsedPromptData,
    setOriginalPrompt,
  } = useBloomStore();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clarifying question state
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [waitingForClarification, setWaitingForClarification] = useState(false);

  const analyzePrompt = async (p: string, clarAnswer?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/worksheet/analyze-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p.trim(), clarificationAnswer: clarAnswer }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.needsClarification && !clarAnswer) {
        // Show the clarifying question inline
        setClarifyingQuestion(data.clarifyingQuestion);
        setWaitingForClarification(true);
      } else {
        // Navigate to suggestion page
        setActivitySuggestions(data.suggestions);
        setParsedPromptData(data.parsedPrompt);
        setOriginalPrompt(p.trim());
        setWaitingForClarification(false);
        setClarifyingQuestion("");
        setClarificationAnswer("");
        setLocation(`${BASE}/suggest`);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    analyzePrompt(prompt, waitingForClarification ? clarificationAnswer : undefined);
  };

  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationAnswer.trim()) return;
    analyzePrompt(prompt, clarificationAnswer);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <StepIndicator current={1} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          AI Worksheet Generator
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold text-foreground leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Describe your worksheet
        </h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          Tell the AI what you want to create. It will suggest the best format and let you customize before generating.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="relative bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <Sparkles className="w-4 h-4 text-primary/60 absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Analyzing your prompt…</p>
              <p className="text-sm text-muted-foreground mt-1">
                The AI is finding the best worksheet format for you.
              </p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Your Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Butterfly life cycle for 2nd grade…"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Clarifying question — appears inline */}
          <AnimatePresence>
            {waitingForClarification && clarifyingQuestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <MessageCircleQuestion className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-foreground">{clarifyingQuestion}</p>
                  </div>
                  <form onSubmit={handleClarificationSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={clarificationAnswer}
                      onChange={(e) => setClarificationAnswer(e.target.value)}
                      placeholder="Your answer…"
                      autoFocus
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="submit"
                      disabled={!clarificationAnswer.trim()}
                      className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-all"
                    >
                      Continue
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Example prompts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Lightbulb className="w-3.5 h-3.5" />
              Try one of these
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setPrompt(ex);
                    setWaitingForClarification(false);
                    setClarifyingQuestion("");
                    setClarificationAnswer("");
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex gap-3">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white text-base font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Suggest Worksheet Format <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLocation(`${BASE}/types`)}
            title="Browse all 30 worksheet types"
            className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all text-sm font-semibold"
          >
            <LayoutGrid className="w-4 h-4" />
            Browse all
          </button>
        </div>
      </motion.form>
    </div>
  );
}
