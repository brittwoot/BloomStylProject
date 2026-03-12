# BloomStyl

## Overview

BloomStyl is an AI-powered educational content transformation platform that converts teacher-provided lesson materials into structured, student-ready worksheets. Teachers can then edit, style, and decorate the worksheet in a built-in design workspace before exporting to PDF.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite (artifacts/bloomstyl)
- **Backend**: Express 5 (artifacts/api-server)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations
- **Database**: PostgreSQL + Drizzle ORM
- **State**: Zustand (useBloomStore)
- **UI**: TailwindCSS + shadcn/ui + Framer Motion
- **PDF Export**: html2canvas + jsPDF (client-side)
- **API Codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **Fonts**: 18+ Google Fonts — DM Sans, Outfit, Poppins, Nunito, Inter, Open Sans, Roboto, Pacifico, Quicksand, Fredoka, Baloo 2, Caveat, Patrick Hand, Gloria Hallelujah, Sacramento, Great Vibes, Bubblegum Sans, Architects Daughter, Lilita One

## Entry Modes

1. **From Document** (`/`) — Paste lesson text or upload PDF/DOCX → AI detects sections → Settings → Preview
2. **From Prompt** (`/prompt`) — Type a natural language description → AI analyzes → suggests 3 activity types with reasoning → Customization panel → Generate worksheet

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | UploadPage | Document upload / paste mode |
| `/detect` | DetectPage | AI section detection |
| `/settings` | SettingsPage | Template settings |
| `/result` | Result | Worksheet editor + export |
| `/prompt` | PromptPage | AI prompt entry (new flow) |
| `/suggest` | ActivitySuggestionPage | AI-recommended type cards with reasons |
| `/types` | WorksheetTypeBrowserPage | Browsable grid of all 30 types |
| `/customize` | CustomizePage | Left-panel settings + right-panel preview |
| `/differentiate` | DifferentiationPanel | Side-by-side differentiated version panel |

## 4-Page Workflow (Document Mode)

1. **Upload** (`/`) — Paste lesson text or upload PDF/DOCX. Language selector (Auto, English, Vietnamese, Spanish, French). "From Prompt" CTA at bottom.
2. **Detect** (`/detect`) — AI analyzes lesson content and returns structured content blocks. Teacher can toggle/reorder blocks.
3. **Settings** (`/settings`) — Configure template type (Reading/Practice/Vocabulary), theme (Clean/Classroom/Fun), and layout options.
4. **Preview & Export** (`/result`) — Full worksheet editor with inline text editing, typography system, styling, clipart, and PDF export.

## Prompt Flow (New — Step-by-Step)

1. **PromptPage** — Teacher types prompt → calls `analyze-prompt` API → shows clarifying question if vague, or navigates to `/suggest`
2. **ActivitySuggestionPage** — 3 AI-recommended worksheet type cards (1 primary + 2 alternatives) with reasons, parsedPromptData chips, "Browse all 30 types" button
3. **WorksheetTypeBrowserPage** — Searchable grid of all 30 types organized by 7 categories with filters, preview rows, grade ranges
4. **CustomizePage** — Left panel: common options (title, grade, orientation, name/date, font, border, color scheme, teacher info) + type-specific options; Right panel: live preview; Bottom: "Create Worksheet" button → calls `customize-generate` API → navigates to `/result`

## Worksheet Type Registry

**30 types across 7 categories** — defined in `artifacts/bloomstyl/src/types/worksheetTypes.ts`:

- 🎨 **Coloring & Visual** (3): Coloring Page, Color by Code, Trace and Color
- ↔️ **Matching & Sorting** (3): Cut and Sort, Draw a Line Matching, Picture Sort
- ✏️ **Writing & Response** (4): Writing Prompt, Sentence Frames, Mini Book, Acrostic Poem
- 🗂️ **Graphic Organizers** (6): Mind Map, Venn Diagram, Story Map, KWL Chart, Sequence Chart, Frayer Model
- 🔢 **Math Activities** (5): Number Bond, Ten Frame, Graph/Data Page, Clock/Time, Measurement
- 🔬 **Science & Social Studies** (4): Label the Diagram, Observation Sheet, Timeline, Map Activity
- 🎮 **Games & Interactive** (5): Bingo Card, Word Search, Crossword, Spinner, Dice/Roll Activity

## API Routes

- `POST /api/worksheet/extract-text` — PDF/DOCX text extraction (multer)
- `POST /api/worksheet/detect` — AI content block detection + safety check
- `POST /api/worksheet/generate` — Full worksheet generation from blocks
- `POST /api/worksheet/generate-layouts` — Generate 3 distinct layout variations from a prompt (legacy)
- `POST /api/worksheet/analyze-prompt` — Analyze teacher prompt, return 3 type suggestions with reasons or clarifying question
- `POST /api/worksheet/customize-generate` — Generate full worksheet JSON from chosen type + options
- `POST /api/worksheet/differentiate` — Generate differentiated versions from anchor + scaffold settings

