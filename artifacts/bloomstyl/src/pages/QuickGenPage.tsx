import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, RefreshCw, ArrowRight } from "lucide-react";
import { useBloomStore } from "../store";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Subjects (12) ─────────────────────────────────────────────────────────────

type SubjectId =
  | "reading" | "writing" | "math" | "science"
  | "social" | "phonics" | "art" | "sel"
  | "ell" | "holiday" | "general" | "custom";

const SUBJECTS: { id: SubjectId; label: string; icon: string; color: string; placeholder: string }[] = [
  { id: "reading",  label: "Reading",        icon: "📖", color: "#3b82f6",
    placeholder: "e.g. Main idea, Charlotte's Web, nonfiction text features..." },
  { id: "writing",  label: "Writing",        icon: "✏️", color: "#8b5cf6",
    placeholder: "e.g. Narrative writing, opinion paragraph, descriptive essay..." },
  { id: "math",     label: "Math",           icon: "🔢", color: "#f59e0b",
    placeholder: "e.g. Adding fractions, place value to 1000, word problems..." },
  { id: "science",  label: "Science",        icon: "🔬", color: "#10b981",
    placeholder: "e.g. Water cycle, animal adaptations, states of matter..." },
  { id: "social",   label: "Social Studies", icon: "🌍", color: "#ef4444",
    placeholder: "e.g. Community helpers, the American Revolution, map skills..." },
  { id: "phonics",  label: "Phonics",        icon: "🔤", color: "#06b6d4",
    placeholder: "e.g. Long vowel sounds, digraphs sh/ch/th, CVC words..." },
  { id: "art",      label: "Art",            icon: "🎨", color: "#ec4899",
    placeholder: "e.g. Color theory, famous artists, elements of art..." },
  { id: "sel",      label: "SEL",            icon: "💬", color: "#f97316",
    placeholder: "e.g. Managing emotions, growth mindset, conflict resolution..." },
  { id: "ell",      label: "ELL / ESL",      icon: "🌐", color: "#84cc16",
    placeholder: "e.g. Vocabulary building, sentence frames, basic conversation..." },
  { id: "holiday",  label: "Holiday",        icon: "🎉", color: "#f43f5e",
    placeholder: "e.g. Halloween, Thanksgiving, end of year, Valentine's Day..." },
  { id: "general",  label: "General",        icon: "📋", color: "#6b7280",
    placeholder: "e.g. Study skills, research project, classroom activity..." },
  { id: "custom",   label: "Custom",         icon: "⚡", color: "#7c3aed",
    placeholder: "Describe exactly what you need..." },
];

// ── Activity chips per subject ─────────────────────────────────────────────────

