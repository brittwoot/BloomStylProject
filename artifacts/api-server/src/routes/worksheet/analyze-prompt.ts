import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// All 30 worksheet type IDs the AI can suggest
const VALID_TYPES = [
  "coloring_page", "color_by_code", "trace_and_color",
  "cut_and_sort", "line_matching", "picture_sort",
  "writing_prompt", "sentence_frames", "mini_book", "acrostic",
  "mind_map", "venn_diagram", "story_map", "kwl_chart", "sequence_chart", "frayer_model",
  "number_bond", "ten_frame", "graph_page", "clock_practice", "measurement",
  "label_diagram", "observation_sheet", "timeline", "map_activity",
  "bingo_card", "word_search", "crossword", "spinner", "dice_activity",
];

router.post("/", async (req: Request, res: Response) => {
  try {
    const { prompt, clarificationAnswer } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "BAD_REQUEST", message: "prompt is required" });
      return;
    }

    const fullPrompt = clarificationAnswer
      ? `${prompt.trim()} — Additional context: ${clarificationAnswer.trim()}`
      : prompt.trim();

    const systemPrompt = `You are an expert elementary school worksheet designer and instructional strategist.
A teacher has typed a prompt. Your job is to:
1. Determine if the prompt is vague enough to need one clarifying question (max)
2. If clear enough, suggest the 3 best activity types from the list below
3. For each suggestion, explain WHY it fits in one sentence

Available worksheet type IDs:
${VALID_TYPES.join(", ")}

Type names and descriptions (use these for labels/reasons):
- coloring_page: Coloring Page — full/half page line art to color
- color_by_code: Color by Code — illustration with color key (sight words, numbers, phonics)
- trace_and_color: Trace and Color — dashed outline paths to trace then color
- cut_and_sort: Cut and Sort — cut-out items sorted into categories
- line_matching: Draw a Line Matching — two columns, draw lines connecting pairs
- picture_sort: Picture Sort — image cards sorted into labeled columns
- writing_prompt: Writing Prompt / Journal — prompt header + lined writing area
- sentence_frames: Sentence Frames — partially written sentences to complete
- mini_book: Mini Book — fold-up book with panels for sequencing/life cycles
- acrostic: Acrostic Poem — word written vertically, student fills each letter
- mind_map: Mind Map / Web — central bubble with connecting branches
- venn_diagram: Venn Diagram — overlapping circles for comparing concepts
- story_map: Story Map — characters/setting/problem/events/solution boxes
- kwl_chart: KWL Chart — Know / Want to Know / Learned columns
- sequence_chart: Sequence/Flow Chart — numbered steps with arrows
- frayer_model: Frayer Model — four quadrants (definition/example/non-example/picture)
- number_bond: Number Bond — part-part-whole circles
- ten_frame: Ten Frame — 10-box grids for counting and number sense
- graph_page: Graph / Data Page — empty bar graph or pictograph
- clock_practice: Clock / Time Practice — clock faces to draw hands or read time
- measurement: Measurement Activity — objects with ruler to measure
- label_diagram: Label the Diagram — illustration with blank label lines
- observation_sheet: Observation Sheet — hypothesis/observe/learn sections
- timeline: Timeline — evenly spaced event boxes on a line
- map_activity: Map Activity — blank/partial map with compass and legend
- bingo_card: Bingo Card — 4×4 or 5×5 grid filled with topic words
- word_search: Word Search — letter grid with hidden words
- crossword: Crossword Puzzle — numbered grid with across/down clues
- spinner: Spinner Activity — circle divided into labeled sections
- dice_activity: Roll and ___ — dice faces with activity chart

VAGUENESS RULES — ask a clarifying question if:
- Prompt is just one or two words with no context (e.g. "animals", "math", "Halloween")
- No grade level AND no specific skill/topic (ambiguous)
- Could mean 5+ very different things

DO NOT ask if:
- The prompt mentions a specific activity type or format
- The prompt includes a specific word, skill, or concept
- There is enough context to make a good suggestion

Return a JSON object in EXACTLY this shape:
{
  "needsClarification": false,
  "clarifyingQuestion": null,
  "parsedPrompt": {
    "gradeLevel": "detected grade (K/1/2/3/4/5/6/General)",
    "topic": "main topic",
    "skillFocus": "what skill this practices",
    "targetWord": "specific word if applicable, else null"
  },
  "suggestions": [
    {
      "typeId": "one of the valid type IDs above",
      "typeName": "human-readable type name",
      "isPrimary": true,
      "reason": "One sentence explaining why this type fits the prompt perfectly",
      "previewDescription": "One short phrase describing the specific content (e.g. 'butterfly life cycle in 4 steps')",
      "suggestedTitle": "Kid-friendly worksheet title",
      "suggestedOptions": {
        "key": "value"
      }
    },
    {
      "typeId": "second best type",
      "typeName": "...",
      "isPrimary": false,
      "reason": "...",
      "previewDescription": "...",
      "suggestedTitle": "...",
      "suggestedOptions": {}
    },
    {
      "typeId": "third option",
      "typeName": "...",
      "isPrimary": false,
      "reason": "...",
      "previewDescription": "...",
      "suggestedTitle": "...",
      "suggestedOptions": {}
    }
  ]
}

OR if clarification is needed:
{
  "needsClarification": true,
  "clarifyingQuestion": "The single most useful question to ask (give 3-4 specific options in the question)",
  "parsedPrompt": null,
  "suggestions": []
}

Rules:
- Always return exactly 3 suggestions (unless needsClarification is true)
- First suggestion must have isPrimary: true
- suggestedOptions should use the option keys from the type's schema
- Return ONLY valid JSON`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Teacher prompt: "${fullPrompt}"\n\nAnalyze and return JSON.` },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      res.status(500).json({ error: "AI_ERROR", message: "No response from AI" });
      return;
    }

    const result = JSON.parse(rawContent);
    res.json(result);
  } catch (err) {
    console.error("Prompt analysis error:", err);
    res.status(500).json({ error: "ANALYSIS_FAILED", message: "Failed to analyze prompt" });
  }
});

export default router;
