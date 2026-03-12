import type { RefObject } from "react";
import type { CanvasLayer, FabricCanvasHandle, SelectedObjectProps } from "./canvasTypes";

const FONT_FAMILIES = [
  "DM Sans", "Outfit", "Nunito", "Poppins", "Inter", "Georgia",
  "Playfair Display", "Montserrat", "Space Grotesk",
  "Fredoka One", "Bubblegum Sans", "Chewy", "Architects Daughter",
  "Patrick Hand", "Comic Neue",
];

interface Props {
  canvasRef: RefObject<FabricCanvasHandle | null>;
  selectedProps: SelectedObjectProps | null;
  layers: CanvasLayer[];
}

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="prop-field">
      <label className="prop-label">{label}</label>
      <div className="prop-control">{children}</div>
    </div>
  );
}

function NumberInput({
  value, min, max, step = 1, onChange,
}: { value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      className="prop-input prop-number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="color-row">
      <input type="color" className="prop-color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} />
      <input
        type="text"
        className="prop-input prop-hex"
        value={value || ""}
        maxLength={7}
        onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
      />
    </div>
  );
}

export default function RightPanel({ canvasRef, selectedProps, layers }: Props) {
  const update = (props: Partial<SelectedObjectProps>) => canvasRef.current?.updateSelectedProps(props);
  const isText = selectedProps?.type === "textbox" || selectedProps?.type === "i-text" || selectedProps?.type === "text";
  const isShape = selectedProps && !isText;

  return (
    <aside className="right-panel">
      <div className="right-panel-top">
        {/* ── PROPERTIES ── */}
        <div className="panel-block">
          <h4 className="panel-block-title">
            {selectedProps ? `Properties — ${selectedProps.name || selectedProps.type}` : "Canvas"}
          </h4>

          {!selectedProps && (
            <p className="panel-hint">Select an element on the canvas to edit its properties.</p>
          )}

          {selectedProps && (
            <>
              {/* Position & size */}
              <div className="prop-row-2">
                <Field label="X">
                  <NumberInput value={selectedProps.left} onChange={(v) => update({ left: v })} />
                </Field>
                <Field label="Y">
                  <NumberInput value={selectedProps.top} onChange={(v) => update({ top: v })} />
                </Field>
              </div>
              <div className="prop-row-2">
                <Field label="W">
                  <NumberInput value={selectedProps.width} min={1} onChange={(v) => update({ width: v, height: selectedProps.height })} />
                </Field>
                <Field label="H">
                  <NumberInput value={selectedProps.height} min={1} onChange={(v) => update({ width: selectedProps.width, height: v })} />
                </Field>
              </div>
              <div className="prop-row-2">
                <Field label="°">
                  <NumberInput value={selectedProps.angle} min={-180} max={180} onChange={(v) => update({ angle: v })} />
                </Field>
                <Field label="Opacity">
                  <NumberInput value={selectedProps.opacity} min={0} max={100} onChange={(v) => update({ opacity: v })} />
                </Field>
              </div>

              {/* Z-order */}
              <div className="z-order-row">
                <button className="btn-xs" onClick={() => canvasRef.current?.bringToFront()} title="Bring to Front">⬆⬆</button>
                <button className="btn-xs" onClick={() => canvasRef.current?.bringForward()} title="Bring Forward">⬆</button>
                <button className="btn-xs" onClick={() => canvasRef.current?.sendBackward()} title="Send Backward">⬇</button>
                <button className="btn-xs" onClick={() => canvasRef.current?.sendToBack()} title="Send to Back">⬇⬇</button>
                <button className="btn-xs" onClick={() => canvasRef.current?.duplicateSelected()} title="Duplicate">⎘</button>
                <button className="btn-xs btn-danger" onClick={() => canvasRef.current?.deleteSelected()} title="Delete">🗑</button>
              </div>

              {/* Text-specific */}
              {isText && selectedProps.text !== undefined && (
                <>
                  <div className="divider" />
                  <h5 className="prop-section-title">Text</h5>
                  <Field label="Font">
                    <select
                      className="prop-select"
                      value={selectedProps.fontFamily ?? "DM Sans"}
                      onChange={(e) => update({ fontFamily: e.target.value })}
                    >
                      {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <div className="prop-row-2">
                    <Field label="Size">
                      <NumberInput value={selectedProps.fontSize ?? 16} min={6} max={200} onChange={(v) => update({ fontSize: v })} />
                    </Field>
                    <Field label="Weight">
                      <select className="prop-select" value={selectedProps.fontWeight ?? "normal"} onChange={(e) => update({ fontWeight: e.target.value })}>
                        <option value="300">Light</option>
                        <option value="normal">Normal</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </Field>
                  </div>
                  <div className="prop-row-3">
                    <button className={`btn-xs ${selectedProps.fontStyle === "italic" ? "active" : ""}`} onClick={() => update({ fontStyle: selectedProps.fontStyle === "italic" ? "normal" : "italic" })}>I</button>
                    <button className={`btn-xs ${selectedProps.textAlign === "left" ? "active" : ""}`} onClick={() => update({ textAlign: "left" })}>⬅</button>
                    <button className={`btn-xs ${selectedProps.textAlign === "center" ? "active" : ""}`} onClick={() => update({ textAlign: "center" })}>☰</button>
                    <button className={`btn-xs ${selectedProps.textAlign === "right" ? "active" : ""}`} onClick={() => update({ textAlign: "right" })}>➡</button>
                  </div>
                  <Field label="Line H">
                    <NumberInput value={selectedProps.lineHeight ?? 1.3} min={0.8} max={3} step={0.1} onChange={(v) => update({ lineHeight: v })} />
                  </Field>
                  <Field label="Color">
                    <ColorPicker value={selectedProps.fill ?? "#1a1a1a"} onChange={(v) => update({ fill: v })} />
                  </Field>
                </>
              )}

              {/* Shape-specific */}
              {isShape && (
                <>
                  <div className="divider" />
                  <h5 className="prop-section-title">Fill & Stroke</h5>
                  <Field label="Fill">
                    <ColorPicker value={selectedProps.fill ?? "#e8e2f5"} onChange={(v) => update({ fill: v })} />
                  </Field>
                  <Field label="Stroke">
                    <ColorPicker value={selectedProps.stroke ?? "#9b8ec4"} onChange={(v) => update({ stroke: v })} />
                  </Field>
                  <Field label="Stroke W">
                    <NumberInput value={selectedProps.strokeWidth ?? 1} min={0} max={20} onChange={(v) => update({ strokeWidth: v })} />
                  </Field>
                  {selectedProps.type === "rect" && (
                    <Field label="Corner R">
                      <NumberInput value={selectedProps.rx ?? 0} min={0} max={100} onChange={(v) => update({ rx: v })} />
                    </Field>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── LAYERS ── */}
      <div className="panel-block layers-block">
        <h4 className="panel-block-title">Layers ({layers.length})</h4>
        {layers.length === 0 && (
          <p className="panel-hint">Add elements to the canvas to see them here.</p>
        )}
        <ul className="layers-list">
          {layers.map((layer) => (
            <li
              key={layer.id}
              className={`layer-item ${!layer.visible ? "layer-hidden" : ""} ${layer.locked ? "layer-locked" : ""}`}
              onClick={() => canvasRef.current?.selectById(layer.id)}
            >
              <span className="layer-icon">
                {layer.type === "textbox" || layer.type === "text" ? "T" :
                 layer.type === "rect" ? "▭" :
                 layer.type === "circle" ? "●" :
                 layer.type === "path" ? "✦" :
                 layer.type === "group" ? "⊞" :
                 layer.type === "image" ? "🖼" : "◼"}
              </span>
              <span className="layer-name">{layer.name}</span>
              <div className="layer-actions">
                <button
                  className="layer-action-btn"
                  title={layer.visible ? "Hide" : "Show"}
                  onClick={(e) => { e.stopPropagation(); canvasRef.current?.toggleVisibility(layer.id); }}
                >
                  {layer.visible ? "👁" : "◻"}
                </button>
                <button
                  className="layer-action-btn"
                  title={layer.locked ? "Unlock" : "Lock"}
                  onClick={(e) => { e.stopPropagation(); canvasRef.current?.toggleLock(layer.id); }}
                >
                  {layer.locked ? "🔒" : "🔓"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
