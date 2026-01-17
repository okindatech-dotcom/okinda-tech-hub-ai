import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const app = express();
const upload = multer({ dest: "uploads/" });

// 🔹 Hardcode your API key here
const openai = new OpenAI({ apiKey: "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" });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const SYSTEM_PROMPT = `
You are an intelligent AI assistant.
Rules:
1. If a question has multiple possible answers, give ONLY the correct answer. Do NOT explain unless asked.
2. If a question requires explanation, explain deeply using clear paragraphs and relevant examples.
3. If an image is provided, analyze it and describe what is shown. If it contains a question, answer it.
4. If a file is uploaded, read it and answer questions or summarize as needed.
`;

// TEXT ONLY
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI processing failed." });
  }
});

// IMAGE + FILE UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    let content = "";

    // IMAGE
    if (file.mimetype.startsWith("image/")) {
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = imageBuffer.toString("base64");

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image." },
              {
                type: "image_url",
                image_url: { url: `data:${file.mimetype};base64,${base64Image}` },
              },
            ],
          },
        ],
      });

      fs.unlinkSync(file.path);
      return res.json({ reply: response.choices[0].message.content });
    }

    // PDF
    if (file.mimetype === "application/pdf") {
      const data = await pdfParse(fs.readFileSync(file.path));
      content = data.text;
    }

    // DOCX
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ path: file.path });
      content = result.value;
    }

    // TXT
    if (file.mimetype === "text/plain") {
      content = fs.readFileSync(file.path, "utf8");
    }

    fs.unlinkSync(file.path);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Read and analyze this file:\n\n${content}` }
      ],
    });

    res.json({ reply: response.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File processing failed." });
  }
});

app.listen(3000, () => {
  console.log("AI Agent running at http://localhost:3000");
});
