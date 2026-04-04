import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { FabricCanvasHandle, LeftPanelTab, ShapeType } from "./canvasTypes";
import { CONTENT_BLOCKS, SHAPE_CATEGORIES, getShapesByCategory } from "./shapeLibrary";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SHAPE_ICONS: Record<string, string> = {
  rect: "▭", "rounded-rect": "▢", circle: "●", oval: "⬯", triangle: "▲",
  diamond: "◆", pentagon: "⬠", hexagon: "⬡", octagon: "⯃",
  "star-5": "★", "star-4": "✦", "star-6": "✶", "star-8": "✳",
  heart: "♥", "arrow-right": "→", "arrow-left": "←", "arrow-up": "↑",
  "arrow-down": "↓", "arrow-double": "↔", cross: "✚",
  cloud: "☁", "speech-bubble": "💬", "thought-bubble": "💭",
  starburst: "✸", lightning: "⚡", moon: "☽", leaf: "🍃", flower: "❀",
  banner: "🎀", "sticky-note": "📒", "label-tag": "🏷",
  polaroid: "📷", chalkboard: "🖼",
};

const TEXT_PRESETS = [
  { label: "Title", font: "Outfit", size: 32, weight: "700", sample: "Worksheet Title" },
  { label: "Heading", font: "Outfit", size: 22, weight: "600", sample: "Section Heading" },
  { label: "Body", font: "DM Sans", size: 14, weight: "400", sample: "Body text for instructions..." },
  { label: "Caption", font: "DM Sans", size: 11, weight: "400", sample: "Small caption or label" },
  { label: "Bubbly K–2", font: "Nunito", size: 18, weight: "700", sample: "Fun text for kids!" },
  { label: "Fun 3–5", font: "Poppins", size: 16, weight: "600", sample: "Activity heading" },
  { label: "Clean 6+", font: "Inter", size: 15, weight: "400", sample: "Secondary level text" },
];

const BG_COLORS = [
  "#ffffff", "#fef9ef", "#fff5f5", "#f0f9ff", "#f5f0ff",
  "#fffbeb", "#f0fff4", "#fff0fb", "#f0f4ff", "#fafafa",
];

const BG_PATTERNS = [
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "grid", label: "Grid" },
  { id: "music", label: "Music Staff" },
  { id: "handwriting", label: "Handwriting" },
];

interface Props {
  canvasRef: RefObject<FabricCanvasHandle | null>;
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
}

const TABS: { id: LeftPanelTab; icon: string; label: string }[] = [
  { id: "generate", icon: "✦", label: "Generate" },
  { id: "content", icon: "⊞", label: "Content" },
  { id: "images", icon: "🖼", label: "Images" },
  { id: "shapes", icon: "◑", label: "Shapes" },
  { id: "text", icon: "T", label: "Text" },
  { id: "background", icon: "◉", label: "Background" },
];

