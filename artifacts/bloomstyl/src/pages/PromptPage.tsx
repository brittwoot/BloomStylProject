import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ChevronRight, Lightbulb } from "lucide-react";
import { useBloomStore } from "../store";
import { StepIndicator } from "./UploadPage";

const EXAMPLE_PROMPTS = [
  "Color by beginning sound worksheet for kindergarten",
  "All About Me graphic organizer, fun style",
  "Letter G find and circle worksheet",
  "Handwriting practice — uppercase letters",
  "Sight words matching game for first grade",
  "Reading comprehension — main idea and details for 3rd grade",
  "Vocabulary worksheet: synonyms and antonyms for 4th grade",
  "Math word problems — addition and subtraction for 2nd grade",
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function PromptPage() {
  const [, setLocation] = useLocation();
  const { setLayoutVariations } = useBloomStore();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/worksheet/generate-layouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.variations || !Array.isArray(data.variations)) throw new Error("No variations returned");
      setLayoutVariations(data.variations);
      setLocation("/pick-layout");
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating layouts. Please try again.");
    } finally {
      setLoading(false);
    }
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
          Tell the AI what you want to create. It will generate 3 distinct layout variations for you to choose from.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleGenerate}
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
              <p className="font-semibold text-foreground">Creating 3 layout variations…</p>
              <p className="text-sm text-muted-foreground mt-1">The AI is designing your worksheet options.</p>
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
              placeholder="e.g. Color by beginning sound worksheet for kindergarten…"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

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
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white text-base font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating layouts…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate 3 Layout Variations <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
