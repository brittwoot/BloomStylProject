import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useBloomStore } from "../store";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Subject data ───────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: "reading", label: "Reading / ELA", icon: "📚" },
  { id: "math",    label: "Math",          icon: "🔢" },
  { id: "science", label: "Science",       icon: "🔬" },
  { id: "social",  label: "Social Studies",icon: "🌍" },
  { id: "art",     label: "Art",           icon: "🎨" },
  { id: "music",   label: "Music",         icon: "🎵" },
  { id: "sel",     label: "SEL / Health",  icon: "💪" },
  { id: "ell",     label: "ELL / Language",icon: "🗣️" },
  { id: "other",   label: "Other",         icon: "✨" },
] as const;

type SubjectId = (typeof SUBJECTS)[number]["id"];

// ── Topic chips per subject ────────────────────────────────────────────────────

const TOPIC_CHIPS: Record<SubjectId, string[]> = {
  reading: ["Main Idea","Characters","Sequencing","Phonics","Sight Words","Rhyming","Summarizing","Inference","Figurative Language","Author's Purpose"],
  math:    ["Addition","Subtraction","Multiplication","Division","Fractions","Place Value","Geometry","Time","Measurement","Word Problems"],
  science: ["Life Cycles","Plants","Animals","Weather","Solar System","Human Body","Matter","Forces","Ecosystems","Scientific Method"],
  social:  ["Community","Maps","History","Government","Economics","Cultures","Geography","Citizenship","Timelines","Leaders"],
  art:     ["Color Theory","Famous Artists","Art Elements","Observation Drawing","Art History","Sculpture"],
  music:   ["Rhythm","Notes","Instruments","Composers","Music History","Singing"],
  sel:     ["Emotions","Kindness","Conflict Resolution","Self-Regulation","Growth Mindset","Healthy Habits"],
  ell:     ["Vocabulary","Sentence Frames","Grammar","Reading Fluency","Writing","Conversation"],
  other:   ["Critical Thinking","Research Skills","Organization","Collaboration","Creativity","Problem Solving"],
};

// ── Activity types per subject ─────────────────────────────────────────────────

type ActivityCard = { typeId: string; label: string; icon: string };

