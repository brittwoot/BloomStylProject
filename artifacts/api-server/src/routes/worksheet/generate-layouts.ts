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

Each variation must have a different structural layout AND visual style:
- Variation 1: The most straightforward layout for the activity type
- Variation 2: A more visually structured or grid-based layout
- Variation 3: A more creative or themed layout

Return a JSON object with this exact structure:
{
  "parsedPrompt": {
    "gradeLevel": "detected grade level or 'General'",
    "activityType": "type of worksheet activity",
    "skillFocus": "what skill this practices",
    "topic": "main topic or subject"
  },
  "variations": [
    {
      "id": "variation_1",
      "label": "Short variation name (2-3 words)",
      "layoutStyle": "one of: stacked|grid|organizer|creative",
      "description": "One sentence describing this layout's approach",
      "accentColor": "#hexcolor",
      "decorativeStyle": "one of: clean|playful|cursive|bold",
      "worksheet": {
        "worksheet_id": "uuid",
        "title": "worksheet title",
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
        "sections": [
          {
            "id": "section_1",
            "type": "directions|passage|questions|vocabulary|activity",
            "title": "Section Title",
            "instructions": "Student instructions",
            "questions": [],
            "vocabulary": [],
            "order": 1
          }
        ],
        "answer_key": {}
      }
    }
  ]
}

Rules:
- Each variation must have genuinely different sections, arrangements, and content emphasis
- Create 2-4 sections per worksheet
- For K-2 worksheets: use larger spacing, simpler language, bigger answer areas
- For 3-6 worksheets: more structured with questions and directions
- Include real content appropriate to the prompt (questions, vocabulary, activities)
- For questions sections, include 3-5 actual questions with question_type: "short_answer", "multiple_choice", or "fill_in_blank"
- Multiple choice questions must have 4 options labeled "A. ...", "B. ...", "C. ...", "D. ..."
- Short answer questions should include "lines": 3
- Make worksheet titles creative and kid-friendly
- Accent colors should be bright and appropriate for the grade level
- Return ONLY valid JSON`;

    const userPrompt = `Teacher prompt: "${prompt.trim()}"

Generate 3 distinct worksheet layout variations for this prompt. Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 6000,
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