## Worksheet Editor (Step 4)

### Two-panel layout
- **Left**: Live printable worksheet preview (id="worksheet-paper" for PDF capture)
- **Right**: Collapsible editor sidebar with 5 tabs

### Editor Sidebar Tabs
1. **AI Style tab** — 12 one-click style presets (typography + colors + page style)
2. **Fonts tab** — Global typography: title font + heading style (9 decorative options), body font, heading font, accent color, title/heading colors, line spacing, text size
3. **Text tab** — Per-section font, size, color, bold/italic/underline, alignment, bullet/numbered lists
4. **Style tab** — Per-section background color, border style/color/thickness, rounded corners
5. **Clipart tab** — Browse by category, search, size picker; "Suggested" tab with AI keyword analysis

### PDF Export
- "Export PDF" button opens ExportModal
- Options: Student Sheet / Answer Key Only / Both (2 pages)
- Uses html2canvas to capture #worksheet-paper div, then jsPDF to create letter-size PDF
- High-resolution output (2x scale)

### Clipart System
- 9 categories: school, reading, writing, math, science, animals, weather, holidays, classroom
- 80+ emoji clipart items
- Mock AI keyword suggestions scan worksheet content and map to relevant clipart

## Core State Architecture

```ts
// Per-section styling
type SectionStyle = {
  textStyle: TextStyle;           // font, size, color, bold/italic/underline, align, list
  bgColor: string;
  borderStyle: "none"|"solid"|"dashed"|"dotted";
  borderColor: string;
  borderWidth: number;
  rounded: boolean;
}

// Global page style
type WorksheetPageStyle = { bgColor, titleFont, bodyFont }

// Clipart
type ClipartItem = { id, emoji, label, category, size }

// Store additions
sectionStyles: Record<sectionId, SectionStyle>
sectionClipart: Record<sectionId, ClipartItem[]>
worksheetPageStyle: WorksheetPageStyle
activeSectionId: string | null
```

## Key Files

- `artifacts/bloomstyl/src/store.ts` — Zustand store with full workflow + editor state
- `artifacts/bloomstyl/src/pages/UploadPage.tsx` — Step 1
- `artifacts/bloomstyl/src/pages/DetectPage.tsx` — Step 2
- `artifacts/bloomstyl/src/pages/SettingsPage.tsx` — Step 3
- `artifacts/bloomstyl/src/pages/Result.tsx` — Step 4 with full editor
- `artifacts/bloomstyl/src/components/editor/EditableTextBlock.tsx` — Inline text editor with style support
- `artifacts/bloomstyl/src/components/editor/TextStyleToolbar.tsx` — Font/text controls
- `artifacts/bloomstyl/src/components/editor/SectionStylePanel.tsx` — Section bg/border controls
- `artifacts/bloomstyl/src/components/editor/ClipartPanel.tsx` — Clipart browser + AI suggestions
- `artifacts/bloomstyl/src/components/editor/EditorSidebar.tsx` — Main right sidebar
- `artifacts/bloomstyl/src/components/editor/clipartData.ts` — Clipart data + keyword map
- `artifacts/api-server/src/routes/worksheet/detect.ts` — AI content detection
- `artifacts/api-server/src/routes/worksheet/generate.ts` — Worksheet generation
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth

## Canvas-First Design System (New — Primary Editor)

A Canva-like free-form canvas editor at `/canvas`. Every element is draggable, resizable, and layerable on an 8.5×11 paper canvas.

### Canvas Engine (Fabric.js v6)
- 816×1056px canvas (8.5×11 at 96dpi)
- Free-form drag, resize, rotate for all elements
- Undo/redo stack (50 steps)
- Keyboard shortcuts: Delete, arrow keys, Ctrl+Z/Y, Ctrl+D
- Snap-to-grid (20px) with toggle
- PNG export (2x resolution)

### Element Types
1. Text Block (Textbox) — font, size, color, align, weight, line-height
2. Shapes — 30+ shapes across 4 categories (Basic, Educational, Frames, Decorative)
3. Images — upload PNG/JPG/SVG/WebP
4. Smart Content Blocks — Answer Lines, Word Bank, Write-in Box, Directions, Name/Date Line, Color Key, Title, Subtitle

### Left Panel (6 tabs)
- **Generate** — Link to prompt flow + Claude-powered SVG coloring page generator
- **Content** — All smart content blocks (click to add)
- **Images** — Upload and place images
- **Shapes** — 30+ shapes in 4 categories
- **Text** — 7 typography presets (K-2, 3-5, 6+)
- **Background** — Solid color picker + snap grid toggle

