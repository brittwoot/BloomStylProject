import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function safeParseJSON(str: string): any | null {
  try {
    const cleaned = str
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[GEN] JSON parse failed:", e);
    return null;
  }
}

// Grade level calibration descriptions
const GRADE_DESCRIPTIONS: Record<string, string> = {
  "Pre-K": "Pre-Kindergarten (ages 4–5): extremely simple, visual, 1-word answers only, large text, lots of pictures",
  "K": "Kindergarten (age 5–6): beginning readers, single short sentences, trace/circle tasks, large print",
  "1": "Grade 1 (age 6–7): early readers, 2–3 word answers, phonics-level vocabulary, very short sentences",
  "2": "Grade 2 (age 7–8): developing readers, 4–6 word answers, simple paragraphs, grade 2 sight words",
  "3": "Grade 3 (age 8–9): independent readers, multi-sentence answers, basic inference, third-grade vocabulary",
  "4": "Grade 4 (age 9–10): fluent readers, paragraph-length answers, grade-appropriate idioms, moderate difficulty",
  "5": "Grade 5 (age 10–11): proficient readers, analytical thinking, multi-paragraph responses, challenging vocabulary",
  "6": "Grade 6 (age 11–12): middle-school level, abstract thinking, textual evidence required, complex sentences",
  "7": "Grade 7 (age 12–13): advanced middle school, critical analysis, multi-paragraph essays, sophisticated vocabulary",
  "8": "Grade 8 (age 13–14): pre-high school, thesis-level thinking, deep analysis, advanced vocabulary",
};

