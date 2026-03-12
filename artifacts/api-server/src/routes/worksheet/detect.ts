import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { DetectContentBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SAFETY_KEYWORDS = [
  "sexual content", "explicit", "pornograph",
  "graphic violence", "self-harm", "suicide",
  "hate speech", "racial slur",
  "drug instruction", "bomb", "weapon",
];

function runSafetyCheck(text: string): { passed: boolean; flags: string[] } {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  for (const kw of SAFETY_KEYWORDS) {
    if (lower.includes(kw)) flags.push(kw);
  }
  return { passed: flags.length === 0, flags };
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = DetectContentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Invalid request body" });
      return;
    }

    const { lessonText, language } = parsed.data;

    const safety = runSafetyCheck(lessonText);

    const systemPrompt = `You are an expert educational content analyzer. Your job is to read teacher-provided lesson material and identify distinct instructional sections, then return structured content blocks.

For each distinct section you find, return a block with this structure:
{
  "id": "block_N",
  "type": "one of: title|directions|passage|questions|vocabulary|teacher_notes|activity|objective|table|extra",
  "page": 1,
  "label": "human-readable label",
  "text": "the actual content text",
  "is_selected": true,
  "order": N
}

Block type rules:
- title: document title or heading
- directions: instructions for students
- passage: reading text, story, or article
- questions: a question or set of questions
- vocabulary: word lists or definitions
- teacher_notes: notes marked as teacher-only
- activity: hands-on activity instructions
- objective: learning objectives
- table: tabular data
- extra: other supplemental content

Return JSON with this exact shape:
{
  "blocks": [...],
  "detectedLanguage": "English",
  "safetyPassed": true,
  "safetyFlags": []
}

Important:
- Split content into logical, atomic blocks (one concept per block)
- Preserve the teacher's original wording exactly
- Questions should each be their own block or grouped if sequential
- Keep teacher_notes separate from student-facing content
- Return at minimum 2 and at maximum 20 blocks`;

    const userPrompt = `Analyze this lesson content and return structured content blocks.
Language preference: ${language || "Auto Detect"}

Content:
${lessonText}

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

    const result = JSON.parse(rawContent);

    // Override safety with our own check if content was unsafe
    if (!safety.passed) {
      result.safetyPassed = false;
      result.safetyFlags = [...(result.safetyFlags || []), ...safety.flags];
    }

    res.json(result);
  } catch (err) {
    console.error("Content detection error:", err);
    res.status(500).json({ error: "DETECTION_FAILED", message: "Failed to detect content" });
  }
});

export default router;