### Right Panel
- Context-sensitive properties: position, size, rotation, opacity
- Text controls: font, size, weight, style, alignment, color, line-height
- Shape controls: fill color, stroke color/width, corner radius
- Layers panel: all objects listed, click to select, hide/show, lock/unlock

### AI Suggestions Chip (non-blocking)
- Floating chip shows count of active suggestions
- Detects: missing title, missing directions, missing name/date line
- "Fix It" applies change and adds to undo stack

### New API Routes
- `POST /api/worksheet/generate-svg` — Claude `claude-sonnet-4-6` generates SVG coloring page illustrations with numbered regions

### Key Files
- `artifacts/bloomstyl/src/pages/CanvasEditor.tsx` — Main canvas editor page
- `artifacts/bloomstyl/src/components/canvas/FabricCanvas.tsx` — Fabric.js wrapper (core engine)
- `artifacts/bloomstyl/src/components/canvas/LeftPanel.tsx` — 6-tab left panel
- `artifacts/bloomstyl/src/components/canvas/RightPanel.tsx` — Properties + Layers panel
- `artifacts/bloomstyl/src/components/canvas/CanvasToolbar.tsx` — Top toolbar
- `artifacts/bloomstyl/src/components/canvas/AISuggestionsChip.tsx` — Non-blocking suggestions
- `artifacts/bloomstyl/src/components/canvas/shapeLibrary.ts` — 30+ shape SVG paths
- `artifacts/bloomstyl/src/components/canvas/canvasTypes.ts` — Shared TypeScript types
- `artifacts/api-server/src/routes/worksheet/generate-svg.ts` — Claude SVG generation

## Differentiation & Scaffolding System

A full differentiated worksheet system that lets teachers generate 2–5 leveled versions of any worksheet from a single source, with UDL-based scaffolding controls.

### Route
| Route | Page | Description |
|-------|------|-------------|
| `/differentiate` | DifferentiationPanel | Full-screen panel showing all versions as side-by-side cards |

### Entry Points
1. **PromptPage** (`/prompt`) — "Create versions for multiple levels?" toggle with level-chip selector (grade, readiness, ELL, learning profile)
2. **Result Page** (`/result`) — "Differentiate This" button loads current worksheet as anchor
3. **WorksheetTypeBrowserPage** (`/types`) — "Create Differentiated Set" button

### Three-Column Panel Layout
- **Left**: Global settings (same title/theme/layout, version indicator, print mode) + Templates tab
- **Center**: Horizontal-scroll version cards with thumbnails, level labels, AI change summaries, and per-card actions (Edit/Duplicate/Delete/Set as Anchor)
- **Right**: Scaffold Settings panel for selected version

### Scaffold Settings (per version)
Reading level (Pre-K→12th), sentence length, vocabulary level, text reduction (25–100%), image support, word bank, sentence frames, example answers, question type, Bloom's taxonomy depth, question count with anchor-sync toggle, answer space, ELL language pair + bilingual mode, dyslexia-friendly mode, reduced content mode.

### AI Differentiation Engine
- `POST /api/worksheet/differentiate` — accepts anchor content + array of scaffold settings, makes parallel AI calls (gpt-5.2), returns adapted content + 2–3 bullet change summary per version
- Uses UDL/special-ed teacher persona in system prompt

### 4 Built-in Templates
- **Grade Band Trio** — Below/On/Above grade level
- **ELL Support Set** — Beginning/Intermediate/Advanced ELL
- **Mixed Readiness** — Approaching/On Grade/Above
- **Dyslexia + On Grade** — Dyslexia-friendly + standard

### Export
- Single PDF with all versions concatenated
- Class-set print mode (specify copies per level)
- Optional teacher summary sheet listing each version's level and settings

### Anchor Sync
- Detects anchor content changes, shows "Sync available" badge
- Options: re-sync from anchor (re-runs AI) or keep override

### Key Files
- `artifacts/bloomstyl/src/types/differentiationTypes.ts` — All types and constants
- `artifacts/bloomstyl/src/stores/differentiationStore.ts` — Zustand store
- `artifacts/bloomstyl/src/pages/DifferentiationPanel.tsx` — Main panel page
- `artifacts/bloomstyl/src/components/differentiation/` — VersionCard, ScaffoldSettingsPanel, GlobalSettingsPanel, DiffTemplatePicker, DiffExportModal, LevelSelector
- `artifacts/api-server/src/routes/worksheet/differentiate.ts` — API endpoint

## What's Needed to Persist to Backend

1. Add `editor_state` column to worksheets table (JSON) storing sectionStyles + sectionClipart + worksheetPageStyle
2. Call a `PATCH /worksheet/:id/editor-state` endpoint on every edit (debounced)
3. Load editor state from API when opening an existing worksheet
