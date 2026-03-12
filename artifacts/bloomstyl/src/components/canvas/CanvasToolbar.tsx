import type { RefObject } from "react";
import type { FabricCanvasHandle } from "./canvasTypes";

interface Props {
  canvasRef: RefObject<FabricCanvasHandle | null>;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];

export default function CanvasToolbar({ canvasRef, canUndo, canRedo, zoom, onZoomChange }: Props) {
  return (
    <header className="canvas-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          disabled={!canUndo}
          onClick={() => canvasRef.current?.undo()}
          title="Undo (Ctrl+Z)"
        >
          ↩ Undo
        </button>
        <button
          className="toolbar-btn"
          disabled={!canRedo}
          onClick={() => canvasRef.current?.redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪ Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("left")} title="Align Left">⬤⬅</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("center-h")} title="Center Horizontal">⬤↔</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("right")} title="Align Right">⬤➡</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("top")} title="Align Top">⬆⬤</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("center-v")} title="Center Vertical">↕⬤</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.alignObjects("bottom")} title="Align Bottom">⬇⬤</button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-zoom">
        <button
          className="toolbar-btn"
          onClick={() => {
            const idx = ZOOM_LEVELS.indexOf(zoom);
            if (idx > 0) onZoomChange(ZOOM_LEVELS[idx - 1]);
          }}
          disabled={zoom <= ZOOM_LEVELS[0]}
        >
          −
        </button>
        <select
          className="toolbar-select"
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        >
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>{Math.round(z * 100)}%</option>
          ))}
        </select>
        <button
          className="toolbar-btn"
          onClick={() => {
            const idx = ZOOM_LEVELS.indexOf(zoom);
            if (idx < ZOOM_LEVELS.length - 1) onZoomChange(ZOOM_LEVELS[idx + 1]);
          }}
          disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
        >
          +
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn toolbar-btn-export"
          onClick={() => canvasRef.current?.exportPNG()}
        >
          ↓ Export PNG
        </button>
      </div>
    </header>
  );
}
