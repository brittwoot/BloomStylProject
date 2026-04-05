# BloomStyl Cursor Rules

## Core working style
- Always explain the plan before making code changes.
- Prefer the smallest safe change.
- Do not refactor unrelated files.
- Do not redesign UI unless explicitly asked.
- Keep changes scoped to the requested problem only.

## Product priorities
- BloomStyl must feel teacher-friendly, classroom-ready, and visually clear.
- Teacher trust matters: previews must match generated output.
- Student response areas must stay clean and usable.
- Directions should be separate from student writing spaces.
- Generated worksheets should not contain misleading labels or fake functionality.

## Engineering priorities
- Keep generation logic, editor logic, and UI logic separate.
- Do not invent placeholder controls that do not work.
- Prefer deterministic fixes over vague AI-generated UI copy.
- When fixing preview cards, derive metadata from the real generated worksheet structure.
- When fixing editor behavior, ensure controls are wired to real state.

## Cursor behavior rules
- If investigating, do not make code changes yet.
- If changing code, list exact files to modify first.
- Preserve current working flow unless explicitly asked to redesign it.
- Avoid broad rewrites.
- Avoid changing multiple systems at once.
- If uncertain, inspect first and explain findings before applying changes.

## BloomStyl-specific product rules
- Different worksheet versions should differ by structure/style, not just wording.
- Differentiation should control challenge/support, not fake “different versions.”
- Student-facing boxes should contain blank space or minimal prompts, not completed explanations.
- Writing space should be realistic for actual student use.
- Titles, descriptions, and Includes on version cards must match the actual worksheet generated.
- The editor should prioritize usability over decorative complexity.

## Current editor direction
- Main editing workflow remains the Result editor.
- CanvasEditor is not the main editor unless explicitly planned.
- AI Style is low priority unless it produces meaningful layout/style changes.
- Fonts, Layout, Media, and Differentiate are the preferred long-term editor categories.