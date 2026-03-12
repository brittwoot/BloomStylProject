import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateWorksheetBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = GenerateWorksheetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Invalid request body" });
      return;
    }

    const { blocks, settings, lessonText, gradeLevel } = parsed.data;

    // Build the content summary from selected blocks
    const selectedBlocks = (blocks || []).filter((b: any) => b.is_selected);
    const contentSummary = selectedBlocks.length > 0
      ? selectedBlocks.map((b: any) => `[${b.type.toUpperCase()}]: ${b.text}`).join("\n\n")
      : (lessonText || "");

    if (!contentSummary.trim()) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No content provided" });
      return;
    }

    const templateDescriptions: Record<string, string> = {
      reading: "a reading comprehension worksheet with a passage followed by comprehension questions",
      practice: "a practice worksheet with varied question types to reinforce key concepts",
      vocabulary: "a vocabulary-focused worksheet with definitions, word usage, and vocabulary exercises",
    };

    const templateType = settings?.templateType || "reading";
    const theme = settings?.theme || "clean";

    const systemPrompt = `You are an expert educational worksheet designer creating ${templateDescriptions[templateType] || "a worksheet"}.

Return a JSON worksheet with this exact structure:
{
  "worksheet_id": "uuid",
  "title": "worksheet title",
  "subject": "subject area inferred from content",
  "gradeLevel": "inferred or provided grade level",
  "language": "English",
  "template_type": "${templateType}",
  "theme": "${theme}",
  "settings": {
    "templateType": "${templateType}",
    "theme": "${theme}",
    "includeName": ${settings?.includeName ?? true},
    "includeDate": ${settings?.includeDate ?? true},
    "generateAnswerKey": ${settings?.generateAnswerKey ?? false}
  },
  "sections": [
    {
      "id": "section_1",
      "type": "passage|questions|vocabulary|directions|activity",
      "title": "section heading",
      "instructions": "student instructions",
      "passage": "text for passage sections only",
      "questions": [
        {
          "id": "q1",
          "text": "question text",
          "question_type": "multiple_choice|short_answer|true_false|fill_in_blank|essay",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "answer": "correct answer (only if generateAnswerKey is true)",
          "points": 1,
          "order": 1,
          "lines": 3
        }
      ],
      "vocabulary": [],
      "order": 1,
      "points": 10
    }
  ],
  "answer_key": {}
}

Rules:
- Preserve the teacher's original text exactly — do not paraphrase or rewrite unless converting to a question
- Use content from the provided blocks as the primary source
- Create 2–4 sections appropriate for the template type
- For reading worksheets: include a passage section then a questions section
- For vocabulary worksheets: include vocabulary entries with word + definition + order
- Multiple choice questions must have exactly 4 options labeled "A. ...", "B. ...", "C. ...", "D. ..."
- Short answer questions should include "lines": 3 (writeable space)
- Essay questions should include "lines": 8
- Fill in blank questions use ________ in the text
- If generateAnswerKey is true, include the correct answer in each question and populate answer_key
- Keep language and difficulty appropriate for the grade level
- Return ONLY valid JSON`;

    const userPrompt = `Create a worksheet from this content:

Grade Level: ${gradeLevel || "not specified"}
Template: ${templateType}
Theme: ${theme}

Content:
${contentSummary}

Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
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

    const worksheet = JSON.parse(rawContent);
    worksheet.worksheet_id = worksheet.worksheet_id || randomUUID();

    res.json(worksheet);
  } catch (err) {
    console.error("Worksheet generation error:", err);
    res.status(500).json({ error: "GENERATION_FAILED", message: "Failed to generate worksheet" });
  }
});

export default router;
