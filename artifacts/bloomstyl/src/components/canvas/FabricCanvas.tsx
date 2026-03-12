import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  Group,
  Line,
  loadSVGFromString,
  Path,
  Rect,
  Textbox,
  Triangle,
} from "fabric";
import { nanoid } from "nanoid";
import type { CanvasLayer, FabricCanvasHandle, SelectedObjectProps, ShapeType } from "./canvasTypes";
import { SHAPES } from "./shapeLibrary";

const CANVAS_WIDTH = 816;
const CANVAS_HEIGHT = 1056;
const GRID_SIZE = 20;
const HISTORY_MAX = 50;

interface Props {
  onLayersChange: (layers: CanvasLayer[]) => void;
  onSelectionChange: (props: SelectedObjectProps | null) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  zoom: number;
}

function setCustomProp(obj: FabricObject, key: string, value: unknown) {
  (obj as unknown as Record<string, unknown>)[key] = value;
}

function getCustomProp<T>(obj: FabricObject, key: string): T {
  return (obj as unknown as Record<string, unknown>)[key] as T;
}

const FabricCanvas = forwardRef<FabricCanvasHandle, Props>(
  ({ onLayersChange, onSelectionChange, onHistoryChange, zoom }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isSavingRef = useRef(false);
    const showGridRef = useRef(false);
    const gridLinesRef = useRef<Line[]>([]);

    function getLayers(canvas: Canvas): CanvasLayer[] {
      const objs = canvas.getObjects().filter(
        (o) => getCustomProp<boolean>(o, "_isGrid") !== true
      );
      return [...objs].reverse().map((obj) => ({
        id: getCustomProp<string>(obj, "id") ?? "",
        type: obj.type ?? "object",
        name: getCustomProp<string>(obj, "name") ?? obj.type ?? "Object",
        visible: obj.visible ?? true,
        locked: getCustomProp<boolean>(obj, "locked") ?? false,
      }));
    }

    function getSelectionProps(obj: FabricObject): SelectedObjectProps {
      const actualW = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const actualH = (obj.height ?? 0) * (obj.scaleY ?? 1);
      const base: SelectedObjectProps = {
        id: getCustomProp<string>(obj, "id") ?? "",
        type: obj.type ?? "object",
        name: getCustomProp<string>(obj, "name") ?? obj.type ?? "Object",
        left: Math.round(obj.left ?? 0),
        top: Math.round(obj.top ?? 0),
        width: Math.round(actualW),
        height: Math.round(actualH),
        angle: Math.round(obj.angle ?? 0),
        opacity: Math.round((obj.opacity ?? 1) * 100),
        visible: obj.visible ?? true,
        locked: getCustomProp<boolean>(obj, "locked") ?? false,
        fill: typeof obj.fill === "string" ? (obj.fill as string) : undefined,
        stroke: typeof obj.stroke === "string" ? (obj.stroke as string) : undefined,
        strokeWidth: typeof obj.strokeWidth === "number" ? obj.strokeWidth : 1,
      };
      if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
        const tb = obj as Textbox;
        return {
          ...base,
          text: tb.text ?? "",
          fontSize: tb.fontSize ?? 16,
          fontFamily: tb.fontFamily ?? "DM Sans",
          fontWeight: typeof tb.fontWeight === "string" ? tb.fontWeight : "normal",
          fontStyle: tb.fontStyle ?? "normal",
          textAlign: tb.textAlign ?? "left",
          lineHeight: tb.lineHeight ?? 1.3,
          charSpacing: tb.charSpacing ?? 0,
        };
      }
      if (obj.type === "rect") {
        return { ...base, rx: (obj as Rect).rx ?? 0 };
      }
      return base;
    }

    function saveHistory(canvas: Canvas) {
      if (isSavingRef.current) return;
      const state = JSON.stringify(
        canvas.toObject(["id", "name", "locked", "selectable", "evented", "_isGrid"])
      );
      historyRef.current.splice(historyIndexRef.current + 1);
      historyRef.current.push(state);
      if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
      historyIndexRef.current = historyRef.current.length - 1;
      onHistoryChange(historyIndexRef.current > 0, false);
    }

    async function restoreHistory(canvas: Canvas, index: number) {
      const state = historyRef.current[index];
      if (!state) return;
      isSavingRef.current = true;
      await canvas.loadFromJSON(JSON.parse(state));
      canvas.renderAll();
      isSavingRef.current = false;
      onLayersChange(getLayers(canvas));
      onSelectionChange(null);
      onHistoryChange(index > 0, index < historyRef.current.length - 1);
    }

    function drawGrid(canvas: Canvas) {
      gridLinesRef.current.forEach((l) => canvas.remove(l));
      gridLinesRef.current = [];
      if (!showGridRef.current) return;
      const lines: Line[] = [];
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        const l = new Line([x, 0, x, CANVAS_HEIGHT], {
          stroke: "#d0c8e8",
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        setCustomProp(l, "_isGrid", true);
        lines.push(l);
        canvas.add(l);
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        const l = new Line([0, y, CANVAS_WIDTH, y], {
          stroke: "#d0c8e8",
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        setCustomProp(l, "_isGrid", true);
        lines.push(l);
        canvas.add(l);
      }
      gridLinesRef.current = lines;
      lines.forEach((l) => canvas.sendObjectToBack(l));
    }

    function prepareObject(obj: FabricObject, name: string) {
      setCustomProp(obj, "id", nanoid());
      setCustomProp(obj, "name", name);
      setCustomProp(obj, "locked", false);
      return obj;
    }

    useEffect(() => {
      if (!canvasElRef.current) return;
      const canvas = new Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
      });
      fabricRef.current = canvas;

      canvas.on("selection:created", () => {
        const obj = canvas.getActiveObject();
        if (obj) onSelectionChange(getSelectionProps(obj));
      });
      canvas.on("selection:updated", () => {
        const obj = canvas.getActiveObject();
        if (obj) onSelectionChange(getSelectionProps(obj));
      });
      canvas.on("selection:cleared", () => onSelectionChange(null));

      canvas.on("object:modified", () => {
        const obj = canvas.getActiveObject();
        if (obj) onSelectionChange(getSelectionProps(obj));
        onLayersChange(getLayers(canvas));
        saveHistory(canvas);
      });
      canvas.on("object:added", () => {
        onLayersChange(getLayers(canvas));
      });
      canvas.on("object:removed", () => {
        onLayersChange(getLayers(canvas));
      });

      canvas.on("object:moving", (e) => {
        if (!showGridRef.current) return;
        const obj = e.target;
        if (!obj) return;
        obj.set({
          left: Math.round((obj.left ?? 0) / GRID_SIZE) * GRID_SIZE,
          top: Math.round((obj.top ?? 0) / GRID_SIZE) * GRID_SIZE,
        });
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        const active = canvas.getActiveObject();
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            const idx = historyIndexRef.current + 1;
            if (idx < historyRef.current.length) {
              historyIndexRef.current = idx;
              restoreHistory(canvas, idx);
            }
          } else {
            const idx = historyIndexRef.current - 1;
            if (idx >= 0) {
              historyIndexRef.current = idx;
              restoreHistory(canvas, idx);
            }
          }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "d") {
          e.preventDefault();
          if (active) {
            active.clone().then((cl: FabricObject) => {
              cl.set({ left: (cl.left ?? 0) + 20, top: (cl.top ?? 0) + 20 });
              setCustomProp(cl, "id", nanoid());
              setCustomProp(cl, "name", getCustomProp<string>(active, "name") + " copy");
              setCustomProp(cl, "locked", false);
              canvas.add(cl);
              canvas.setActiveObject(cl);
              canvas.renderAll();
              saveHistory(canvas);
            });
          }
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (active && document.activeElement?.tagName !== "INPUT") {
            canvas.remove(active);
            canvas.renderAll();
            saveHistory(canvas);
          }
        }
        const NUDGE = e.shiftKey ? 10 : 1;
        if (active) {
          if (e.key === "ArrowLeft") { e.preventDefault(); active.set({ left: (active.left ?? 0) - NUDGE }); }
          if (e.key === "ArrowRight") { e.preventDefault(); active.set({ left: (active.left ?? 0) + NUDGE }); }
          if (e.key === "ArrowUp") { e.preventDefault(); active.set({ top: (active.top ?? 0) - NUDGE }); }
          if (e.key === "ArrowDown") { e.preventDefault(); active.set({ top: (active.top ?? 0) + NUDGE }); }
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            active.setCoords();
            canvas.renderAll();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      saveHistory(canvas);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.setZoom(zoom);
      canvas.setWidth(CANVAS_WIDTH * zoom);
      canvas.setHeight(CANVAS_HEIGHT * zoom);
    }, [zoom]);

    useImperativeHandle(ref, () => ({
      addTextBlock(text = "Click to edit text") {
        const canvas = fabricRef.current!;
        const tb = new Textbox(text, {
          left: 100,
          top: 120,
          width: 400,
          fontSize: 16,
          fontFamily: "DM Sans",
          fill: "#1a1a1a",
          lineHeight: 1.4,
        });
        prepareObject(tb, "Text Block");
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addShape(type: ShapeType) {
        const canvas = fabricRef.current!;
        const def = SHAPES.find((s) => s.id === type);
        if (!def) return;
        let obj: FabricObject;
        const defaults = {
          left: 200,
          top: 200,
          fill: "#e8e2f5",
          stroke: "#7b6ea4",
          strokeWidth: 1.5,
        };
        if (def.svgPath) {
          obj = new Path(def.svgPath, {
            ...defaults,
            scaleX: def.defaultWidth / 100,
            scaleY: def.defaultHeight / 100,
          });
        } else if (def.fabricType === "rect") {
          obj = new Rect({
            ...defaults,
            width: def.defaultWidth,
            height: def.defaultHeight,
            rx: type === "rounded-rect" ? 12 : 0,
            ry: type === "rounded-rect" ? 12 : 0,
          });
        } else if (def.fabricType === "circle") {
          obj = new Circle({
            ...defaults,
            radius: def.defaultWidth / 2,
            scaleY: def.fabricType === "circle" && def.id === "oval" ? 0.65 : 1,
          });
        } else if (def.fabricType === "triangle") {
          obj = new Triangle({ ...defaults, width: def.defaultWidth, height: def.defaultHeight });
        } else {
          return;
        }
        prepareObject(obj, def.label);
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addAnswerLines(count = 5, label = "") {
        const canvas = fabricRef.current!;
        const lineW = 380;
        const spacing = 32;
        const offsetY = label ? 22 : 0;
        const objs: FabricObject[] = [];
        if (label) {
          const lbl = new Textbox(label, { fontSize: 12, fill: "#555", width: lineW });
          objs.push(lbl);
        }
        for (let i = 0; i < count; i++) {
          const line = new Line([0, offsetY + i * spacing, lineW, offsetY + i * spacing], {
            stroke: "#333",
            strokeWidth: 1,
          });
          objs.push(line);
        }
        const group = new Group(objs, { left: 80, top: 100 });
        prepareObject(group, "Answer Lines");
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addWordBank(words = ["apple", "banana", "cherry", "dog", "elephant"]) {
        const canvas = fabricRef.current!;
        const text = "Word Bank\n" + words.join("   ");
        const tb = new Textbox(text, {
          left: 80,
          top: 100,
          width: 320,
          fontSize: 13,
          fontFamily: "DM Sans",
          fill: "#1a1a1a",
          backgroundColor: "#f5f0ff",
          padding: 10,
        });
        prepareObject(tb, "Word Bank");
        const border = new Rect({
          left: 80,
          top: 100,
          width: 320,
          height: tb.getScaledHeight() + 20,
          fill: "transparent",
          stroke: "#9b8ec4",
          strokeWidth: 1.5,
          strokeDashArray: [6, 3],
          rx: 6,
          ry: 6,
        });
        prepareObject(border, "Word Bank Border");
        canvas.add(border);
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addWriteInBox(label = "Write your answer:") {
        const canvas = fabricRef.current!;
        const box = new Rect({
          left: 80,
          top: 100,
          width: 360,
          height: 120,
          fill: "#fafafa",
          stroke: "#9b8ec4",
          strokeWidth: 1.5,
          rx: 6,
          ry: 6,
        });
        prepareObject(box, "Write-in Box");
        const lbl = new Textbox(label, {
          left: 90,
          top: 108,
          width: 340,
          fontSize: 11,
          fontFamily: "DM Sans",
          fill: "#888",
        });
        prepareObject(lbl, "Write-in Label");
        canvas.add(box);
        canvas.add(lbl);
        canvas.setActiveObject(box);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addTitleBlock(text = "Worksheet Title") {
        const canvas = fabricRef.current!;
        const tb = new Textbox(text, {
          left: 50,
          top: 50,
          width: CANVAS_WIDTH - 100,
          fontSize: 32,
          fontFamily: "Outfit",
          fontWeight: "700",
          fill: "#4a3b89",
          textAlign: "center",
        });
        prepareObject(tb, "Title");
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addSubtitleBlock(text = "Subtitle or Topic") {
        const canvas = fabricRef.current!;
        const tb = new Textbox(text, {
          left: 50,
          top: 110,
          width: CANVAS_WIDTH - 100,
          fontSize: 18,
          fontFamily: "DM Sans",
          fill: "#6b5ea8",
          textAlign: "center",
        });
        prepareObject(tb, "Subtitle");
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addDirectionsBlock(text = "Directions: ") {
        const canvas = fabricRef.current!;
        const bg = new Rect({
          left: 50,
          top: 80,
          width: CANVAS_WIDTH - 100,
          height: 48,
          fill: "#f0ecff",
          stroke: "#c4b8e8",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        });
        prepareObject(bg, "Directions BG");
        const tb = new Textbox(text, {
          left: 62,
          top: 90,
          width: CANVAS_WIDTH - 124,
          fontSize: 13,
          fontFamily: "DM Sans",
          fill: "#333",
        });
        prepareObject(tb, "Directions");
        canvas.add(bg);
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addColorKeyBlock() {
        const canvas = fabricRef.current!;
        const entries = [
          { color: "#ffcccc", label: "1" },
          { color: "#ccffcc", label: "2" },
          { color: "#ccccff", label: "3" },
          { color: "#ffffcc", label: "4" },
        ];
        const objs: FabricObject[] = [];
        entries.forEach((entry, i) => {
          const swatch = new Rect({
            left: 0,
            top: i * 28,
            width: 20,
            height: 20,
            fill: entry.color,
            stroke: "#aaa",
            strokeWidth: 1,
            rx: 2,
            ry: 2,
          });
          objs.push(swatch);
          const lbl = new Textbox(entry.label, {
            left: 28,
            top: i * 28 + 2,
            width: 80,
            fontSize: 12,
            fontFamily: "DM Sans",
            fill: "#333",
          });
          objs.push(lbl);
        });
        const group = new Group(objs, {
          left: 600,
          top: 100,
        });
        prepareObject(group, "Color Key");
        const border = new Rect({
          left: 596,
          top: 96,
          width: group.getScaledWidth() + 24,
          height: group.getScaledHeight() + 24,
          fill: "transparent",
          stroke: "#9b8ec4",
          strokeWidth: 1,
          strokeDashArray: [4, 2],
          rx: 6,
          ry: 6,
        });
        prepareObject(border, "Color Key Border");
        canvas.add(border);
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addNameDateLine() {
        const canvas = fabricRef.current!;
        const objs: FabricObject[] = [
          new Textbox("Name:", { left: 0, top: 0, fontSize: 12, fontFamily: "DM Sans", fill: "#555", width: 50 }),
          new Line([55, 18, 260, 18], { stroke: "#333", strokeWidth: 1 }),
          new Textbox("Date:", { left: 270, top: 0, fontSize: 12, fontFamily: "DM Sans", fill: "#555", width: 50 }),
          new Line([320, 18, 490, 18], { stroke: "#333", strokeWidth: 1 }),
        ];
        const group = new Group(objs, { left: 50, top: 30 });
        prepareObject(group, "Name / Date Line");
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        saveHistory(canvas);
      },

      async addImage(src: string) {
        const canvas = fabricRef.current!;
        const img = await FabricImage.fromURL(src, { crossOrigin: "anonymous" });
        const maxW = 300;
        if ((img.width ?? 0) > maxW) {
          img.scaleToWidth(maxW);
        }
        img.set({ left: 100, top: 100 });
        prepareObject(img, "Image");
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistory(canvas);
      },

      addSvgFromString(svgString: string, name = "SVG Illustration") {
        const canvas = fabricRef.current!;
        loadSVGFromString(svgString).then(({ objects, options }: { objects: (FabricObject | null)[]; options: { width?: number; height?: number } }) => {
          const validObjects = objects.filter((o): o is FabricObject => o !== null);
          const group = new Group(validObjects, {
            left: 80,
            top: 80,
            scaleX: Math.min(1, (CANVAS_WIDTH - 160) / (options.width ?? 500)),
            scaleY: Math.min(1, (CANVAS_HEIGHT - 160) / (options.height ?? 500)),
          });
          prepareObject(group, name);
          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.renderAll();
          saveHistory(canvas);
        });
      },

      undo() {
        const idx = historyIndexRef.current - 1;
        if (idx >= 0) {
          historyIndexRef.current = idx;
          restoreHistory(fabricRef.current!, idx);
        }
      },

      redo() {
        const idx = historyIndexRef.current + 1;
        if (idx < historyRef.current.length) {
          historyIndexRef.current = idx;
          restoreHistory(fabricRef.current!, idx);
        }
      },

      async exportPNG() {
        const canvas = fabricRef.current!;
        const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "worksheet.png";
        a.click();
      },

      setBackground(color: string) {
        const canvas = fabricRef.current!;
        canvas.set({ backgroundColor: color });
        canvas.renderAll();
        saveHistory(canvas);
      },

      toggleGrid() {
        const canvas = fabricRef.current!;
        showGridRef.current = !showGridRef.current;
        drawGrid(canvas);
        canvas.renderAll();
      },

      setZoom(level: number) {
        const canvas = fabricRef.current!;
        canvas.setZoom(level);
        canvas.setWidth(CANVAS_WIDTH * level);
        canvas.setHeight(CANVAS_HEIGHT * level);
      },

      bringForward() {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.bringObjectForward(obj); canvas.renderAll(); saveHistory(canvas); }
      },

      sendBackward() {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.sendObjectBackwards(obj); canvas.renderAll(); saveHistory(canvas); }
      },

      bringToFront() {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.bringObjectToFront(obj); canvas.renderAll(); saveHistory(canvas); }
      },

      sendToBack() {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.sendObjectToBack(obj); canvas.renderAll(); saveHistory(canvas); }
      },

      toggleVisibility(id: string) {
        const canvas = fabricRef.current!;
        const obj = canvas.getObjects().find((o) => getCustomProp<string>(o, "id") === id);
        if (obj) {
          obj.visible = !obj.visible;
          canvas.renderAll();
          onLayersChange(getLayers(canvas));
        }
      },

      toggleLock(id: string) {
        const canvas = fabricRef.current!;
        const obj = canvas.getObjects().find((o) => getCustomProp<string>(o, "id") === id);
        if (obj) {
          const locked = !getCustomProp<boolean>(obj, "locked");
          setCustomProp(obj, "locked", locked);
          obj.set({ selectable: !locked, evented: !locked, hasControls: !locked, hasBorders: !locked });
          canvas.renderAll();
          onLayersChange(getLayers(canvas));
        }
      },

      deleteSelected() {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.remove(obj);
          canvas.renderAll();
          saveHistory(canvas);
        }
      },

      duplicateSelected() {
        const canvas = fabricRef.current!;
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone().then((cl: FabricObject) => {
          cl.set({ left: (cl.left ?? 0) + 20, top: (cl.top ?? 0) + 20 });
          setCustomProp(cl, "id", nanoid());
          setCustomProp(cl, "name", getCustomProp<string>(active, "name") + " copy");
          canvas.add(cl);
          canvas.setActiveObject(cl);
          canvas.renderAll();
          saveHistory(canvas);
        });
      },

      updateSelectedProps(props: Partial<SelectedObjectProps>) {
        const canvas = fabricRef.current!;
        const obj = canvas.getActiveObject();
        if (!obj) return;
        const updates: Record<string, unknown> = {};
        if (props.left !== undefined) updates.left = props.left;
        if (props.top !== undefined) updates.top = props.top;
        if (props.angle !== undefined) updates.angle = props.angle;
        if (props.opacity !== undefined) updates.opacity = (props.opacity ?? 100) / 100;
        if (props.fill !== undefined) updates.fill = props.fill;
        if (props.stroke !== undefined) updates.stroke = props.stroke;
        if (props.strokeWidth !== undefined) updates.strokeWidth = props.strokeWidth;
        if (props.width !== undefined && props.height !== undefined) {
          const baseW = obj.width ?? 1;
          const baseH = obj.height ?? 1;
          updates.scaleX = props.width / baseW;
          updates.scaleY = props.height / baseH;
        }
        if (props.rx !== undefined && obj.type === "rect") {
          updates.rx = props.rx;
          updates.ry = props.rx;
        }
        if (obj.type === "textbox" || obj.type === "i-text") {
          if (props.text !== undefined) updates.text = props.text;
          if (props.fontSize !== undefined) updates.fontSize = props.fontSize;
          if (props.fontFamily !== undefined) updates.fontFamily = props.fontFamily;
          if (props.fontWeight !== undefined) updates.fontWeight = props.fontWeight;
          if (props.fontStyle !== undefined) updates.fontStyle = props.fontStyle;
          if (props.textAlign !== undefined) updates.textAlign = props.textAlign;
          if (props.lineHeight !== undefined) updates.lineHeight = props.lineHeight;
          if (props.charSpacing !== undefined) updates.charSpacing = props.charSpacing;
          if (props.fill !== undefined) updates.fill = props.fill;
        }
        obj.set(updates as Partial<FabricObject>);
        obj.setCoords();
        canvas.renderAll();
        onSelectionChange(getSelectionProps(obj));
      },

      selectById(id: string) {
        const canvas = fabricRef.current!;
        const obj = canvas.getObjects().find((o) => getCustomProp<string>(o, "id") === id);
        if (obj) {
          canvas.setActiveObject(obj);
          canvas.renderAll();
        }
      },

      reorderLayers(fromIndex: number, toIndex: number) {
        const canvas = fabricRef.current!;
        const objects = canvas.getObjects().filter(
          (o) => getCustomProp<boolean>(o, "_isGrid") !== true
        );
        const reversed = [...objects].reverse();
        const obj = reversed[fromIndex];
        if (!obj) return;
        canvas.remove(obj);
        const allObjs = canvas.getObjects();
        const targetObj = reversed[toIndex];
        if (!targetObj) {
          canvas.add(obj);
        } else {
          const targetIdx = allObjs.indexOf(targetObj);
          canvas.insertAt(targetIdx, obj);
        }
        canvas.renderAll();
        onLayersChange(getLayers(canvas));
        saveHistory(canvas);
      },

      alignObjects(direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom") {
        const canvas = fabricRef.current!;
        const active = canvas.getActiveObject();
        if (!active) return;
        if (direction === "left") active.set({ left: 0 });
        if (direction === "center-h") active.set({ left: (CANVAS_WIDTH - active.getScaledWidth()) / 2 });
        if (direction === "right") active.set({ left: CANVAS_WIDTH - active.getScaledWidth() });
        if (direction === "top") active.set({ top: 0 });
        if (direction === "center-v") active.set({ top: (CANVAS_HEIGHT - active.getScaledHeight()) / 2 });
        if (direction === "bottom") active.set({ top: CANVAS_HEIGHT - active.getScaledHeight() });
        active.setCoords();
        canvas.renderAll();
        saveHistory(canvas);
      },
    }));

    return (
      <div className="fabric-canvas-wrapper" style={{ lineHeight: 0 }}>
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

FabricCanvas.displayName = "FabricCanvas";
export default FabricCanvas;