// Subject-aware, activity-aware variant instructions
function getVariantInstructions(variant: string, activityType: string, subject?: string): string {
  const isMath = activityType === "math_practice" || activityType === "math_word_problems" || activityType === "number_bond" || activityType === "ten_frame";
  const isWriting = activityType === "writing_prompt" || activityType === "acrostic" || activityType === "sentence_frames" || activityType === "mini_book";
  const isReading = activityType === "story_map" || activityType === "kwl_chart" || activityType === "sequence_chart" || activityType === "venn_diagram";

  if (variant === "A") {
    if (isMath) return "Layout A (Classic): Generate a clean, straightforward set of problems. Use standard format with clear answer blanks. Moderate quantity (6–8 problems). Balanced difficulty for the grade.";
    if (isWriting) return "Layout A (Classic): Generate a focused, structured prompt. Single clear prompt sentence, standard lined writing space, name/date header. Classic worksheet format.";
    if (isReading) return "Layout A (Classic): Standard graphic organizer format. Clear labeled boxes, straightforward questions, typical reading comprehension structure.";
    return "Layout A (Classic): Straightforward, standard layout. Clear headers, typical organization for this activity type. Most familiar format for students.";
  }
  if (variant === "B") {
    if (isMath) return "Layout B (Extended): Generate 8–10 problems with slightly higher challenge. Include a 'Show Your Work' box for 2–3 problems. Add a bonus challenge problem at the end if appropriate.";
    if (isWriting) return "Layout B (Creative): Generate an open-ended, imaginative prompt. Add a pre-writing brainstorm bubble/box. Include a 6-word word bank of interesting vocabulary relevant to the topic.";
    if (isReading) return "Layout B (Visual): More visual organizer layout. Use icons or visual cues in headers. Include a 'My Thinking' box for student reflection. Add a vocabulary section.";
    return "Layout B (Visual): More visual, graphic layout. Add creative headers, visual dividers, and more structural boxes. Slightly more engaging visually than the classic format.";
  }
  if (variant === "C") {
    if (isMath) return "Layout C (Scaffolded): Start with 2–3 worked/guided examples, then 6 practice problems increasing in difficulty. Add a 'Remember:' tip box at the top. Ideal for intervention or ELL students.";
    if (isWriting) return "Layout C (Scaffolded): Highly guided writing experience. Break the task into step-by-step instructions. Include sentence frame starters like 'First, ___ Then, ___ Finally, ___'. Add a drawing box for pre-writers. ELL-friendly.";
    if (isReading) return "Layout C (Scaffolded): Step-by-step reading guide. Include sentence starters for each response. Add a vocabulary support box with key terms pre-filled. Use numbered steps instead of open boxes.";
    return "Layout C (Scaffolded): Step-by-step, heavily guided layout. Break each task into smaller sub-steps. Add sentence starters, hint boxes, or graphic cues. Designed for struggling learners and ELL students.";
  }
  return "";
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const { activityType, options, originalPrompt, parsedPromptData, layoutVariant, subject, details } = req.body;

    if (!activityType) {
      res.status(400).json({ error: "BAD_REQUEST", message: "activityType is required" });
      return;
    }

    console.log(`[GEN] Layout ${layoutVariant ?? "–"}: Starting (type=${activityType})`);

    const title = options?.title || parsedPromptData?.topic || activityType;
    const grade = options?.gradeLevel || parsedPromptData?.gradeLevel || "General";
    const topic = parsedPromptData?.topic || originalPrompt || title;
    const targetWord = parsedPromptData?.targetWord;
    const variantInstruction = layoutVariant ? getVariantInstructions(layoutVariant, activityType, subject) : "";
    const gradeDescription = GRADE_DESCRIPTIONS[grade] || `Grade ${grade}`;
    const detailsNote = details ? `\nTeacher's specific request: "${details}"` : "";

    // Build sections based on activity type
    const systemPrompt = `You are an expert K-8 worksheet content generator for teachers.
Generate specific, grade-appropriate content for a classroom worksheet.
Return ONLY valid JSON with this structure:
{
  "worksheet": {
    "worksheet_id": "${randomUUID()}",
    "title": "Worksheet title",
    "subject": "${subject || "General"}",
    "gradeLevel": "${grade}",
    "language": "English",
    "template_type": "${activityType}",
    "sections": [ ... ]
  }
}

Activity type: ${activityType}
Title: ${title}
Grade calibration: ${gradeDescription}
Topic: ${topic}
Subject area: ${subject || "General"}
${targetWord ? `Target word: ${targetWord}` : ""}
Options: ${JSON.stringify(options || {})}

IMPORTANT: All content MUST be appropriate for ${gradeDescription}. Adjust vocabulary, sentence complexity, number ranges, and question depth accordingly.

SECTION GENERATION RULES BY TYPE:

For mind_map:
Generate sections: [{ "id":"s1", "type":"mind_map", "title": "${title}", "centerTerm": "${topic}", "branches": ["branch1", "branch2", "branch3", "branch4"], "branchCount": ${options?.branchCount || 4} }]

For venn_diagram:
Generate sections: [{ "id":"s1", "type":"venn_diagram", "title":"${title}", "leftLabel": "${options?.leftLabel || 'Topic A'}", "rightLabel": "${options?.rightLabel || 'Topic B'}", "centerLabel": "${options?.centerLabel || 'Both'}", "leftItems": ["item1","item2","item3"], "rightItems": ["item1","item2","item3"], "centerItems": ["shared1","shared2"] }]

For kwl_chart:
Generate sections: [{ "id":"s1", "type":"kwl_chart", "title":"${title}", "variant": "${options?.variant || 'KWL (3 columns)'}", "knowItems": ["fact1 about ${topic}","fact2"], "wantItems": ["question1?","question2?"], "learnedItems": [], "rowCount": ${options?.rowCount || 8} }]

For sequence_chart:
Generate sections: [{ "id":"s1", "type":"sequence_chart", "title":"${title}", "steps": [{"id":"step1","number":1,"title":"Step title","content":"Description"},{"id":"step2","number":2,"title":"Step title","content":"Description"},{"id":"step3","number":3,"title":"Step title","content":"Description"},{"id":"step4","number":4,"title":"Step title","content":"Description"}] }]

For frayer_model:
Generate sections: [{ "id":"s1", "type":"frayer_model", "title":"${title}", "centerTerm":"${targetWord || topic}", "q1Label":"${options?.q1Label || 'Definition'}", "q2Label":"${options?.q2Label || 'Example'}", "q3Label":"${options?.q3Label || 'Non-Example'}", "q4Label":"${options?.q4Label || 'Draw It'}", "q1Content":"Clear definition of ${targetWord || topic}", "q2Content":"Example sentence or use", "q3Content":"What it is NOT", "q4Content":"" }]

For writing_prompt:
Generate sections: [
  { "id":"s1", "type":"writing_prompt_header", "title":"${title}", "prompt":"${options?.prompt || 'Generate an engaging ' + (options?.promptStyle || 'creative') + ' writing prompt about ' + topic + ' for grade ' + grade}", "lineCount":${options?.lineCount || 15}, "lineStyle":"${options?.lineStyle || 'wide ruled'}", "illustrationBox":"${options?.illustrationBox || 'None'}" },
  ${options?.wordBank ? '{ "id":"s2", "type":"word_bank", "title":"Word Bank", "words":["word1","word2","word3","word4","word5","word6"] }' : ''}
]

For acrostic:
Generate sections: [{ "id":"s1", "type":"acrostic", "title":"${title}", "acrosticWord":"${options?.acrosticWord || targetWord || topic.split(' ')[0] || 'WORD'}", "linesPerLetter":${options?.linesPerLetter || 1}, "styleHint":"${options?.styleHint || 'Phrase'}" }]

For word_search:
Generate a word list of 10-15 words related to the topic.
Generate sections: [{ "id":"s1", "type":"word_search_full", "title":"${title}", "wordList":["WORD1","WORD2","WORD3","WORD4","WORD5","WORD6","WORD7","WORD8","WORD9","WORD10"], "gridSize":"${options?.gridSize || '10×10'}", "directions":"${options?.directions || 'Horiz + Vertical'}", "showWordList":${options?.showWordList !== false} }]

For bingo_card:
Generate sections: [{ "id":"s1", "type":"bingo_card", "title":"${title}", "gridSize":"${options?.gridSize || '5×5'}", "freeSpace":${options?.freeSpace !== false}, "wordList":["WORD1","WORD2","WORD3","WORD4","WORD5","WORD6","WORD7","WORD8","WORD9","WORD10","WORD11","WORD12","WORD13","WORD14","WORD15","WORD16","WORD17","WORD18","WORD19","WORD20","WORD21","WORD22","WORD23","WORD24"] }]

For number_bond:
Generate sections: [{ "id":"s1", "type":"number_bond", "title":"${title}", "bondCount":${options?.bondCount || 6}, "focus":"${options?.focus || 'Addition'}", "bonds":[{"whole":5,"part1":2,"part2":null},{"whole":8,"part1":null,"part2":3},{"whole":10,"part1":4,"part2":null},{"whole":7,"part1":null,"part2":5},{"whole":6,"part1":2,"part2":null},{"whole":9,"part1":null,"part2":4}] }]

For ten_frame:
Generate sections: [{ "id":"s1", "type":"ten_frame", "title":"${title}", "frameCount":${options?.frameCount || 4}, "activity":"${options?.activity || 'Draw counters'}", "problems":[{"number":3},{"number":7},{"number":5},{"number":9}] }]

For coloring_page:
Generate sections: [{ "id":"s1", "type":"coloring_page", "title":"${title}", "theme":"${options?.theme || topic}", "size":"${options?.size || 'Full page'}", "addWritingLines":${options?.addWritingLines || false}, "lineCount":${options?.lineCount || 3}, "instructions":"Color the picture below." }]

For color_by_code:
Generate the color key from the topic.
Generate sections: [{ "id":"s1", "type":"color_by_code", "title":"${title}", "codeType":"${options?.codeType || 'Sight words'}", "theme":"${options?.theme || topic}", "colorKey":[{"code":"the","color":"#FFD700"},{"code":"and","color":"#87CEEB"},{"code":"can","color":"#FF6B6B"},{"code":"up","color":"#90EE90"}] }]

For label_diagram:
Generate sections: [{ "id":"s1", "type":"label_diagram", "title":"${title}", "subject":"${options?.diagramSubject || topic}", "parts":["part1","part2","part3","part4","part5","part6"], "wordBank":${options?.wordBank !== false} }]

For observation_sheet:
Generate sections: [{ "id":"s1", "type":"observation_sheet", "title":"${title}", "sections":["My Hypothesis:","What I Observed:","What I Learned:"], "includeDrawing":${options?.includeDrawing !== false} }]

For timeline:
Generate 5 events for the topic.
Generate sections: [{ "id":"s1", "type":"timeline", "title":"${title}", "orientation":"${options?.orientation || 'Horizontal'}", "events":[{"id":"e1","label":"Event 1","content":""},{"id":"e2","label":"Event 2","content":""},{"id":"e3","label":"Event 3","content":""},{"id":"e4","label":"Event 4","content":""},{"id":"e5","label":"Event 5","content":""}] }]

For story_map:
Generate sections: [{ "id":"s1", "type":"story_map", "title":"${title}", "layout":"Linear", "fields":[{"label":"Characters","content":""},{"label":"Setting","content":""},{"label":"Problem","content":""},{"label":"Event 1","content":""},{"label":"Event 2","content":""},{"label":"Event 3","content":""},{"label":"Solution","content":""},{"label":"Theme","content":""}] }]

For line_matching:
Generate ${options?.pairCount || 6} matching pairs for the topic.
Generate sections: [{ "id":"s1", "type":"line_matching", "title":"${title}", "matchType":"${options?.matchType || 'Word → Definition'}", "pairs":[{"left":"term1","right":"match1"},{"left":"term2","right":"match2"},{"left":"term3","right":"match3"},{"left":"term4","right":"match4"},{"left":"term5","right":"match5"},{"left":"term6","right":"match6"}] }]

For cut_and_sort:
Generate items for each category.
Generate sections: [{ "id":"s1", "type":"cut_and_sort", "title":"${title}", "categories":["${options?.categories?.split(',')[0]?.trim() || 'Category A'}","${options?.categories?.split(',')[1]?.trim() || 'Category B'}"], "items":["item1","item2","item3","item4","item5","item6","item7","item8"] }]

For sentence_frames:
Generate ${options?.frameCount || 4} sentence frames for the topic.
Generate sections: [{ "id":"s1", "type":"sentence_frames", "title":"${title}", "frames":[{"id":"f1","stem":"The ___ is important because ___"},{"id":"f2","stem":"I think ___ because ___"},{"id":"f3","stem":"One fact about ___ is ___"},{"id":"f4","stem":"I learned that ___ helps ___"}], "writingLines":${options?.writingLines || 2} }]

For mini_book:
Generate sections: [{ "id":"s1", "type":"mini_book", "title":"${title}", "panelCount":${options?.panelCount || 4}, "panels":[{"id":"p1","number":1,"label":"Page 1","prompt":""},{"id":"p2","number":2,"label":"Page 2","prompt":""},{"id":"p3","number":3,"label":"Page 3","prompt":""},{"id":"p4","number":4,"label":"Page 4","prompt":""}] }]

For clock_practice:
Generate sections: [{ "id":"s1", "type":"clock_practice", "title":"${title}", "clockCount":${options?.clockCount || 6}, "precision":"${options?.precision || 'Half hour'}", "direction":"${options?.direction || 'Draw the hands'}", "times":["1:00","2:30","3:00","4:30","5:00","6:30"] }]

For spinner:
Generate sections: [{ "id":"s1", "type":"spinner", "title":"${title}", "sections":${options?.sections || 6}, "sectionLabels":${options?.sectionLabels ? JSON.stringify(options.sectionLabels.split(',').map((s:string)=>s.trim())) : '["Option 1","Option 2","Option 3","Option 4","Option 5","Option 6"]'}, "recordSheet":${options?.recordSheet !== false} }]

For dice_activity:
Generate sections: [{ "id":"s1", "type":"dice_activity", "title":"${title}", "activityTitle":"${options?.activityTitle || 'Write'}", "faces":["⚀","⚁","⚂","⚃","⚄","⚅"], "instructions":["Action for 1","Action for 2","Action for 3","Action for 4","Action for 5","Action for 6"] }]

For graph_page:
Generate sections: [{ "id":"s1", "type":"graph_page", "title":"${title}", "graphType":"${options?.graphType || 'Bar graph'}", "xLabel":"Categories", "yLabel":"Count", "categories":["Category A","Category B","Category C","Category D"], "maxValue":${options?.maxValue || 10} }]

For measurement:
Generate sections: [{ "id":"s1", "type":"measurement", "title":"${title}", "unit":"${options?.unit || 'Inches'}", "itemCount":${options?.itemCount || 6}, "items":["pencil","crayon","eraser","book","ruler","paper clip"] }]

For math_practice:
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"<equation with blanks>","lines":3}
Equations must be solvable and reflect the operation implied by "${topic}". Use grade ${grade} for number size.
When "${topic}" is addition, use addition equations; when subtraction, use subtraction; when multiplication, use multiplication; when division, use division.

Generate sections: [{
  "id":"s1",
  "type":"math_practice",
  "title":"${title}",
  "instructions":"Solve each equation and write the answer in the blank.",
  "questions":[]
}]

For math_word_problems:
Generate EXACTLY ${options?.problemCount || 6} question objects in the questions array with ids q1..qN.
Each question must have:
{"id":"q#","question_type":"short_answer","text":"<scenario ending with answer blank>","lines":3}
Use scenario-based word problems based on "${topic}" (addition/subtraction/multiplication/division) and tune phrasing/number size to grade ${grade}.
Use subject "${subject}" to pick a context flavor when appropriate (e.g., classroom/real-life framing).

Generate sections: [{
  "id":"s1",
  "type":"math_word_problems",
  "title":"${title}",
  "instructions":"Read each scenario and solve. Write the answer in the blank.",
  "questions":[]
}]

For map_activity:
Generate sections: [{ "id":"s1", "type":"map_activity", "title":"${title}", "mapType":"${options?.mapType || 'Community'}", "includeCompass":${options?.includeCompass !== false}, "includeKey":${options?.includeKey !== false} }]

For crossword:
Generate ${options?.clueCount || 8} words with clues.
Generate sections: [{ "id":"s1", "type":"crossword", "title":"${title}", "clues":[{"number":1,"direction":"Across","clue":"clue 1","answer":"WORD1"},{"number":2,"direction":"Down","clue":"clue 2","answer":"WORD2"},{"number":3,"direction":"Across","clue":"clue 3","answer":"WORD3"}] }]

For picture_sort:
Generate sections: [{ "id":"s1", "type":"picture_sort", "title":"${title}", "categories":${JSON.stringify((options?.categories || 'Category A, Category B').split(',').map((c:string)=>c.trim()))}, "cards":["item1","item2","item3","item4","item5","item6","item7","item8"] }]

For trace_and_color:
Generate sections: [{ "id":"s1", "type":"tracing", "targetWord":"${options?.theme || targetWord || topic}", "instructions":"Trace and then color the image.", "lineCount":4 }]

For word_practice (sight word):
Generate sections for a complete sight word worksheet.
Ensure targetWord is "${targetWord || topic}".
Generate: word_practice, word_sight_row, fill_blanks, sentence_practice sections.

DEFAULT for any other type:
Generate appropriate sections based on the activity type and topic.
Include 2-4 sections with real content for the topic.

Fill in ALL placeholder content with real, grade-appropriate content for "${topic}" at grade ${grade}.
${variantInstruction}${detailsNote}
Return ONLY valid JSON.`;

    const userMsg = layoutVariant
      ? `Generate Layout ${layoutVariant} worksheet content. Activity: "${activityType}". Topic: "${topic}". Grade: ${grade}. Return ONLY valid JSON.`
      : `Generate the worksheet content for activity type "${activityType}" about "${topic}". Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      console.error(`[GEN] Layout ${layoutVariant ?? "–"}: No content from AI`);
      res.status(500).json({ error: "AI_ERROR", message: "No response from AI" });
      return;
    }

    console.log(`[GEN] Layout ${layoutVariant ?? "–"}: Parsing response...`);
    let result: any;
    try {
      result = JSON.parse(rawContent);
    } catch {
      result = safeParseJSON(rawContent);
    }
    if (!result) {
      console.error(`[GEN] Layout ${layoutVariant ?? "–"}: JSON parse failed`);
      res.status(500).json({ error: "PARSE_FAILED", message: "AI returned malformed JSON" });
      return;
    }

    // Ensure worksheet_id and section ids
    if (result.worksheet) {
      result.worksheet.worksheet_id = result.worksheet.worksheet_id || randomUUID();
      if (Array.isArray(result.worksheet.sections)) {
        result.worksheet.sections = result.worksheet.sections.map((s: any, i: number) => ({
          ...s,
          id: s.id || `section_${i + 1}`,
        }));
      }
      // Merge options into worksheet for the editor
      result.worksheet.settings = {
        templateType: activityType,
        theme: "clean",
        includeName: options?.includeName ?? true,
        includeDate: options?.includeDate ?? true,
        generateAnswerKey: false,
        fontStyle: options?.fontStyle || "clean",
        borderStyle: options?.borderStyle || "none",
        colorScheme: options?.colorScheme || "black & white",
        orientation: options?.orientation || "portrait",
        gradeLevel: grade,
        teacherInfo: options?.teacherInfo || "",
      };
    }

    console.log(`[GEN] Layout ${layoutVariant ?? "–"}: Done ✓`);
    res.json(result);
  } catch (err) {
    console.error(`[GEN] Layout ${layoutVariant ?? "–"}: Error —`, err);
    res.status(500).json({ error: "GENERATION_FAILED", message: "Failed to generate worksheet" });
  }
});

export default router;
