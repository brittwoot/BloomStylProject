import { useState } from "react";
import { X, Download, Loader2, CheckCircle, FileText, Printer } from "lucide-react";
import type { WorksheetVersion, GlobalDiffSettings } from "../../types/differentiationTypes";

type Props = {
  onClose: () => void;
  versions: WorksheetVersion[];
  globalSettings: GlobalDiffSettings;
  setName: string;
};

type ExportType = "single-pdf" | "class-set" | "summary-sheet";

export function DiffExportModal({ onClose, versions, globalSettings, setName }: Props) {
  const [exportType, setExportType] = useState<ExportType>(
    globalSettings.printMode === "separately" ? "class-set" : "single-pdf"
  );
  const [copiesPerLevel, setCopiesPerLevel] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    versions.forEach((v) => { map[v.id] = 5; });
    return map;
  });
  const [includeSummarySheet, setIncludeSummarySheet] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      let isFirstPage = true;

      if (includeSummarySheet) {
        pdf.setFontSize(18);
        pdf.text(`${setName} — Teacher Summary`, 40, 60);

        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 80);
        pdf.text(`Versions: ${versions.length}`, 40, 95);

        let y = 130;
        versions.forEach((v, i) => {
          pdf.setFontSize(13);
          pdf.text(`${String.fromCharCode(65 + i)}. ${v.label}`, 40, y);
          y += 20;

          pdf.setFontSize(9);
          const settings = v.scaffoldSettings;
          pdf.text(`Reading Level: ${settings.readingLevel} | Vocabulary: ${settings.vocabularyLevel} | Bloom's: ${settings.bloomsDepth}`, 55, y);
          y += 14;
          pdf.text(`Text Reduction: ${settings.textReduction}% | Word Bank: ${settings.wordBank} | Sentence Frames: ${settings.sentenceFrames}`, 55, y);
          y += 14;

          if (v.changeSummary.length > 0) {
            v.changeSummary.forEach((bullet) => {
              pdf.text(`• ${bullet}`, 55, y);
              y += 12;
            });
          }

          y += 10;
        });

        isFirstPage = false;
      }

      const copies = exportType === "class-set" ? copiesPerLevel : undefined;

      for (const version of versions) {
        const copyCount = copies ? (copies[version.id] || 1) : 1;
        for (let c = 0; c < copyCount; c++) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;

          pdf.setFontSize(16);
          pdf.text(version.content?.title || "Worksheet", 40, 50);

          if (globalSettings.versionIndicator !== "none") {
            pdf.setFontSize(8);
            if (globalSettings.versionIndicator === "corner-tab") {
              pdf.setFillColor(version.color);
              pdf.rect(pageW - 60, 0, 60, 25, "F");
              pdf.setTextColor(255, 255, 255);
              pdf.text(version.label, pageW - 55, 16);
              pdf.setTextColor(0, 0, 0);
            } else if (globalSettings.versionIndicator === "subtle-dot") {
              pdf.setFillColor(version.color);
              pdf.circle(pageW - 20, 20, 4, "F");
            } else if (globalSettings.versionIndicator === "letter") {
              const idx = versions.indexOf(version);
              pdf.text(`Version ${String.fromCharCode(65 + idx)}`, pageW - 80, 20);
            }
          }

          pdf.setFontSize(10);
          let y = 80;

          const sections = version.content?.sections || [];
          for (const section of sections) {
            if (y > 700) {
              pdf.addPage();
              y = 50;
            }

            pdf.setFontSize(12);
            pdf.text(section.title || "", 40, y);
            y += 18;

            if (section.instructions) {
              pdf.setFontSize(9);
              pdf.text(section.instructions, 40, y);
              y += 14;
            }

            if (section.passage) {
              pdf.setFontSize(9);
              const lines = pdf.splitTextToSize(section.passage, pageW - 80);
              pdf.text(lines, 40, y);
              y += lines.length * 12 + 10;
            }

            if (Array.isArray(section.questions)) {
              section.questions.forEach((q: any, qi: number) => {
                if (y > 700) {
                  pdf.addPage();
                  y = 50;
                }
                pdf.setFontSize(10);
                const qText = `${qi + 1}. ${q.text || q.prompt || ""}`;
                const qLines = pdf.splitTextToSize(qText, pageW - 80);
                pdf.text(qLines, 40, y);
                y += qLines.length * 13 + 20;
              });
            }

            y += 10;
          }
        }
      }

      const filename = `${setName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_differentiated_set.pdf`;
      pdf.save(filename);
      setDone(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-base">Export Differentiated Set</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{versions.length} versions ready</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {([
            { value: "single-pdf" as ExportType, label: "Single PDF", desc: "All versions concatenated in one file", icon: FileText },
            { value: "class-set" as ExportType, label: "Class-Set Print", desc: "Specify copies per level for printing", icon: Printer },
          ]).map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setExportType(value)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                exportType === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                exportType === value ? "border-primary" : "border-border"
              }`}>
                {exportType === value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <Icon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}

          {exportType === "class-set" && (
            <div className="space-y-2 pl-6">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{v.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={copiesPerLevel[v.id] || 0}
                    onChange={(e) => setCopiesPerLevel((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))}
                    className="w-16 px-2 py-1 rounded-lg border border-border text-sm text-center"
                  />
                  <span className="text-[10px] text-muted-foreground">copies</span>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={includeSummarySheet}
              onChange={(e) => setIncludeSummarySheet(e.target.checked)}
              className="rounded accent-primary w-4 h-4"
            />
            <div>
              <p className="text-xs font-semibold text-foreground">Include Teacher Summary Sheet</p>
              <p className="text-[10px] text-muted-foreground">Lists each version's level and scaffold settings</p>
            </div>
          </label>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || done}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
          >
            {done ? (
              <><CheckCircle className="w-4 h-4" /> Downloaded!</>
            ) : exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
