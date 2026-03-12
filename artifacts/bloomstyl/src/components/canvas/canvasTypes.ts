export interface CanvasLayer {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface SelectedObjectProps {
  id: string;
  type: string;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
}

export type ShapeType =
  | 'rect' | 'rounded-rect' | 'circle' | 'oval' | 'triangle'
  | 'diamond' | 'pentagon' | 'hexagon' | 'octagon'
  | 'star-4' | 'star-5' | 'star-6' | 'star-8'
  | 'heart' | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down'
  | 'arrow-double' | 'cross' | 'cloud' | 'speech-bubble' | 'thought-bubble'
  | 'starburst' | 'lightning' | 'moon' | 'leaf' | 'flower'
  | 'banner' | 'sticky-note' | 'label-tag'
  | 'polaroid' | 'chalkboard';

export type ContentBlockType =
  | 'answer-lines' | 'word-bank' | 'directions' | 'vocabulary'
  | 'name-date' | 'color-key' | 'title' | 'subtitle' | 'custom-text'
  | 'write-in-box';

export type LeftPanelTab = 'generate' | 'content' | 'images' | 'shapes' | 'text' | 'background';

export interface ShapeDefinition {
  id: ShapeType;
  label: string;
  category: 'basic' | 'educational' | 'frames' | 'decorative' | 'smart';
  svgPath?: string;
  fabricType?: 'rect' | 'circle' | 'triangle';
  defaultWidth: number;
  defaultHeight: number;
}

export interface ContentBlockDefinition {
  id: ContentBlockType;
  label: string;
  icon: string;
  description: string;
}

export interface FabricCanvasHandle {
  addTextBlock(text?: string): void;
  addShape(type: ShapeType): void;
  addAnswerLines(count?: number, label?: string): void;
  addWordBank(words?: string[]): void;
  addWriteInBox(label?: string): void;
  addTitleBlock(text?: string): void;
  addSubtitleBlock(text?: string): void;
  addDirectionsBlock(text?: string): void;
  addColorKeyBlock(): void;
  addNameDateLine(): void;
  addImage(src: string): Promise<void>;
  addSvgFromString(svgString: string, name?: string): void;
  undo(): void;
  redo(): void;
  exportPNG(): Promise<void>;
  setBackground(color: string): void;
  toggleGrid(): void;
  setZoom(level: number): void;
  bringForward(): void;
  sendBackward(): void;
  bringToFront(): void;
  sendToBack(): void;
  toggleVisibility(id: string): void;
  toggleLock(id: string): void;
  deleteSelected(): void;
  duplicateSelected(): void;
  updateSelectedProps(props: Partial<SelectedObjectProps>): void;
  selectById(id: string): void;
  reorderLayers(fromIndex: number, toIndex: number): void;
  alignObjects(direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void;
}
