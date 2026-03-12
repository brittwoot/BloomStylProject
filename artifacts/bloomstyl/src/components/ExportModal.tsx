import { useState, useRef } from "react";
import { X, Download, FileText, Loader2, CheckCircle } from "lucide-react";

interface ExportModalProps {
  onClose: () => void;
  worksheetTitle?: string;
}

type ExportMode = "student" | "answer_key" | "both";

export function ExportModal({ onClose, worksheetTitle = "worksheet" }: ExportModalProps) {
  const [mode, setMode] = useState<ExportMode>("student");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const LETTER_W_PX = 816;
      const LETTER_H_PX = 1056;

      const paper = document.getElementById("worksheet-paper");
      if (!paper) throw new Error("Worksheet not found");

      const canvas = await html2canvas(paper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: paper.scrollWidth,
        height: paper.scrollHeight,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;

      const ratio = pageW / imgW;
      const scaledH = imgH * ratio;

      if (scaledH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pageW, scaledH);
      } else {
        let yOffset = 0;
        let page = 0;
        while (yOffset < imgH) {
          if (page > 0) pdf.addPage();
          const sliceH = Math.min(imgH - yOffset, pageH / ratio);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = imgW;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, yOffset, imgW, sliceH, 0, 0, imgW, sliceH);
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, pageW, sliceH * ratio);
          yOffset += sliceH;
          page++;
        }
      }

      const filename = `${worksheetTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_worksheet.pdf`;
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-base">Export Worksheet</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Download as PDF — letter size (8.5 × 11)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export options */}
        <div className="p-5 space-y-3">
          {(["student", "answer_key", "both"] as ExportMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                mode === m
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                mode === m ? "border-primary" : "border-border"
              }`}>
                {mode === m && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {m === "student" ? "Student Worksheet" : m === "answer_key" ? "Answer Key Only" : "Both (2 pages)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m === "student"
                    ? "Clean worksheet for students"
                    : m === "answer_key"
                    ? "Answer key for teacher reference"
                    : "Student sheet + answer key in one PDF"}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || done}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {done ? (
              <><CheckCircle className="w-4 h-4" /> Downloaded!</>
            ) : exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            High-resolution, print-ready PDF
          </p>
        </div>
      </div>
    </div>
  );
}
