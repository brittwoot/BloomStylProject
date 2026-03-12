import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/", async (req, res) => {
  const { description, regions = 6, ageGroup = "K-2", detailLevel = "medium" } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "description is required" });
  }

  const numRegions = Math.max(4, Math.min(16, Number(regions)));
  const strokeWidth = ageGroup === "Pre-K" || ageGroup === "K-1" ? 3 : 2.5;
  const labelSize = ageGroup === "Pre-K" || ageGroup === "K-1" ? 14 : 11;

  const systemPrompt = `You are a graphic designer specializing in children's educational coloring pages. 
You generate clean, simple SVG coloring page illustrations as pure SVG markup.
Output ONLY the raw SVG — no markdown, no explanation, no code fences.
The SVG must be a valid, complete SVG element starting with <svg and ending with </svg>.`;

  const userPrompt = `Create an SVG coloring page illustration of: "${description}"

Requirements:
- ViewBox: 0 0 500 500
- Canvas: white background rectangle first
- All colorable shapes: stroke='#1a1a1a' stroke-width='${strokeWidth}' fill='none'  
- All paths must be CLOSED shapes (no open-ended strokes)
- Divide the illustration into exactly ${numRegions} distinct colorable regions
- Each colorable region: a separate closed <path>, <polygon>, <circle>, <rect>, or <ellipse> element
- Each region must have id='region_1', id='region_2', ... id='region_${numRegions}'
- Regions should be large enough for a child to color in
- Add a small <text> label in each region showing its number (1, 2, 3...)
  - Text style: font-size='${labelSize}' fill='#555555' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'
  - Position text at the visual center of each region
- Detail level: ${detailLevel} (simple = fewer, larger shapes; detailed = more complexity)
- The illustration should look like a clear, friendly coloring book page a child would enjoy
- Add a simple outer border: <rect x='5' y='5' width='490' height='490' fill='none' stroke='#cccccc' stroke-width='1'/>
- Do not use clip-path, external images, or gradients
- Do not use opacity or filters on colorable regions
- Keep the design age-appropriate and recognizable`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return res.status(500).json({ error: "Unexpected response type from Claude" });
    }

    let svgText = content.text.trim();

    const svgStart = svgText.indexOf("<svg");
    const svgEnd = svgText.lastIndexOf("</svg>");
    if (svgStart === -1 || svgEnd === -1) {
      return res.status(500).json({ error: "Invalid SVG output from Claude", raw: svgText.slice(0, 200) });
    }
    svgText = svgText.slice(svgStart, svgEnd + 6);

    return res.json({ svg: svgText, regions: numRegions, description });
  } catch (err) {
    console.error("[generate-svg] error:", err);
    return res.status(500).json({ error: "SVG generation failed" });
  }
});

export default router;
