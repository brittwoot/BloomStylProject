import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGenerateWorksheet } from "@workspace/api-client-react";
import { useWorksheetStore } from "../store";
import { FileDropzone } from "../components/Dropzone";
import { Sparkles, FileText, ChevronRight, Loader2, BookOpen } from "lucide-react";

export function Home() {
  const [_, setLocation] = useLocation();
  const setWorksheet = useWorksheetStore((state) => state.setWorksheet);
  
  const [lessonText, setLessonText] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [worksheetType, setWorksheetType] = useState("Mixed");
  const [isExtracting, setIsExtracting] = useState(false);

  const { mutate: generate, isPending } = useGenerateWorksheet({
    mutation: {
      onSuccess: (data) => {
        setWorksheet(data);
        setLocation("/result");
      },
      onError: (err) => {
        console.error("Generation failed:", err);
        alert("Failed to generate worksheet. Please try again.");
      }
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonText.trim()) {
      alert("Please provide some lesson text or upload a document.");
      return;
    }
    
    generate({
      data: {
        lessonText,
        gradeLevel: gradeLevel || undefined,
        worksheetType: worksheetType || undefined
      }
    });
  };

  return (
    <div className="min-h-screen w-full pb-20 pt-10 sm:pt-20 px-4 sm:px-6 print:hidden">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            AI-Powered for Teachers
          </div>
          <h1 className="text-5xl sm:text-6xl text-foreground">
            BloomStyl
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Turn any lesson into a beautiful, printable worksheet in seconds.
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.form 
          onSubmit={handleGenerate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden"
        >
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <h3 className="text-xl font-display font-bold">Crafting your worksheet...</h3>
              <p className="text-muted-foreground mt-2">This usually takes about 10-15 seconds.</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Lesson Content
              </label>
              <textarea
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
                placeholder="Paste your lesson plan, reading passage, or notes here..."
                className="w-full min-h-[240px] p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-y text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">OR</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <FileDropzone 
              isExtracting={isExtracting}
              onFileExtracted={(text) => {
                if (text) setLessonText(text);
                setIsExtracting(false);
              }} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Grade Level
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 5th Grade, High School"
                className="w-full p-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Worksheet Type
              </label>
              <select
                value={worksheetType}
                onChange={(e) => setWorksheetType(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground cursor-pointer appearance-none"
              >
                <option value="Mixed">Mixed Question Types</option>
                <option value="Quiz">Multiple Choice Quiz</option>
                <option value="Comprehension">Reading Comprehension</option>
                <option value="Fill-in-the-Blank">Fill in the Blanks</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isPending || (!lessonText && !isExtracting)}
              className="w-full py-4 px-8 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isPending ? "Generating..." : "Generate Worksheet"}
              {!isPending && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </motion.form>

      </div>
    </div>
  );
}