const ACTIVITY_CHIPS: Partial<Record<SubjectId, { typeId: string; label: string }[]>> = {
  reading:  [
    { typeId: "story_map",     label: "Comprehension"     },
    { typeId: "frayer_model",  label: "Vocabulary"        },
    { typeId: "mind_map",      label: "Graphic Organizer" },
    { typeId: "writing_prompt",label: "Writing Response"  },
    { typeId: "coloring_page", label: "Coloring Activity" },
  ],
  writing:  [
    { typeId: "writing_prompt",  label: "Writing Prompt"   },
    { typeId: "sentence_frames", label: "Story Starter"    },
    { typeId: "sentence_frames", label: "Sentence Frames"  },
    { typeId: "mini_book",       label: "Mini Book"        },
    { typeId: "acrostic",        label: "Acrostic Poem"    },
  ],
  math: [
    { typeId: "writing_prompt", label: "Practice Problems" },
    { typeId: "writing_prompt", label: "Word Problems"     },
    { typeId: "number_bond",    label: "Number Bonds"      },
    { typeId: "graph_page",     label: "Graphing"          },
    { typeId: "measurement",    label: "Measurement"       },
    { typeId: "dice_activity",  label: "Game / Activity"   },
  ],
  science: [
    { typeId: "label_diagram",     label: "Diagram to Label"   },
    { typeId: "sequence_chart",    label: "Sequence / Cycle"   },
    { typeId: "observation_sheet", label: "Observation Sheet"  },
    { typeId: "story_map",         label: "Reading + Questions"},
    { typeId: "coloring_page",     label: "Coloring Page"      },
  ],
  phonics: [
    { typeId: "color_by_code",  label: "Color by Sound" },
    { typeId: "trace_and_color",label: "Tracing"        },
    { typeId: "cut_and_sort",   label: "Sort Activity"  },
    { typeId: "word_search",    label: "Letter Find"    },
    { typeId: "line_matching",  label: "Word Families"  },
  ],
  art: [
    { typeId: "coloring_page",  label: "Coloring Page"      },
    { typeId: "writing_prompt", label: "Craft Instructions" },
    { typeId: "writing_prompt", label: "Writing Prompt"     },
    { typeId: "line_matching",  label: "Matching"           },
    { typeId: "bingo_card",     label: "Bingo"              },
  ],
  holiday: [
    { typeId: "coloring_page",  label: "Coloring Page"      },
    { typeId: "writing_prompt", label: "Writing Prompt"     },
    { typeId: "word_search",    label: "Word Search"        },
    { typeId: "line_matching",  label: "Matching"           },
    { typeId: "bingo_card",     label: "Bingo"              },
  ],
  sel: [
    { typeId: "writing_prompt",  label: "Journal Prompt"       },
    { typeId: "mind_map",        label: "Mind Map"             },
    { typeId: "sentence_frames", label: "Sentence Frames"      },
    { typeId: "story_map",       label: "Story / Scenario"     },
    { typeId: "venn_diagram",    label: "Compare Feelings"     },
  ],
  ell: [
    { typeId: "sentence_frames", label: "Sentence Frames"  },
    { typeId: "line_matching",   label: "Vocab Match"       },
    { typeId: "frayer_model",    label: "Frayer Model"      },
    { typeId: "word_search",     label: "Word Search"       },
    { typeId: "mini_book",       label: "Mini Book"         },
  ],
};

const GRADES = ["Pre-K","K","1","2","3","4","5","6","7","8"];

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "input" | "generating" | "done";
type LayoutStatus = "pending" | "loading" | "done" | "error";

type Layout = {
  id: "A" | "B" | "C";
  status: LayoutStatus;
  data: any | null;
  error: string | null;
};

// ── safeParseJSON ──────────────────────────────────────────────────────────────

function safeParseJSON(str: string): any | null {
  try {
    return JSON.parse(
      str.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()
    );
  } catch {
    return null;
  }
}

// ── Shimmer button ─────────────────────────────────────────────────────────────

function GenerateButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full rounded-xl px-6 py-4 text-base font-bold text-white overflow-hidden transition-all
        ${disabled ? "bg-primary/40 cursor-not-allowed" : "bg-primary hover:opacity-95 active:scale-[0.99]"}
        shadow-lg shadow-primary/20`}
    >
      {loading && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            animation: "shimmerSlide 1.4s infinite linear",
          }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5" />
        {loading ? "Creating..." : "Create Worksheet ✦"}
      </span>
    </button>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="rounded-xl border-2 border-border bg-white p-4 space-y-3 will-change-transform"
      style={{ animation: delay === 0 ? undefined : undefined }}
    >
      <div className="h-3 w-16 bg-muted rounded-full animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      <div className="mt-3 space-y-2">
        {[80, 95, 65, 88, 55].map((w, i) => (
          <div key={i} className="h-2.5 bg-muted rounded animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {[1,2,3].map((i) => (
          <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Layout result card ─────────────────────────────────────────────────────────

function LayoutCard({
  layout,
  label,
  selected,
  onSelect,
}: {
  layout: Layout;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ws = layout.data?.worksheet ?? layout.data;
  const sections: any[] = ws?.sections ?? [];

  if (layout.status === "error") {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
        <p className="text-xs font-bold text-red-600 mb-1">{label} failed</p>
        <p className="text-xs text-red-500 mb-3 line-clamp-2">{layout.error}</p>
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all will-change-transform
        ${selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/12 scale-[1.02]"
          : "border-border bg-white hover:border-primary/40 hover:shadow-md"
        }`}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {selected && (
          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {ws?.title ? (
        <p className="text-sm font-bold text-foreground mb-2 truncate">{ws.title}</p>
      ) : (
        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
      )}

      <div className="space-y-1.5">
        {sections.slice(0, 5).map((s: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: i * 0.04 }}
            className="flex items-center gap-1.5"
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? "bg-primary" : "bg-muted-foreground/40"}`} />
            <p className="text-[11px] text-muted-foreground truncate">
              {s.title ?? s.type ?? `Section ${i + 1}`}
            </p>
          </motion.div>
        ))}
        {sections.length > 5 && (
          <p className="text-[10px] text-muted-foreground/50 pl-3">+{sections.length - 5} more sections</p>
        )}
      </div>

      {ws?.gradeLevel && (
        <p className="mt-2 text-[10px] font-semibold text-muted-foreground">Grade {ws.gradeLevel}</p>
      )}

      {selected && layout.status === "done" && (
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
          Open in Editor <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </motion.button>
  );
}

// ── Customization panel ────────────────────────────────────────────────────────

type Customization = {
  colorTheme: string;
  fontStyle: string;
  border: string;
  nameLine: boolean;
  dateLine: boolean;
  grade: string;
  answerSpace: string;
  wordBank: boolean;
  directions: boolean;
};

const COLOR_OPTS = [
  { id: "black & white", label: "B&W",    dot: "#1a1a2e" },
  { id: "soft blue",     label: "Blue",   dot: "#3b82f6" },
  { id: "warm yellow",   label: "Yellow", dot: "#f59e0b" },
  { id: "soft green",    label: "Green",  dot: "#10b981" },
  { id: "soft purple",   label: "Purple", dot: "#7c3aed" },
  { id: "light pastel",  label: "Pastel", dot: "#ec4899" },
];
const FONT_OPTS  = ["Playful","Clean","Handwritten","Bold"];
const BORDER_OPTS = ["None","Simple","Decorative","Heavy"];

function CustomizationPanel({
  value,
  onChange,
}: {
  value: Customization;
  onChange: (k: keyof Customization, v: any) => void;
}) {
  const [contentOpen, setContentOpen] = useState(false);
  const [formatOpen,  setFormatOpen]  = useState(false);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden text-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customize</p>
      </div>

      <div className="divide-y divide-border">
        {/* Section 1 — LOOK (always open) */}
        <div className="p-4 space-y-4">
          <p className="text-xs font-bold text-foreground">Look</p>

          {/* Font */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Font Style</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_OPTS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChange("fontStyle", f.toLowerCase())}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    value.fontStyle === f.toLowerCase()
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {f === "Playful" ? "Aa Playful" : f === "Clean" ? "Aa Clean" : f === "Handwritten" ? "Aa Script" : "Aa Bold"}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Color Theme</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => onChange("colorTheme", c.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    value.colorTheme === c.id ? "border-primary scale-110" : "border-transparent hover:border-border"
                  }`}
                  style={{ backgroundColor: c.dot }}
                />
              ))}
            </div>
          </div>

          {/* Border */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Border</p>
            <div className="flex gap-1.5">
              {BORDER_OPTS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChange("border", b.toLowerCase())}
                  className={`flex-1 rounded-lg border py-1.5 text-[10px] font-semibold transition-all ${
                    value.border === b.toLowerCase()
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Date lines */}
          <div className="space-y-2">
            {(["nameLine","dateLine"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{key === "nameLine" ? "Name line" : "Date line"}</span>
                <button
                  type="button"
                  onClick={() => onChange(key, !value[key])}
                  className={`w-9 h-5 rounded-full transition-colors relative ${value[key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — CONTENT */}
        <div>
          <button
            type="button"
            onClick={() => setContentOpen(!contentOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/20 transition-colors"
          >
            Content
            <span className={`transition-transform duration-150 ${contentOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          <AnimatePresence>
            {contentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Answer Space</p>
                    <div className="flex gap-1.5">
                      {["Compact","Standard","Spacious"].map((a) => (
                        <button key={a} type="button"
                          onClick={() => onChange("answerSpace", a.toLowerCase())}
                          className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-all ${
                            value.answerSpace === a.toLowerCase()
                              ? "border-primary bg-primary/8 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >{a}</button>
                      ))}
                    </div>
                  </div>
                  {(["wordBank","directions"] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{key === "wordBank" ? "Word bank" : "Directions"}</span>
                      <button type="button"
                        onClick={() => onChange(key, !value[key])}
                        className={`w-9 h-5 rounded-full transition-colors relative ${value[key] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 3 — FORMAT */}
        <div>
          <button
            type="button"
            onClick={() => setFormatOpen(!formatOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/20 transition-colors"
          >
            Format
            <span className={`transition-transform duration-150 ${formatOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          <AnimatePresence>
            {formatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Orientation</p>
                    <div className="flex gap-2">
                      {["Portrait","Landscape"].map((o) => (
                        <button key={o} type="button"
                          className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 transition-colors"
                        >{o}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickGenPage() {
  const [, setLocation] = useLocation();
  const { setWorksheet } = useBloomStore();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [activityTypeLabel, setActivityTypeLabel] = useState("");

  // ── Generation state ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("input");
  const [layouts, setLayouts] = useState<Layout[]>([
    { id: "A", status: "pending", data: null, error: null },
    { id: "B", status: "pending", data: null, error: null },
    { id: "C", status: "pending", data: null, error: null },
  ]);
  const [selectedLayout, setSelectedLayout] = useState<"A" | "B" | "C">("A");
  const [error, setError] = useState("");

  // ── Customization state ────────────────────────────────────────────────────
  const [custom, setCustom] = useState<Customization>({
    colorTheme: "black & white",
    fontStyle: "clean",
    border: "none",
    nameLine: true,
    dateLine: true,
    grade: "3",
    answerSpace: "standard",
    wordBank: false,
    directions: true,
  });

  const topicRef = useRef<HTMLInputElement>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});
  const genKey = useRef(0);

  const subjectObj = SUBJECTS.find((s) => s.id === subject);
  const chips = subject ? (ACTIVITY_CHIPS[subject as SubjectId] ?? []) : [];
  const canGenerate = subject !== "" && topic.trim().length >= 3;

  // Auto-focus topic when subject selected
  useEffect(() => {
    if (subject && topicRef.current) {
      setTimeout(() => topicRef.current?.focus(), 200);
    }
  }, [subject]);

  // ── Update layout ──────────────────────────────────────────────────────────
  const updateLayout = useCallback((id: "A" | "B" | "C", updates: Partial<Layout>) => {
    setLayouts((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // ── Single layout fetch ────────────────────────────────────────────────────
  const fetchLayout = useCallback(
    async (id: "A" | "B" | "C", key: number) => {
      const controller = new AbortController();
      abortRefs.current[id] = controller;
      const timer = setTimeout(() => controller.abort(), 30000);

      updateLayout(id, { status: "loading", data: null, error: null });
      console.log(`[GEN] Layout ${id}: Calling API...`);

      try {
        const res = await fetch(`${BASE}/api/worksheet/customize-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            activityType: activityTypeId || "writing_prompt",
            originalPrompt: topic.trim(),
            parsedPromptData: {
              topic: topic.trim(),
              gradeLevel: grade || "General",
              skillFocus: subjectObj?.label ?? subject,
            },
            options: {
              title: `${topic.trim()} — ${activityTypeLabel || subjectObj?.label || "Worksheet"}`,
              gradeLevel: grade || "General",
              includeName: custom.nameLine,
              includeDate: custom.dateLine,
              colorScheme: custom.colorTheme,
              fontStyle: custom.fontStyle,
              borderStyle: custom.border,
            },
            layoutVariant: id,
            subject: subjectObj?.label ?? subject,
            details: "",
          }),
        });

        clearTimeout(timer);
        if (controller.signal.aborted || genKey.current !== key) return;

        console.log(`[GEN] Layout ${id}: Response ${res.status}`);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Error ${res.status}`);
        }

        const text = await res.text();
        const data = JSON.parse(text) ?? safeParseJSON(text);
        if (!data) throw new Error("Invalid response");

        if (genKey.current !== key) return;
        console.log(`[GEN] Layout ${id}: Done ✓`);
        updateLayout(id, { status: "done", data });
      } catch (err: any) {
        clearTimeout(timer);
        if (controller.signal.aborted || err?.name === "AbortError") {
          console.log(`[GEN] Layout ${id}: Aborted`);
          return;
        }
        if (genKey.current !== key) return;
        console.error(`[GEN] Layout ${id}: Error`, err);
        updateLayout(id, { status: "error", error: err?.message ?? "Failed" });
      }
    },
    [topic, grade, subject, subjectObj, activityTypeId, activityTypeLabel, custom, updateLayout]
  );

  // ── Start generation ───────────────────────────────────────────────────────
  const startGeneration = useCallback(() => {
    if (!canGenerate) return;

    const key = ++genKey.current;
    Object.values(abortRefs.current).forEach((c) => c.abort());
    abortRefs.current = {};

    console.log("[GEN] === Starting parallel generation ===");
    console.log("[GEN] Subject:", subject, "| Topic:", topic, "| Grade:", grade);

    setLayouts([
      { id: "A", status: "pending", data: null, error: null },
      { id: "B", status: "pending", data: null, error: null },
      { id: "C", status: "pending", data: null, error: null },
    ]);
    setError("");
    setPhase("generating");

    // Fire all 3 in parallel
    fetchLayout("A", key);
    fetchLayout("B", key);
    fetchLayout("C", key);
  }, [canGenerate, subject, topic, grade, fetchLayout]);

  // Watch for all done → switch to done phase
  useEffect(() => {
    if (phase === "generating") {
      const allSettled = layouts.every((l) => l.status === "done" || l.status === "error");
      const anyDone    = layouts.some((l)  => l.status === "done");
      if (allSettled && anyDone) {
        setPhase("done");
      }
    }
  }, [layouts, phase]);

  // ── Handle card click ──────────────────────────────────────────────────────
  const handleCardClick = (id: "A" | "B" | "C") => {
    const layout = layouts.find((l) => l.id === id);
    if (layout?.status !== "done") return;

    if (selectedLayout === id && phase === "done") {
      // Second click: open editor
      const ws = layout.data?.worksheet ?? layout.data;
      if (ws) setWorksheet(ws);
      setLocation(`${BASE}/canvas`);
      return;
    }
    setSelectedLayout(id);
  };

  // ── Handle customization change ────────────────────────────────────────────
  const handleCustomChange = (k: keyof Customization, v: any) => {
    setCustom((prev) => ({ ...prev, [k]: v }));
  };

  // ── Retry single layout ────────────────────────────────────────────────────
  const retryLayout = (id: "A" | "B" | "C") => {
    fetchLayout(id, genKey.current);
  };

  const allDone    = layouts.every((l) => l.status === "done" || l.status === "error");
  const anyLoading = layouts.some((l) => l.status === "loading" || l.status === "pending");

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── FORM AREA ── */}
        <div className={`transition-all duration-300 ${phase !== "input" ? "mb-6" : "mb-0"}`}>

          {/* Compact summary bar shown during/after generation */}
          {phase !== "input" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6 px-4 py-2.5 bg-primary/5 border border-primary/15 rounded-xl"
            >
              <span className="text-lg">{subjectObj?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{topic}</p>
                <p className="text-xs text-muted-foreground">{subjectObj?.label}{grade ? ` · Grade ${grade}` : ""}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPhase("input"); Object.values(abortRefs.current).forEach((c) => c.abort()); }}
                className="text-xs font-semibold text-primary hover:text-primary/80 shrink-0"
              >
                ← Edit
              </button>
            </motion.div>
          )}

          {/* Full form — shown only in input phase */}
          <AnimatePresence>
            {phase === "input" && (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Worksheet Generator
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">What subject?</h1>
                  <p className="text-muted-foreground text-sm">Pick a subject to get started.</p>
                </div>

                {/* ── Subject grid (12 buttons, 3 col) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto">
                  {SUBJECTS.map((s) => {
                    const isSelected = subject === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSubject(s.id);
                          setActivityTypeId("");
                          setActivityTypeLabel("");
                        }}
                        className="relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all will-change-transform"
                        style={{
                          borderColor: isSelected ? s.color : undefined,
                          backgroundColor: isSelected ? `${s.color}14` : undefined,
                          transform: isSelected ? "scale(1.03)" : "scale(1)",
                          transition: "transform 80ms ease-out, background-color 80ms ease-out, border-color 80ms ease-out",
                        }}
                      >
                        <span className="text-xl shrink-0">{s.icon}</span>
                        <span className={`text-sm font-bold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                          {s.label}
                        </span>
                        {isSelected && (
                          <span
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: s.color }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Step 2: Topic input (slides in when subject selected) ── */}
                <AnimatePresence>
                  {subject && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="max-w-2xl mx-auto space-y-5"
                    >
                      {/* Topic input */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                          What are you teaching?
                        </label>
                        <input
                          ref={topicRef}
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && canGenerate) startGeneration(); }}
                          placeholder={subjectObj?.placeholder ?? "e.g. topic or concept..."}
                          className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base font-medium placeholder:text-muted-foreground/55 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Grade pills */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Grade Level <span className="normal-case font-normal tracking-normal">(optional)</span></p>
                        <div className="flex flex-wrap gap-1.5">
                          {GRADES.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGrade(grade === g ? "" : g)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                grade === g
                                  ? "bg-primary text-white border-primary"
                                  : "border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Activity type chips */}
                      {chips.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity Type <span className="normal-case font-normal tracking-normal">(optional)</span></p>
                          <div className="flex flex-wrap gap-2">
                            {chips.map((c, i) => (
                              <button
                                key={`${c.typeId}-${i}`}
                                type="button"
                                onClick={() => {
                                  if (activityTypeId === c.typeId && activityTypeLabel === c.label) {
                                    setActivityTypeId("");
                                    setActivityTypeLabel("");
                                  } else {
                                    setActivityTypeId(c.typeId);
                                    setActivityTypeLabel(c.label);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                  activityTypeId === c.typeId && activityTypeLabel === c.label
                                    ? "bg-primary/10 text-primary border-primary/40"
                                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline error */}
                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                        >
                          {error} <button type="button" onClick={startGeneration} className="font-bold underline ml-1">Try Again</button>
                        </motion.p>
                      )}

                      {/* Generate button */}
                      <GenerateButton
                        loading={false}
                        disabled={!canGenerate}
                        onClick={startGeneration}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── GENERATION AREA ── */}
        <AnimatePresence>
          {phase !== "input" && (
            <motion.div
              key="generation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col lg:flex-row gap-6"
            >
              {/* Left: cards */}
              <div className="flex-1">
                {/* Progress shimmer bar (while loading) */}
                {anyLoading && (
                  <div className="mb-4 rounded-xl overflow-hidden h-10 relative bg-primary/10">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                      style={{ animation: "shimmerSlide 1.4s infinite linear" }}
                    />
                    <div className="absolute inset-0 flex items-center px-4">
                      <Sparkles className="w-4 h-4 text-primary mr-2 animate-pulse" />
                      <span className="text-xs font-semibold text-primary">
                        Creating {layouts.filter((l) => l.status !== "done" && l.status !== "error").length} layout{layouts.filter((l) => l.status !== "done" && l.status !== "error").length !== 1 ? "s" : ""}...
                      </span>
                      <div className="ml-auto flex gap-4">
                        {layouts.map((l) => (
                          <span key={l.id} className={`text-xs font-semibold ${l.status === "done" ? "text-green-600" : l.status === "error" ? "text-red-500" : "text-primary"}`}>
                            {l.id} {l.status === "done" ? "✓" : l.status === "error" ? "✕" : "⏳"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {layouts.map((layout, i) => (
                    <div key={layout.id}>
                      {(layout.status === "pending" || layout.status === "loading") ? (
                        <SkeletonCard delay={i * 0.04} />
                      ) : (
                        <LayoutCard
                          layout={layout}
                          label={`Layout ${layout.id}`}
                          selected={selectedLayout === layout.id}
                          onSelect={() => layout.status === "error" ? retryLayout(layout.id) : handleCardClick(layout.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Done CTA */}
                {allDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 flex items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = layouts.find((l) => l.id === selectedLayout && l.status === "done");
                        if (chosen?.data) setWorksheet(chosen.data?.worksheet ?? chosen.data);
                        setLocation(`${BASE}/canvas`);
                      }}
                      disabled={!layouts.some((l) => l.status === "done")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open Layout {selectedLayout} in Editor →
                    </button>
                    <button
                      type="button"
                      onClick={startGeneration}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Right: customization panel */}
              <div className="lg:w-64 shrink-0">
                <CustomizationPanel value={custom} onChange={handleCustomChange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