const ACTIVITY_TYPES: Record<SubjectId, ActivityCard[]> = {
  reading: [
    { typeId: "coloring_page",   label: "Coloring Page",    icon: "🖍️" },
    { typeId: "writing_prompt",  label: "Writing Prompt",   icon: "📝" },
    { typeId: "word_search",     label: "Word Search",      icon: "🔎" },
    { typeId: "story_map",       label: "Story Map",        icon: "📖" },
    { typeId: "line_matching",   label: "Vocab Match",      icon: "↔️" },
    { typeId: "mini_book",       label: "Mini Book",        icon: "📚" },
    { typeId: "frayer_model",    label: "Frayer Model",     icon: "⊞" },
    { typeId: "sentence_frames", label: "Sentence Frames",  icon: "🔤" },
    { typeId: "mind_map",        label: "Graphic Organizer",icon: "🕸️" },
  ],
  math: [
    { typeId: "coloring_page",  label: "Coloring Page",   icon: "🖍️" },
    { typeId: "number_bond",    label: "Number Bonds",     icon: "🔵" },
    { typeId: "ten_frame",      label: "Ten Frame",        icon: "🟦" },
    { typeId: "graph_page",     label: "Graph / Chart",    icon: "📈" },
    { typeId: "clock_practice", label: "Clock Practice",   icon: "🕐" },
    { typeId: "measurement",    label: "Measurement",      icon: "📏" },
    { typeId: "writing_prompt", label: "Word Problems",    icon: "📝" },
    { typeId: "dice_activity",  label: "Dice Activity",    icon: "🎲" },
    { typeId: "frayer_model",   label: "Vocabulary",       icon: "⊞" },
  ],
  science: [
    { typeId: "coloring_page",      label: "Coloring Page",   icon: "🖍️" },
    { typeId: "label_diagram",      label: "Label Diagram",   icon: "🔍" },
    { typeId: "sequence_chart",     label: "Sequence / Cycle",icon: "➡️" },
    { typeId: "kwl_chart",          label: "KWL Chart",       icon: "📊" },
    { typeId: "observation_sheet",  label: "Observation Sheet",icon: "🔬" },
    { typeId: "mind_map",           label: "Mind Map",        icon: "🕸️" },
    { typeId: "venn_diagram",       label: "Venn Diagram",    icon: "⭕" },
    { typeId: "mini_book",          label: "Mini Book",       icon: "📚" },
    { typeId: "writing_prompt",     label: "Writing Prompt",  icon: "📝" },
  ],
  social: [
    { typeId: "timeline",       label: "Timeline",          icon: "📅" },
    { typeId: "map_activity",   label: "Map Activity",      icon: "🗺️" },
    { typeId: "kwl_chart",      label: "KWL Chart",         icon: "📊" },
    { typeId: "venn_diagram",   label: "Venn Diagram",      icon: "⭕" },
    { typeId: "mind_map",       label: "Graphic Organizer", icon: "🕸️" },
    { typeId: "frayer_model",   label: "Frayer Model",      icon: "⊞" },
    { typeId: "writing_prompt", label: "Writing Prompt",    icon: "📝" },
    { typeId: "sequence_chart", label: "Sequence Chart",    icon: "➡️" },
    { typeId: "coloring_page",  label: "Coloring Page",     icon: "🖍️" },
  ],
  art: [
    { typeId: "coloring_page",      label: "Coloring Page",        icon: "🖍️" },
    { typeId: "color_by_code",      label: "Color by Code",        icon: "🎨" },
    { typeId: "trace_and_color",    label: "Trace & Color",        icon: "✏️" },
    { typeId: "observation_sheet",  label: "Observation Sheet",    icon: "🔬" },
    { typeId: "writing_prompt",     label: "Artist Response",      icon: "📝" },
    { typeId: "mind_map",           label: "Idea Web",             icon: "🕸️" },
  ],
  music: [
    { typeId: "writing_prompt",  label: "Writing Prompt", icon: "📝" },
    { typeId: "sequence_chart",  label: "Sequence Chart", icon: "➡️" },
    { typeId: "mind_map",        label: "Mind Map",       icon: "🕸️" },
    { typeId: "spinner",         label: "Spinner",        icon: "🌀" },
    { typeId: "dice_activity",   label: "Dice Activity",  icon: "🎲" },
    { typeId: "coloring_page",   label: "Coloring Page",  icon: "🖍️" },
  ],
  sel: [
    { typeId: "writing_prompt",  label: "Writing Prompt",       icon: "📝" },
    { typeId: "mind_map",        label: "Mind Map",             icon: "🕸️" },
    { typeId: "sequence_chart",  label: "Sequence Chart",       icon: "➡️" },
    { typeId: "story_map",       label: "Story Map",            icon: "📖" },
    { typeId: "venn_diagram",    label: "Venn Diagram",         icon: "⭕" },
    { typeId: "sentence_frames", label: "Sentence Frames",      icon: "🔤" },
  ],
  ell: [
    { typeId: "sentence_frames", label: "Sentence Frames",  icon: "🔤" },
    { typeId: "line_matching",   label: "Vocab Match",       icon: "↔️" },
    { typeId: "word_search",     label: "Word Search",       icon: "🔎" },
    { typeId: "frayer_model",    label: "Frayer Model",      icon: "⊞" },
    { typeId: "writing_prompt",  label: "Writing Prompt",    icon: "📝" },
    { typeId: "mini_book",       label: "Mini Book",         icon: "📚" },
  ],
  other: [
    { typeId: "writing_prompt", label: "Writing Prompt",    icon: "📝" },
    { typeId: "mind_map",       label: "Mind Map",          icon: "🕸️" },
    { typeId: "venn_diagram",   label: "Venn Diagram",      icon: "⭕" },
    { typeId: "kwl_chart",      label: "KWL Chart",         icon: "📊" },
    { typeId: "frayer_model",   label: "Frayer Model",      icon: "⊞" },
    { typeId: "sequence_chart", label: "Sequence Chart",    icon: "➡️" },
    { typeId: "coloring_page",  label: "Coloring Page",     icon: "🖍️" },
    { typeId: "word_search",    label: "Word Search",       icon: "🔎" },
    { typeId: "story_map",      label: "Story Map",         icon: "📖" },
  ],
};

