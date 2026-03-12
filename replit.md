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
- **API Codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **Fonts**: DM Sans, Outfit, Poppins, Nunito, Inter, Open Sans, Roboto, Pacifico (Google Fonts)

## 4-Page Workflow

1. **Upload** (`/`) — Paste lesson text or upload PDF/DOCX. Language selector (Auto, English, Vietnamese, Spanish, French).
2. **Detect** (`/detect`) — AI analyzes lesson content and returns structured content blocks. Teacher can toggle/reorder blocks.
3. **Settings** (`/settings`) — Configure template type (Reading/Practice/Vocabulary), theme (Clean/Classroom/Fun), and layout options.
4. **Preview & Export** (`/result`) — Full worksheet editor with inline text editing, styling, clipart, and PDF export.

## Worksheet Editor (Step 4)

### Two-panel layout
- **Left**: Live printable worksheet preview
- **Right**: Collapsible editor sidebar with 3 tabs

### Editor Sidebar Tabs
1. **Text tab** — Font family (8 options), size, color, bold/italic/underline, alignment, bullet/numbered lists
2. **Style tab** — Page background color, section background color, border style/color/thickness, rounded corners
3. **Clipart tab** — Browse by category, search, size picker; "Suggested" tab with AI keyword analysis

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

## What's Needed to Persist to Backend

1. Add `editor_state` column to worksheets table (JSON) storing sectionStyles + sectionClipart + worksheetPageStyle
2. Call a `PATCH /worksheet/:id/editor-state` endpoint on every edit (debounced)
3. Load editor state from API when opening an existing worksheet
