# BloomStyl

## Overview

BloomStyl is an AI-powered educational content transformation platform that converts teacher-provided lesson materials into structured, student-ready worksheets.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite (artifacts/bloomstyl)
- **Backend**: Express 5 (artifacts/api-server)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations
- **Database**: PostgreSQL + Drizzle ORM
- **State**: Zustand (useBloomStore)
- **UI**: TailwindCSS + shadcn/ui + Framer Motion
- **API Codegen**: Orval (from OpenAPI spec in lib/api-spec)

## 4-Page Workflow

1. **Upload** (`/`) — Paste lesson text or upload PDF/DOCX. Language selector (Auto, English, Vietnamese, Spanish, French).
2. **Detect** (`/detect`) — AI analyzes lesson content and returns structured content blocks (title, passage, directions, questions, vocabulary, etc.). Teacher can toggle/reorder blocks.
3. **Settings** (`/settings`) — Configure template type (Reading/Practice/Vocabulary), theme (Clean/Classroom/Fun), and layout options (name line, date line, answer key).
4. **Preview & Export** (`/result`) — Formatted worksheet with inline text editing, section reordering, and print/PDF export.

## Core Concepts

### Content Block Architecture
Every document is decomposed into blocks:
```ts
{ id, type, page, label, text, is_selected, order }
```
Types: title | directions | passage | questions | vocabulary | teacher_notes | activity | objective | table | extra

### Teacher Control Principle
- AI detects and suggests; teachers decide what to include
- All AI-generated content is labeled
- Inline editing of every text field on the preview page
- Content safety check runs on every upload

## API Endpoints

- `POST /api/worksheet/extract-text` — Upload PDF/DOCX, returns extracted text
- `POST /api/worksheet/detect` — AI detects content blocks from lesson text
- `POST /api/worksheet/generate` — Generate formatted worksheet from selected blocks + settings

## Key Files

- `artifacts/bloomstyl/src/store.ts` — Zustand store (useBloomStore) with full workflow state
- `artifacts/bloomstyl/src/pages/UploadPage.tsx` — Step 1
- `artifacts/bloomstyl/src/pages/DetectPage.tsx` — Step 2
- `artifacts/bloomstyl/src/pages/SettingsPage.tsx` — Step 3
- `artifacts/bloomstyl/src/pages/Result.tsx` — Step 4 with inline editing
- `artifacts/api-server/src/routes/worksheet/detect.ts` — AI content detection route
- `artifacts/api-server/src/routes/worksheet/generate.ts` — Worksheet generation route
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth

## Structure

```
artifacts/
  bloomstyl/          # React + Vite frontend
  api-server/         # Express backend
lib/
  api-spec/           # OpenAPI spec + Orval codegen config
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod validation schemas
  integrations-openai-ai-server/  # OpenAI client helpers
```
