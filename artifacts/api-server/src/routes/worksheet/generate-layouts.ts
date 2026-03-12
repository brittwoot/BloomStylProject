import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "BAD_REQUEST", message: "prompt is required" });
      return;
    }

    const systemPrompt = `You are an expert elementary school worksheet designer.
A teacher has typed a prompt describing the worksheet they want.
Generate 3 DISTINCT worksheet layout variations based on the prompt.

## IMPORTANT: Detect the worksheet type from the prompt

Analyze the teacher's prompt and detect the worksheet_category:
- "sight_word" — if prompt mentions a specific word to practice, sight words, spelling, phonics for a word
- "coloring" — if prompt mentions coloring, color by sound/number/word/rhyme
- "tracing" — if prompt mentions tracing, handwriting, letter formation
- "vocabulary" — if prompt is about vocabulary, definitions, word meanings
- "reading_comprehension" — if prompt is about a reading passage, story, or comprehension
- "math" — if prompt mentions numbers, addition, subtraction, multiplication, math facts
- "general" — everything else (grammar, science, social studies, etc.)

## Section types and their JSON shape

Use these section types based on the worksheet_category:

### For sight_word worksheets, use these sections:
\`\`\`
{ "type": "word_practice", "targetWord": "the word", "activities": ["read", "color", "write"] }
{ "type": "word_sight_row", "targetWord": "the word" }   ← renders word search + letter connect side by side
{ "type": "fill_blanks", "targetWord": "the word", "fillPatterns": ["pre_ty", "prett_", "_retty"], "instructions": "Fill in the missing letters." }
{ "type": "sentence_practice", "targetWord": "the word", "sentenceStarter": "A sentence using the word but stopping before it", "title": "Write the word in a sentence." }
\`\`\`
Generate fillPatterns yourself by removing different letters from the word (replace with _).

### For coloring worksheets, use these sections:
\`\`\`
{ "type": "directions", "instructions": "Color the pictures using the color key." }
{ "type": "coloring_activity", "instructions": "Color each picture according to the color key below.", "colorKey": [{"word": "cat", "color": "#FFD700"}, {"word": "dog", "color": "#87CEEB"}] }
\`\`\`

### For tracing worksheets, use these sections:
\`\`\`
{ "type": "tracing", "targetWord": "the word or letter", "instructions": "Trace and write the word.", "lineCount": 5 }
\`\`\`

### For vocabulary worksheets, use these sections:
\`\`\`
{ "type": "vocabulary", "title": "Vocabulary", "vocabulary": [{"term": "word", "definition": "meaning", "example": "sentence"}] }
{ "type": "questions", "title": "Practice", "questions": [...] }
\`\`\`

### For reading_comprehension worksheets:
\`\`\`
{ "type": "passage", "title": "Title", "passage": "full reading passage text" }
{ "type": "questions", "title": "Questions", "questions": [...] }
\`\`\`

### For math worksheets:
\`\`\`
{ "type": "directions", "instructions": "Solve the problems below." }
{ "type": "questions", "title": "Problems", "questions": [...math problems...] }
\`\`\`

### Questions section structure:
\`\`\`
{ "type": "questions", "title": "Section Title", "questions": [
  { "id": "q1", "question_type": "short_answer", "prompt": "Question text?", "lines": 2 },
  { "id": "q2", "question_type": "multiple_choice", "prompt": "Question text?", "options": ["A. option", "B. option", "C. option", "D. option"], "answer": "A" },
  { "id": "q3", "question_type": "fill_in_blank", "prompt": "The ___ is blue.", "answer": "sky" }
]}
\`\`\`

## Required JSON response structure

Return ONLY this exact JSON shape:

{
  "parsedPrompt": {
    "gradeLevel": "detected grade level (K, 1, 2, 3, 4, 5, 6, or General)",
    "activityType": "exact activity type",
    "worksheet_category": "one of: sight_word|coloring|tracing|vocabulary|reading_comprehension|math|general",
    "skillFocus": "what skill this practices",
    "topic": "main topic",
    "targetWord": "the specific target word if sight_word/tracing worksheet, otherwise null"
  },
  "variations": [
    {
      "id": "variation_1",
      "label": "Short name (2-3 words)",
      "layoutStyle": "one of: stacked|grid|organizer|creative",
      "description": "One sentence describing this layout's approach",
      "accentColor": "#hexcolor (bright, kid-friendly)",
      "decorativeStyle": "one of: clean|playful|cursive|bold",
      "worksheet": {
        "worksheet_id": "generate-a-uuid",
        "title": "Kid-friendly worksheet title",
        "subject": "subject area",
        "gradeLevel": "grade level",
        "language": "English",
        "template_type": "practice",
        "theme": "clean",
        "settings": {
          "templateType": "practice",
          "theme": "clean",
          "includeName": true,
          "includeDate": true,
          "generateAnswerKey": false
        },
        "sections": [ ... ]
      }
    },
    { "id": "variation_2", ... },
    { "id": "variation_3", ... }
  ]
}

Rules:
- Each variation must have genuinely different sections or emphasis (not just relabeled)
- Variation 1: Standard/classic layout for the activity
- Variation 2: More visual, structured, or grid-based
- Variation 3: More playful, creative, or themed
- For sight_word prompts: all 3 variations MUST use word_practice and fill_blanks sections with the detected targetWord
- Generate real fill patterns (e.g. for "pretty": ["pre_ty", "prett_", "_retty"])
- Make worksheet titles creative and encouraging
- Return ONLY valid JSON with no extra text`;

    const userPrompt = `Teacher prompt: "${prompt.trim()}"

Analyze the prompt, detect the worksheet type, and generate 3 distinct worksheet layout variations. Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 7000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      res.status(500).json({ error: "AI_ERROR", message: "No response from AI" });
      return;
    }

    const result = JSON.parse(rawContent);

    // Ensure each variation has a proper worksheet_id
    if (Array.isArray(result.variations)) {
      result.variations.forEach((v: any) => {
        if (v.worksheet) {
          v.worksheet.worksheet_id = v.worksheet.worksheet_id || randomUUID();
        }
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Layout generation error:", err);
    res.status(500).json({ error: "GENERATION_FAILED", message: "Failed to generate layouts" });
  }
});

export default router;
