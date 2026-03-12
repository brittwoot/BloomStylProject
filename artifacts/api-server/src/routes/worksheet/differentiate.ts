import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { anchorContent, versions, globalSettings } = req.body;

    if (!anchorContent || !Array.isArray(versions) || versions.length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "anchorContent and versions array required" });
      return;
    }

    if (versions.length > 5) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Maximum 5 versions allowed" });
      return;
    }

    for (const v of versions) {
      if (!v.versionId || !v.label || !v.scaffoldSettings) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Each version must have versionId, label, and scaffoldSettings" });
        return;
      }
    }

    const anchorJSON = JSON.stringify(anchorContent, null, 2);

    const results = await Promise.allSettled(
      versions.map(async (version: any) => {
        const { versionId, label, scaffoldSettings } = version;

        const systemPrompt = `You are an expert teacher specializing in Universal Design for Learning (UDL) and special education differentiation. You adapt worksheets for different learner needs while preserving the core learning objectives, topic, and visual structure.

Given an anchor worksheet (JSON) and a set of scaffold settings, produce an adapted version. Follow these rules precisely:

SCAFFOLD SETTINGS TO APPLY:
- Reading Level: ${scaffoldSettings.readingLevel} — adjust all text complexity to this level
- Sentence Length: ${scaffoldSettings.sentenceLength} — ${scaffoldSettings.sentenceLength === "short" ? "use simple, short sentences (5-10 words)" : scaffoldSettings.sentenceLength === "medium" ? "use moderate sentences (10-20 words)" : "use complex, compound sentences"}
- Vocabulary Level: ${scaffoldSettings.vocabularyLevel} — ${scaffoldSettings.vocabularyLevel === "simplified" ? "replace complex words with simple alternatives" : scaffoldSettings.vocabularyLevel === "advanced" ? "use challenging vocabulary with context clues" : "maintain grade-appropriate vocabulary"}
- Text Reduction: ${scaffoldSettings.textReduction}% — ${scaffoldSettings.textReduction < 100 ? `reduce content to approximately ${scaffoldSettings.textReduction}% of original length` : "keep full content"}
- Image Support: ${scaffoldSettings.imageSupport} — ${scaffoldSettings.imageSupport === "heavy" ? "add [IMAGE PLACEHOLDER] markers for visual support throughout" : scaffoldSettings.imageSupport === "some" ? "add occasional [IMAGE PLACEHOLDER] markers" : "no additional image support"}
- Word Bank: ${scaffoldSettings.wordBank} — ${scaffoldSettings.wordBank !== "none" ? `include a word bank section with ${scaffoldSettings.wordBank === "full" ? "all key terms" : "select key terms"}` : "no word bank"}
- Sentence Frames: ${scaffoldSettings.sentenceFrames} — ${scaffoldSettings.sentenceFrames !== "none" ? `include sentence frames/starters ${scaffoldSettings.sentenceFrames === "full" ? "for all questions" : "for some questions"}` : "no sentence frames"}
- Example Answers: ${scaffoldSettings.exampleAnswers} — ${scaffoldSettings.exampleAnswers !== "none" ? `provide example answers ${scaffoldSettings.exampleAnswers === "all" ? "for all items" : "for the first item only"}` : "no example answers"}
- Question Type: ${scaffoldSettings.questionType} — ${scaffoldSettings.questionType === "multiple_choice" ? "convert questions to multiple choice format with 4 options" : scaffoldSettings.questionType === "true_false" ? "convert questions to true/false format" : scaffoldSettings.questionType === "fill_in_blank" ? "convert questions to fill-in-the-blank format" : scaffoldSettings.questionType === "essay" ? "convert questions to open-ended essay prompts" : "use short answer format"}
- Bloom's Depth: ${scaffoldSettings.bloomsDepth} — adjust questions to the "${scaffoldSettings.bloomsDepth}" level of Bloom's taxonomy
- Question Count: ${scaffoldSettings.questionCount}${scaffoldSettings.questionCountSyncWithAnchor ? " (sync with anchor — keep same count)" : " questions"}
- Answer Space: ${scaffoldSettings.answerSpace} — ${scaffoldSettings.answerSpace === "expanded" ? "increase lines per question" : scaffoldSettings.answerSpace === "compact" ? "reduce lines per question" : "standard lines"}
${scaffoldSettings.dyslexiaFriendly ? "- DYSLEXIA-FRIENDLY: Use OpenDyslexic-compatible formatting. Avoid italics. Increase spacing. Use clear, sans-serif language." : ""}
${scaffoldSettings.reducedContent ? "- REDUCED CONTENT MODE: Significantly reduce the number of items, simplify layout, focus on core concepts only." : ""}
${scaffoldSettings.bilingualMode !== "none" ? `- BILINGUAL MODE (${scaffoldSettings.bilingualMode}): Language pair: ${scaffoldSettings.ellLanguagePair || "English/Spanish"}. ${scaffoldSettings.bilingualMode === "side-by-side" ? "Provide content in both languages side by side." : "Add a glossary of key terms in both languages."}` : ""}

GLOBAL SETTINGS:
${globalSettings?.sameTitle ? "- KEEP SAME TITLE: Preserve the exact worksheet title from the anchor." : "- ADAPT TITLE: You may adjust the title to reflect the level (e.g., append 'Below Grade' or 'Advanced')."}
${globalSettings?.sameTheme ? "- KEEP SAME THEME: Maintain the same visual theme, color scheme, and styling." : ""}
${globalSettings?.sameLayout ? "- KEEP SAME LAYOUT: Preserve the exact section order and layout structure." : ""}
${globalSettings?.printMode ? "- PRINT MODE: Optimize for printing — avoid decorative elements, use high contrast, ensure readability when printed." : ""}

RULES:
1. Keep the same JSON structure as the anchor worksheet
2. Keep the same topic and learning objective
3. Adjust text complexity, question depth, and scaffolding per settings
4. Keep section types and overall structure intact
5. Generate unique question/section IDs (use "v_" prefix + original ID)
6. Return the adapted worksheet JSON plus a "changeSummary" array of 2-3 bullet strings describing what changed

Return JSON in this format:
{
  "worksheet": { ... adapted worksheet JSON ... },
  "changeSummary": ["bullet 1", "bullet 2", "bullet 3"]
}`;

        const userPrompt = `Adapt this worksheet for: "${label}"

Anchor worksheet:
${anchorJSON}

Return ONLY valid JSON with "worksheet" and "changeSummary" fields.`;

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
        if (!rawContent) throw new Error("No AI response");

        const parsed = JSON.parse(rawContent);
        const worksheet = parsed.worksheet || parsed;
        worksheet.worksheet_id = worksheet.worksheet_id || randomUUID();

        return {
          versionId,
          worksheet,
          changeSummary: parsed.changeSummary || ["Adapted from anchor worksheet"],
        };
      })
    );

    const output = results.map((result, i) => {
      if (result.status === "fulfilled") {
        return { ...result.value, status: "complete" };
      } else {
        return {
          versionId: versions[i].versionId,
          status: "error",
          error: result.reason?.message || "Generation failed",
          worksheet: null,
          changeSummary: [],
        };
      }
    });

    res.json({ versions: output });
  } catch (err) {
    console.error("Differentiation error:", err);
    res.status(500).json({ error: "DIFFERENTIATION_FAILED", message: "Failed to generate differentiated versions" });
  }
});

export default router;
