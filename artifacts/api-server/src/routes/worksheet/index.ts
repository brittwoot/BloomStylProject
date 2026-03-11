import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateWorksheetBody } from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf-8");
}

router.post("/extract-text", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No file uploaded" });
      return;
    }
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    res.json({ text: text.trim() });
  } catch (err) {
    console.error("Text extraction error:", err);
    res.status(500).json({ error: "EXTRACTION_FAILED", message: "Failed to extract text from file" });
  }
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const parsed = GenerateWorksheetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Invalid request body" });
      return;
    }

    const { lessonText, gradeLevel, worksheetType } = parsed.data;

    const systemPrompt = `You are an expert educational worksheet designer. Your job is to convert lesson content into well-structured, pedagogically sound worksheets for teachers to use in classrooms.

Create a JSON worksheet with the following structure:
{
  "title": "worksheet title",
  "subject": "subject area",
  "gradeLevel": "grade level",
  "sections": [
    {
      "type": "one of: multiple_choice | short_answer | fill_in_blank | true_false | matching | essay",
      "title": "section title",
      "instructions": "instructions for students",
      "points": number,
      "questions": [
        {
          "number": 1,
          "text": "question text",
          "options": ["A. option", "B. option", ...],  // only for multiple_choice
          "lines": 3  // only for short_answer and essay
        }
      ]
    }
  ]
}

Guidelines:
- Create 2-4 sections with varied question types
- Multiple choice: 4 options labeled A, B, C, D
- Short answer: 2-4 lines
- Fill in blank: use ________ in the question text
- True/false: "True or False:" prefix
- Total 10-20 questions spread across sections
- Match the difficulty to the specified grade level
- Make questions clear, educational, and directly relevant to the lesson content
- Do NOT include answer keys in the response`;

    const userPrompt = `Convert this lesson content into a worksheet.
Grade Level: ${gradeLevel || "not specified"}
Worksheet Type: ${worksheetType || "mixed"}

Lesson Content:
${lessonText}

Return ONLY valid JSON, no markdown, no explanation.`;

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
    res.json(worksheet);
  } catch (err) {
    console.error("Worksheet generation error:", err);
    res.status(500).json({ error: "GENERATION_FAILED", message: "Failed to generate worksheet" });
  }
});

export default router;
