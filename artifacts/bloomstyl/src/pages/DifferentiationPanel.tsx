import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Loader2,
  Download,
  Settings,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { useDifferentiationStore } from "../stores/differentiationStore";
import { useBloomStore } from "../store";
import { VersionCard } from "../components/differentiation/VersionCard";
import { ScaffoldSettingsPanel } from "../components/differentiation/ScaffoldSettingsPanel";
import { GlobalSettingsPanel } from "../components/differentiation/GlobalSettingsPanel";
import { DiffTemplatePicker } from "../components/differentiation/DiffTemplatePicker";
import type { DiffTemplate, ScaffoldSettings } from "../types/differentiationTypes";
import { DEFAULT_SCAFFOLD_SETTINGS } from "../types/differentiationTypes";
import { DiffExportModal } from "../components/differentiation/DiffExportModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const VERSION_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function DifferentiationPanel() {
  const [, setLocation] = useLocation();
  const {
    activeSet,
    addVersion,
    removeVersion,
    duplicateVersion,
    setAnchor,
    updateScaffoldSettings,
    updateGlobalSettings,
    updateVersionStatus,
    updateVersionContent,
    clearSyncFlag,
    markManuallyOverridden,
    markSyncAvailable,
    setEditingVersion,
    editingVersionId,
    applyTemplate,
    clearSet,
  } = useDifferentiationStore();

  const { setWorksheet } = useBloomStore();

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"settings" | "templates">("settings");
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const selectedVersion = activeSet?.versions.find((v) => v.id === selectedVersionId) || null;
  const anchorVersion = activeSet?.versions.find((v) => v.isAnchor);

  const autoGenTriggered = useRef(false);

  const handleAddVersion = () => {
    if (!activeSet || activeSet.versions.length >= 5) return;
    const idx = activeSet.versions.length;
    addVersion(
      `Version ${String.fromCharCode(65 + idx)}`,
      VERSION_COLORS[idx % VERSION_COLORS.length],
    );
  };

  const generateSingleVersion = useCallback(async (version: { id: string; label: string; scaffoldSettings: any }, anchorContent: any, globalSettings?: any) => {
    updateVersionStatus(version.id, "generating");
    try {
      const res = await fetch(`http://localhost:8080/api/worksheet/differentiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorContent,
          globalSettings,
          versions: [{
            versionId: version.id,
            label: version.label,
            scaffoldSettings: version.scaffoldSettings,
          }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const result = data.versions[0];

      if (result.status === "complete") {
        updateVersionContent(result.versionId, result.worksheet, result.changeSummary);
      } else {
        updateVersionStatus(result.versionId, "error", result.error);
      }
    } catch (err) {
      updateVersionStatus(version.id, "error", "Generation failed — please try again");
    }
  }, [updateVersionStatus, updateVersionContent]);

  const handleGenerate = useCallback(async () => {
    if (!activeSet || !anchorVersion?.content) return;

    const versionsToGenerate = activeSet.versions.filter(
      (v) => !v.isAnchor && (v.status === "idle" || v.status === "error")
    );

    if (versionsToGenerate.length === 0) return;

    setIsGenerating(true);

    const promises = versionsToGenerate.map((v) =>
      generateSingleVersion(v, anchorVersion.content, activeSet.globalSettings)
    );

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }, [activeSet, anchorVersion, generateSingleVersion]);

  useEffect(() => {
    if (
      !autoGenTriggered.current &&
      activeSet &&
      anchorVersion?.content &&
      activeSet.versions.some((v) => !v.isAnchor && v.status === "idle" && !v.content)
    ) {
      autoGenTriggered.current = true;
      handleGenerate();
    }
  }, [activeSet, anchorVersion, handleGenerate]);

  const handleResync = async (versionId: string) => {
    const version = activeSet?.versions.find((v) => v.id === versionId);
    if (!version || !anchorVersion?.content) return;

    updateVersionStatus(versionId, "generating");
    clearSyncFlag(versionId);

    try {
      const res = await fetch(`http://localhost:8080/api/worksheet/differentiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorContent: anchorVersion.content,
          versions: [{
            versionId: version.id,
            label: version.label,
            scaffoldSettings: version.scaffoldSettings,
          }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const result = data.versions[0];

      if (result.status === "complete") {
        updateVersionContent(result.versionId, result.worksheet, result.changeSummary);
      } else {
        updateVersionStatus(result.versionId, "error", result.error);
      }
    } catch (err) {
      updateVersionStatus(versionId, "error", "Re-sync failed");
    }
  };

  const handleEditVersion = (versionId: string) => {
    const version = activeSet?.versions.find((v) => v.id === versionId);
    if (!version?.content) return;

    setEditingVersion(versionId);
    setWorksheet(version.content);
    setLocation(`${BASE}/result`);
  };

  const handleApplyTemplate = (template: DiffTemplate) => {
    const anchor = anchorVersion?.content || null;
    applyTemplate(template, anchor);
  };

  const handleBack = () => {
    if (editingVersionId) {
      setEditingVersion(null);
    }
    setLocation(`${BASE}/result`);
  };

  if (!activeSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Layers className="w-12 h-12 text-muted-foreground/40" />
        <h2 className="text-lg font-bold text-foreground">No Differentiated Set</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Start by creating a worksheet, then use "Differentiate This" from the result page, or use the multi-level generator from the prompt page.
        </p>
        <button
          type="button"
          onClick={() => setLocation(`${BASE}/prompt`)}
          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm"
        >
          Go to Prompt Page
        </button>
      </div>
    );
  }

  const hasUngenerated = activeSet.versions.some(
    (v) => !v.isAnchor && (v.status === "idle" || v.status === "error")
  );

  const anchorHasContent = !!anchorVersion?.content;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-72 border-r border-border bg-white overflow-y-auto shrink-0">
        <div className="p-4 border-b border-border">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Result
          </button>
          <h2 className="font-bold text-foreground text-base">{activeSet.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {activeSet.versions.length} version{activeSet.versions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setLeftTab("settings")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              leftTab === "settings"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1" />
            Settings
          </button>
          <button
            type="button"
            onClick={() => setLeftTab("templates")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              leftTab === "templates"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Templates
          </button>
        </div>

        {leftTab === "settings" && activeSet.globalSettings && (
          <GlobalSettingsPanel
            settings={activeSet.globalSettings}
            onChange={updateGlobalSettings}
          />
        )}

        {leftTab === "templates" && (
          <DiffTemplatePicker onApply={handleApplyTemplate} />
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border bg-white/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-foreground">Differentiation Panel</h1>
            {activeSet.versions.length < 5 && (
              <button
                type="button"
                onClick={handleAddVersion}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Version
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!anchorHasContent && (
              <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                Create an anchor worksheet first — go to Prompt or upload a document
              </span>
            )}
            {hasUngenerated && anchorHasContent && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate All Versions</>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              disabled={!activeSet.versions.some((v) => v.status === "complete")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm border border-border hover:bg-muted/60 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export Set
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="flex gap-4 min-h-full items-start">
            {activeSet.versions.map((version) => (
              <motion.div
                key={version.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <VersionCard
                  version={version}
                  isSelected={selectedVersionId === version.id}
                  onSelect={() => setSelectedVersionId(version.id)}
                  onEdit={() => handleEditVersion(version.id)}
                  onDuplicate={() => duplicateVersion(version.id)}
                  onDelete={() => removeVersion(version.id)}
                  onSetAnchor={() => setAnchor(version.id)}
                  onResync={() => handleResync(version.id)}
                  onKeepOverride={() => markManuallyOverridden(version.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedVersion && (
        <div className="w-80 border-l border-border bg-white overflow-y-auto shrink-0">
          <ScaffoldSettingsPanel
            settings={selectedVersion.scaffoldSettings}
            onChange={(updates) => updateScaffoldSettings(selectedVersion.id, updates)}
            versionLabel={selectedVersion.label}
            versionColor={selectedVersion.color}
          />
        </div>
      )}

      {exportOpen && (
        <DiffExportModal
          onClose={() => setExportOpen(false)}
          versions={activeSet.versions.filter((v) => v.status === "complete")}
          globalSettings={activeSet.globalSettings}
          setName={activeSet.name}
        />
      )}
    </div>
  );
}