export default function LeftPanel({ canvasRef, activeTab, onTabChange }: Props) {
  const [shapeCategory, setShapeCategory] = useState<string>("basic");
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingSvg, setIsGeneratingSvg] = useState(false);
  const [imageStyle, setImageStyle] = useState<string>("line-art");
  const [generatedSvgs, setGeneratedSvgs] = useState<{ url: string; description: string }[]>([]);
  const [svgDescription, setSvgDescription] = useState("");
  const [svgRegions, setSvgRegions] = useState(6);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addShape = (type: ShapeType) => canvasRef.current?.addShape(type);
  const addBlock = (id: string) => {
    const c = canvasRef.current;
    if (!c) return;
    if (id === "answer-lines") c.addAnswerLines(5);
    else if (id === "word-bank") c.addWordBank();
    else if (id === "write-in-box") c.addWriteInBox();
    else if (id === "directions") c.addDirectionsBlock();
    else if (id === "name-date") c.addNameDateLine();
    else if (id === "color-key") c.addColorKeyBlock();
    else if (id === "title") c.addTitleBlock();
    else if (id === "subtitle") c.addSubtitleBlock();
    else if (id === "vocabulary") c.addTextBlock("Word 1 — Definition goes here\nWord 2 — Definition goes here\nWord 3 — Definition goes here");
    else c.addTextBlock();
  };

  const addTextPreset = (p: typeof TEXT_PRESETS[0]) => {
    canvasRef.current?.addTextBlock(p.sample);
  };

  async function generateColoringPage() {
    if (!svgDescription.trim()) return;
    setIsGeneratingSvg(true);
    try {
      const res = await fetch(`http://localhost:8080/api/worksheet/generate-svg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: svgDescription, regions: svgRegions }),
      });
      const data = await res.json();
      if (data.svg) {
        const blob = new Blob([data.svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        setGeneratedSvgs((prev) => [{ url, description: svgDescription }, ...prev]);
        canvasRef.current?.addSvgFromString(data.svg, svgDescription);
      }
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingSvg(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImages((prev) => [url, ...prev]);
    canvasRef.current?.addImage(url);
  }

  return (
    <aside className="left-panel">
      <nav className="left-panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="left-panel-content">
        {activeTab === "generate" && (
          <div className="panel-section">
            <h3 className="panel-section-title">AI Generate</h3>
            <p className="panel-hint">
              Use the prompt flow to generate a full worksheet layout, or generate a coloring page illustration below.
            </p>
            <a href={`${BASE || "/"}`} className="btn-primary w-full text-center block mb-4" style={{ textDecoration: "none", padding: "10px", borderRadius: "8px" }}>
              ✦ Open Prompt Flow
            </a>

            <div className="divider" />
            <h3 className="panel-section-title mt-4">🎨 Coloring Page SVG</h3>
            <p className="panel-hint">Describe an illustration and Claude will generate a colorable SVG.</p>
            <textarea
              className="panel-input"
              rows={3}
              placeholder="e.g. A friendly frog on a lily pad"
              value={svgDescription}
              onChange={(e) => setSvgDescription(e.target.value)}
            />
            <div className="flex gap-2 mb-3">
              <label className="panel-label">Regions</label>
              <select className="panel-select" value={svgRegions} onChange={(e) => setSvgRegions(Number(e.target.value))}>
                {[4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              className="btn-primary w-full"
              onClick={generateColoringPage}
              disabled={isGeneratingSvg || !svgDescription.trim()}
            >
              {isGeneratingSvg ? "Generating…" : "✦ Generate Coloring Page"}
            </button>
            {generatedSvgs.length > 0 && (
              <div className="mt-3">
                <p className="panel-hint">Generated illustrations:</p>
                <div className="generated-svgs-grid">
                  {generatedSvgs.map((s, i) => (
                    <button key={i} className="svg-thumb" onClick={() => canvasRef.current?.addImage(s.url)} title={s.description}>
                      <img src={s.url} alt={s.description} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div className="panel-section">
            <h3 className="panel-section-title">Content Blocks</h3>
            <p className="panel-hint">Click to add a block to the canvas.</p>
            <div className="content-blocks-list">
              {CONTENT_BLOCKS.map((block) => (
                <button
                  key={block.id}
                  className="content-block-btn"
                  onClick={() => addBlock(block.id)}
                >
                  <span className="block-icon">{block.icon}</span>
                  <div className="block-info">
                    <span className="block-label">{block.label}</span>
                    <span className="block-desc">{block.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="panel-section">
            <h3 className="panel-section-title">Images</h3>
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">📁</div>
              <p className="upload-text">Upload PNG, JPG, SVG, WebP</p>
              <input ref={fileInputRef} type="file" accept="image/*,.svg" style={{ display: "none" }} onChange={handleImageUpload} />
            </div>
            {uploadedImages.length > 0 && (
              <div>
                <p className="panel-hint mt-2">Uploaded images:</p>
                <div className="image-grid">
                  {uploadedImages.map((src, i) => (
                    <button key={i} className="image-thumb" onClick={() => canvasRef.current?.addImage(src)}>
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "shapes" && (
          <div className="panel-section">
            <h3 className="panel-section-title">Shapes</h3>
            <div className="shape-category-tabs">
              {SHAPE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`shape-cat-btn ${shapeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setShapeCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="shape-grid">
              {getShapesByCategory(shapeCategory).map((shape) => (
                <button
                  key={shape.id}
                  className="shape-btn"
                  title={shape.label}
                  onClick={() => addShape(shape.id)}
                >
                  <span className="shape-icon">{SHAPE_ICONS[shape.id] ?? "◼"}</span>
                  <span className="shape-label">{shape.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <div className="panel-section">
            <h3 className="panel-section-title">Text Styles</h3>
            <p className="panel-hint">Click a style to add it to the canvas.</p>
            <div className="text-presets">
              {TEXT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="text-preset-btn"
                  onClick={() => addTextPreset(p)}
                  style={{ fontFamily: p.font, fontSize: Math.min(p.size, 20), fontWeight: p.weight }}
                >
                  <span className="preset-badge">{p.label}</span>
                  {p.sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "background" && (
          <div className="panel-section">
            <h3 className="panel-section-title">Page Background</h3>
            <p className="panel-label">Solid Color</p>
            <div className="bg-colors-grid">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  className="bg-color-swatch"
                  style={{ background: color }}
                  onClick={() => canvasRef.current?.setBackground(color)}
                  title={color}
                />
              ))}
              <input
                type="color"
                className="bg-color-picker"
                defaultValue="#ffffff"
                onChange={(e) => canvasRef.current?.setBackground(e.target.value)}
                title="Custom color"
              />
            </div>
            <p className="panel-label mt-4">Grid / Snap</p>
            <button className="btn-outline w-full" onClick={() => canvasRef.current?.toggleGrid()}>
              Toggle Snap Grid
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
