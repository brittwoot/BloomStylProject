import { useRef, useState } from "react";
import FabricCanvas from "../components/canvas/FabricCanvas";
import LeftPanel from "../components/canvas/LeftPanel";
import RightPanel from "../components/canvas/RightPanel";
import CanvasToolbar from "../components/canvas/CanvasToolbar";
import AISuggestionsChip from "../components/canvas/AISuggestionsChip";
import type { CanvasLayer, FabricCanvasHandle, LeftPanelTab, SelectedObjectProps } from "../components/canvas/canvasTypes";

export default function CanvasEditor() {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const [activeTab, setActiveTab] = useState<LeftPanelTab>("content");
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedProps, setSelectedProps] = useState<SelectedObjectProps | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);

  function handleZoomChange(z: number) {
    setZoom(z);
    canvasRef.current?.setZoom(z);
  }

  function handleSuggestionFix(suggestion: { id: string; message: string; fixLabel?: string }) {
    const c = canvasRef.current;
    if (!c) return;
    if (suggestion.id === "no-title") c.addTitleBlock();
    else if (suggestion.id === "no-directions") c.addDirectionsBlock();
    else if (suggestion.id === "no-namedate") c.addNameDateLine();
  }

  return (
    <div className="canvas-editor-root">
      <CanvasToolbar
        canvasRef={canvasRef}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        onZoomChange={handleZoomChange}
      />

      <div className="canvas-editor-body">
        <LeftPanel
          canvasRef={canvasRef}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="canvas-stage">
          <div
            className="canvas-paper-wrapper"
            style={{
              width: 816 * zoom + 80,
              minHeight: 1056 * zoom + 80,
            }}
          >
            <div
              className="canvas-paper-shadow"
              style={{
                width: 816 * zoom,
                height: 1056 * zoom,
              }}
            >
              <FabricCanvas
                ref={canvasRef}
                zoom={zoom}
                onLayersChange={setLayers}
                onSelectionChange={setSelectedProps}
                onHistoryChange={(undo, redo) => { setCanUndo(undo); setCanRedo(redo); }}
              />
            </div>
          </div>

          <AISuggestionsChip
            layers={layers}
            selectedProps={selectedProps}
            onFix={handleSuggestionFix}
          />
        </main>

        <RightPanel
          canvasRef={canvasRef}
          selectedProps={selectedProps}
          layers={layers}
        />
      </div>
    </div>
  );
}
