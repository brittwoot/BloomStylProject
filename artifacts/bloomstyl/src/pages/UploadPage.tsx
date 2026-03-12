import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useBloomStore } from "../store";
import { FileDropzone } from "../components/Dropzone";
import { Sparkles, FileText, ChevronRight, Loader2, Globe, Wand2 } from "lucide-react";
import { useDetectContent } from "@workspace/api-client-react";

const LANGUAGES = [
  { value: "auto", label: "Auto Detect" },
  { value: "English", label: "English" },
  { value: "Vietnamese", label: "Vietnamese" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
];

type Mode = "upload" | "prompt";

export function UploadPage() {
  const [, setLocation] = useLocation();
  const { lessonText, language, setLessonText, setLanguage, setDetectionResult } = useBloomStore();
  const [isExtracting, setIsExtracting] = useState(false);
  const [mode, setMode] = useState<Mode>("upload");

  const { mutate: detect, isPending } = useDetectContent({
    mutation: {
      onSuccess: (data) => {
        setDetectionResult({
          blocks: data.blocks as any,
          detectedLanguage: data.detectedLanguage,
          safetyPassed: data.safetyPassed,
          safetyFlags: (data as any).safetyFlags || [],
        });
        setLocation("/detect");
      },
      onError: () => {
        alert("Failed to analyze content. Please try again.");
      },
    },
  });

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonText.trim()) {
      alert("Please paste some lesson content or upload a document.");
      return;
    }
    detect({
      data: {
        lessonText,
        language: language === "auto" ? undefined : language,
      },
    });
  };

  const isLoading = isPending || isExtracting;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">

      <StepIndicator current={1} />

      {/* Mode toggle */}
      <div className="flex items-center bg-muted/50 rounded-2xl p-1 max-w-sm mx-auto border border-border">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "upload"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          From Document
        </button>
        <button
          type="button"
          onClick={() => setLocation("/prompt")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "prompt"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          From Prompt
        </button>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Upload your lesson content
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          Paste text or upload a PDF or DOCX. BloomStyl will detect and organize the instructional sections for you.
        </p>
      </motion.div>

      {/* Form card */}
      <motion.form
        onSubmit={handleContinue}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="relative bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        {isPending && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <Sparkles className="w-4 h-4 text-primary/60 absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Analyzing your lesson content…</p>
              <p className="text-sm text-muted-foreground mt-1">Detecting sections and instructional blocks.</p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-5">

          {/* Language selector */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Paste Lesson Content
            </label>
            <textarea
              value={lessonText}
              onChange={(e) => setLessonText(e.target.value)}
              placeholder="Paste your lesson plan, reading passage, vocabulary list, or any teaching notes here…"
              rows={9}
              className="w-full resize-y rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {lessonText && (
              <p className="text-xs text-muted-foreground text-right">
                {lessonText.trim().split(/\s+/).length} words
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or upload a file</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* File upload */}
          <FileDropzone
            isExtracting={isExtracting}
            onFileExtracted={(text) => {
              if (text) setLessonText(text);
              setIsExtracting(false);
            }}
          />
        </div>

        {/* CTA */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <button
            type="submit"
            disabled={isLoading || !lessonText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white text-base font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing content…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Detect Content Sections <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.form>

      {/* Prompt mode shortcut card */}
      <motion.button
        type="button"
        onClick={() => setLocation("/prompt")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/3 hover:border-primary/60 hover:bg-primary/6 transition-all text-left group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Or generate from a prompt</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Describe what you want — the AI creates 3 layout options to pick from.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary ml-auto shrink-0 transition-colors" />
      </motion.button>
    </div>
  );
}

export function StepIndicator({ current }: { current: number }) {
  const steps = ["Upload", "Detect", "Settings", "Preview"];
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? "bg-primary text-white" :
                active ? "bg-primary text-white ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {done ? "✓" : stepNum}
              </div>
              <span className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-px mx-1 mb-4 transition-colors ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
