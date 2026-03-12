import { Loader2, Pencil, Copy, Trash2, Anchor, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import type { WorksheetVersion } from "../../types/differentiationTypes";

type Props = {
  version: WorksheetVersion;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetAnchor: () => void;
  onResync: () => void;
  onKeepOverride: () => void;
  onSelect: () => void;
  isSelected: boolean;
};

export function VersionCard({
  version,
  onEdit,
  onDuplicate,
  onDelete,
  onSetAnchor,
  onResync,
  onKeepOverride,
  onSelect,
  isSelected,
}: Props) {
  const isGenerating = version.status === "generating";
  const hasError = version.status === "error";
  const isComplete = version.status === "complete";

  return (
    <div
      onClick={onSelect}
      className={`relative flex-shrink-0 w-72 rounded-2xl border-2 bg-white transition-all cursor-pointer ${
        isSelected
          ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:shadow-md"
      }`}
    >
      {version.isAnchor && (
        <div className="absolute -top-2.5 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Anchor className="w-2.5 h-2.5" />
          Anchor
        </div>
      )}

      {version.syncAvailable && (
        <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
          <RefreshCw className="w-2.5 h-2.5" />
          Sync Available
        </div>
      )}

      <div
        className="h-2 rounded-t-xl"
        style={{ backgroundColor: version.color }}
      />

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: version.color }} />
          <span className="font-bold text-sm text-foreground truncate">{version.label}</span>
        </div>

        <div
          className={`h-32 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden ${
            isComplete && version.content ? "cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all" : ""
          }`}
          onClick={(e) => {
            if (isComplete && version.content) {
              e.stopPropagation();
              onEdit();
            }
          }}
          title={isComplete && version.content ? "Click to edit in full editor" : undefined}
        >
          {isGenerating && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Generating…</span>
            </div>
          )}
          {hasError && (
            <div className="flex flex-col items-center gap-2 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xs font-medium">Failed</span>
              {version.error && (
                <span className="text-[10px] text-red-400 text-center px-2">{version.error}</span>
              )}
            </div>
          )}
          {isComplete && version.content && (
            <div className="w-full h-full p-3 overflow-hidden">
              <div className="text-[8px] text-foreground/50 leading-tight space-y-1 pointer-events-none select-none">
                <p className="font-bold text-[10px] text-foreground/70 truncate">
                  {version.content.title || "Untitled"}
                </p>
                {version.content.sections?.slice(0, 3).map((s: any, i: number) => (
                  <p key={i} className="truncate">
                    {s.title || s.type}
                  </p>
                ))}
                {(version.content.sections?.length || 0) > 3 && (
                  <p className="text-foreground/30">+{version.content.sections.length - 3} more sections</p>
                )}
              </div>
            </div>
          )}
          {version.status === "idle" && !version.isAnchor && version.content && (
            <div className="flex flex-col items-center gap-1 text-amber-600">
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs font-medium">Settings changed</span>
              <span className="text-[10px] text-amber-500">Click Generate to update</span>
            </div>
          )}
          {version.status === "idle" && !version.content && (
            <span className="text-xs text-muted-foreground">Not yet generated</span>
          )}
        </div>

        {version.changeSummary.length > 0 && (
          <div className="space-y-1">
            {version.changeSummary.map((bullet, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <span className="text-[11px] text-foreground/70 leading-tight">{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {version.syncAvailable && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onResync(); }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Re-sync
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onKeepOverride(); }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-muted/50 text-foreground/60 text-[11px] font-semibold border border-border hover:bg-muted transition-colors"
            >
              Keep Override
            </button>
          </div>
        )}

        <div className="flex gap-1.5 pt-1 border-t border-border">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            disabled={!isComplete}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-30"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-foreground/60 hover:bg-muted transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          {!version.isAnchor && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSetAnchor(); }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-foreground/60 hover:bg-muted transition-colors"
                title="Set as Anchor"
              >
                <Anchor className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-red-500/60 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
