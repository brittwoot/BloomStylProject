import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useWorksheetStore } from "../store";
import { FileDropzone } from "../components/Dropzone";
import { Sparkles, FileText, ChevronRight, Loader2 } from "lucide-react";
import { useGenerateWorksheet } from "@workspace/api-client-react";

export function UploadPage() {
  const [_, setLocation] = useLocation();
  const setWorksheet = useWorksheetStore((state) => state.setWorksheet);

  const [lessonText, setLessonText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

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

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonText.trim()) {
      alert("Please paste some lesson content or upload a document.");
      return;
    }
    generate({ data: { lessonText } });
  };

  const isLoading = isPending || isExtracting;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-10">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <p className="text-sm font-semibold text-primary tracking-wide uppercase">
          Step 1 of 4 — Upload Content
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-foreground leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Turn any lesson into a<br />
          <span className="text-primary">beautiful worksheet.</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Paste your lesson notes, a reading passage, or upload a PDF or DOCX file.
          BloomStyl will build a student-ready worksheet in seconds.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.form
        onSubmit={handleGenerate}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Creating your worksheet…</p>
              <p className="text-sm text-muted-foreground mt-1">This usually takes 10–15 seconds.</p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">

          {/* Text area */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Paste Lesson Content
            </label>
            <textarea
              value={lessonText}
              onChange={(e) => setLessonText(e.target.value)}
              placeholder="Paste your lesson plan, reading passage, vocabulary list, or any notes here…"
              rows={9}
              className="w-full resize-y rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
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

        {/* Footer / CTA */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <button
            type="submit"
            disabled={isLoading || !lessonText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white text-base font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Worksheet
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.form>

    </div>
  );
}
