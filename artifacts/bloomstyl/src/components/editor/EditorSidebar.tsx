import { useState, type ComponentType } from "react";
import { Type, Layout, Image, X, ChevronRight, Palette, Sparkles } from "lucide-react";
import { TextStyleToolbar } from "./TextStyleToolbar";
import { SectionStylePanel } from "./SectionStylePanel";
import { ClipartPanel } from "./ClipartPanel";
import { TypographyPanel } from "./TypographyPanel";
import { AIStylePanel } from "./AIStylePanel";
import { useBloomStore } from "../../store";

type EditorTab = "ai" | "typography" | "text" | "section" | "clipart";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: EditorTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "ai",         label: "AI Style",   icon: Sparkles },
  { id: "typography", label: "Fonts",      icon: Palette },
  { id: "text",       label: "Text",       icon: Type },
  { id: "section",    label: "Style",      icon: Layout },
  { id: "clipart",    label: "Clipart",    icon: Image },
];

export function EditorSidebar({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<EditorTab>("ai");
  const { activeSectionId, worksheet } = useBloomStore();

  const activeSection = activeSectionId
    ? worksheet?.sections?.find((s: any) => s.id === activeSectionId)
    : null;

  if (!isOpen) return null;

  return (
    <div className="print:hidden w-72 shrink-0 flex flex-col border-l border-border bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="font-bold text-sm text-foreground">Worksheet Editor</p>
          {activeSection ? (
            <p className="text-xs text-primary font-medium truncate max-w-[180px]">
              Editing: {activeSection.title}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Click a section to select it</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors whitespace-nowrap min-w-0 px-1 ${
              tab === id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">

        {/* Global tabs — no section required */}
        {tab === "ai" && <AIStylePanel />}
        {tab === "typography" && <TypographyPanel />}

        {/* Section-scoped tabs */}
        {(tab === "text" || tab === "section") && !activeSectionId && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            Click any section in the preview to select it, then apply styling here.
          </div>
        )}

        {tab === "text" && activeSectionId && (
          <TextStyleToolbar sectionId={activeSectionId} />
        )}

        {tab === "section" && activeSectionId && (
          <SectionStylePanel sectionId={activeSectionId} />
        )}

        {tab === "section" && !activeSectionId && (
          <SectionStylePanel sectionId="__page__" />
        )}

        {tab === "clipart" && (
          <ClipartPanel activeSectionId={activeSectionId} />
        )}
      </div>
    </div>
  );
}