const GRADES = ["Pre-K","K","1","2","3","4","5","6","7","8"];

// ── Progress dots ──────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1,2,3].map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === step
              ? "w-6 h-2.5 bg-primary"
              : s < step
              ? "w-2.5 h-2.5 bg-primary/40"
              : "w-2.5 h-2.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

// ── Slide transition ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickGenPage() {
  const [, setLocation] = useLocation();
  const { setQuickGen } = useBloomStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("3");
  const [activityType, setActivityType] = useState("");
  const [activityTypeName, setActivityTypeName] = useState("");
  const [details, setDetails] = useState("");

  const topicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2 && topicRef.current) {
      setTimeout(() => topicRef.current?.focus(), 350);
    }
  }, [step]);

  const subjectObj = SUBJECTS.find((s) => s.id === subject);
  const chips = subject ? TOPIC_CHIPS[subject as SubjectId] : [];
  const activityCards = subject ? ACTIVITY_TYPES[subject as SubjectId] : [];

  const defaultActivity = activityCards[0];

  useEffect(() => {
    if (activityCards.length > 0 && !activityType) {
      setActivityType(activityCards[0].typeId);
      setActivityTypeName(activityCards[0].label);
    }
  }, [subject]);

  const handleSubjectClick = (s: SubjectId) => {
    setSubject(s);
    setActivityType(ACTIVITY_TYPES[s][0]?.typeId ?? "");
    setActivityTypeName(ACTIVITY_TYPES[s][0]?.label ?? "");
    setStep(2);
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setQuickGen({
      subject: subjectObj?.label ?? subject,
      topic: topic.trim(),
      grade,
      activityType,
      activityTypeName,
      details: details.trim(),
      colorTheme: "black & white",
      fontStyle: "clean",
      border: "none",
      nameLine: true,
      dateLine: true,
    });
    setLocation(`${BASE}/generating`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <ProgressDots step={step} />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: SUBJECT ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                AI Worksheet Generator
              </div>
              <h1 className="text-3xl font-bold text-foreground">What subject?</h1>
              <p className="text-muted-foreground mt-2">Choose to continue.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSubjectClick(s.id as SubjectId)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border bg-white px-3 py-5 text-center transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg active:scale-95"
                >
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-xs font-bold text-foreground leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: TOPIC ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{subjectObj?.icon}</span>
                <span className="text-sm font-semibold text-primary">{subjectObj?.label}</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">What are you teaching?</h1>
            </div>

            <div>
              <input
                ref={topicRef}
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) setStep(3); }}
                placeholder={`e.g. ${chips[0]?.toLowerCase() ?? "your topic"}...`}
                className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setTopic(chip)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      topic === chip
                        ? "bg-primary text-white border-primary"
                        : "border-border bg-white hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Grade Level</p>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                      grade === g
                        ? "bg-primary text-white border-primary"
                        : "border-border bg-white hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => { if (topic.trim()) setStep(3); }}
              disabled={!topic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white transition-all hover:opacity-90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: ACTIVITY TYPE ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-primary">{subjectObj?.label}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-foreground font-medium">{topic}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">Grade {grade}</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">What kind of activity?</h1>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {activityCards.map((card, i) => (
                <button
                  key={card.typeId}
                  type="button"
                  onClick={() => {
                    setActivityType(card.typeId);
                    setActivityTypeName(card.label);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3.5 text-center transition-all ${
                    activityType === card.typeId
                      ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                      : "border-border bg-white hover:border-primary/50 hover:shadow-sm"
                  } ${i === 0 && activityType === card.typeId ? "ring-2 ring-primary/30" : ""}`}
                >
                  <span className="text-xl">{card.icon}</span>
                  <span className={`text-[11px] font-bold leading-tight ${
                    activityType === card.typeId ? "text-primary" : "text-foreground"
                  }`}>{card.label}</span>
                  {i === 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-amber-500">AI Pick</span>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                Anything specific to add? <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder='e.g. "include a word bank" · "make it Halloween themed" · "only 3 questions"'
                rows={2}
                className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!topic.trim() || !activityType}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
            >
              <Sparkles className="w-5 h-5" />
              Generate ✦
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
