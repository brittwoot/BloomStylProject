import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import detectRouter from "./detect";
import generateRouter from "./generate";
import generateLayoutsRouter from "./generate-layouts";
import analyzePromptRouter from "./analyze-prompt";
import customizeGenerateRouter from "./customize-generate";
import generateSvgRouter from "./generate-svg";
import differentiateRouter from "./differentiate";

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

router.use("/detect", detectRouter);
router.use("/generate", generateRouter);
router.use("/generate-layouts", generateLayoutsRouter);
router.use("/analyze-prompt", analyzePromptRouter);
router.use("/customize-generate", customizeGenerateRouter);
router.use("/generate-svg", generateSvgRouter);
router.use("/differentiate", differentiateRouter);

export default router;
