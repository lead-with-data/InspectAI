import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import os from "os";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://dummy.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Initialize Gemini Client (lazy initialization)
function getAiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("No Gemini API key provided.");
  }
  return new GoogleGenAI({ 
    apiKey: key, 
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
  });
}

const upload = multer({ dest: os.tmpdir() });

async function generateContentWithRetry(requestDetails: any) {
  try {
    return await ai.models.generateContent({
      ...requestDetails,
      model: "gemini-2.5-flash",
    });
  } catch (err: any) {
    if (err.message?.includes("429") || err.message?.includes("Quota exceeded") || err.status === 429) {
      console.warn("Rate limit hit on gemini-2.5-flash, falling back to gemini-2.0-flash...");
      try {
        return await ai.models.generateContent({
          ...requestDetails,
          model: "gemini-2.0-flash",
        });
      } catch (fallbackErr: any) {
         console.warn("Rate limit hit on gemini-2.0-flash, falling back to gemini-1.5-flash...");
         return await ai.models.generateContent({
           ...requestDetails,
           model: "gemini-1.5-flash",
         });
      }
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/upload-url", async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }
      
      const key = `videos/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      res.json({ 
        uploadUrl, 
        key,
        publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`
      });
    } catch (error: any) {
      console.error("Presigned URL error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routing
  app.post("/api/analyze-video", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided." });
      }
      const apiKey = req.headers['x-gemini-api-key'] as string;
      const ai = getAiClient(apiKey);
      const requestedModel = req.body.model || "gemini-2.5-flash";
      const pricingGuidelines = req.body.pricingGuidelines || "";

      console.log("Analyzing video...", req.file.path, "with model", requestedModel);

      // Upload file to Gemini using File API
      const aiFile = await ai.files.upload({
        file: req.file.path,
        config: {
          mimeType: req.file.mimetype,
        }
      });

      console.log("File uploaded to Gemini:", aiFile.name);

      // We might need to wait for the file to be processed if it's a video
      let fileState = await ai.files.get({ name: aiFile.name });
      while (fileState.state === "PROCESSING") {
        console.log("Waiting for video processing...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileState = await ai.files.get({ name: aiFile.name });
      }

      if (fileState.state === "FAILED") {
         throw new Error("Video processing failed in Gemini");
      }

      const systemInstructionStr = `You are an AI orchestration system consisting of three distinct agents working together:
1. Video Analyzer Agent: Analyze uploaded inspection videos of residential, commercial, and industrial properties and produce structured, objective, and highly detailed inspection findings. Analyze video footage frame-by-frame and scene-by-scene. Detect all visible property issues, damages, safety hazards, and maintenance concerns however small.
2. Property Repair Pricing & Cost Estimation Agent: Generate accurate, structured, and professional repair cost estimates based on the Video Analyzer's findings. Estimate labor costs, material costs, equipment, and urgency. Provide realistic pricing ranges and confidence.
3. Chat/Reporting Agent: Synthesizes this information into a cohesive report.

Please act as all three agents. Analyze the provided video walkthrough. Extract ALL visible damages and issues. Provide a combined structured JSON output that marries the video inspector's timestamps and observations with the pricing agent's estimates.` + (pricingGuidelines ? `\n\n[USER COST ESTIMATIONS CONTEXT]\nUse these pricing rules to modify your estimates:\n${pricingGuidelines}` : "");

      const response = await ai.models.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: aiFile.uri,
                  mimeType: aiFile.mimeType
                }
              },
              {
                text: "Please analyze this walkthrough video, identify all issues, and provide both findings and pricing estimates."
              }
            ]
          }
        ],
        model: requestedModel,
        config: {
          systemInstruction: systemInstructionStr,
          responseMimeType: "application/json",
          responseSchema: {
             type: Type.OBJECT,
             properties: {
               systemMessage: { 
                 type: Type.STRING, 
                 description: "A friendly message from the Chat Agent summarizing the overall condition (e.g. 'Fair', 'Poor'), the overall estimated cost range, and the overall confidence. If under construction, ask clarifying questions." 
               },
               overallCondition: { type: Type.STRING },
               inspectionConfidence: { type: Type.STRING },
               overallEstimatedCostRangeMin: { type: Type.NUMBER },
               overallEstimatedCostRangeMax: { type: Type.NUMBER },
               issues: {
                 type: Type.ARRAY,
                 items: {
                   type: Type.OBJECT,
                   properties: {
                     timestamp: { type: Type.NUMBER, description: "Approximate timestamp in seconds" },
                     area: { type: Type.STRING, description: "e.g. 'Kitchen Ceiling'" },
                     category: { type: Type.STRING, description: "e.g. 'Water Damage'" },
                     severity: { type: Type.STRING, description: "Critical, Major, Moderate, Minor, Informational" },
                     urgency: { type: Type.STRING, description: "Immediate, High Priority, Standard, Low Priority" },
                     confidence: { type: Type.STRING, description: "High, Medium, Low" },
                     recommended_trade: { type: Type.STRING, description: "e.g. 'General Contractor'" },
                     description: { type: Type.STRING, description: "Detailed observation of the issue." },
                     labor_hours_estimate: { type: Type.STRING },
                     estimatedCost: { type: Type.STRING, description: "The total estimated cost range formatted as a string, e.g. '$850 - $1700' or 'Needs clarification'" },
                     reasoning: { type: Type.STRING, description: "Recommended actions and assumptions behind the pricing." }
                   }
                 }
               }
             }
          }
        }
      });

      // Cleanup local temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}

      // Attempt to clean up remote file if supported
      try {
        await ai.files.delete({ name: aiFile.name });
      } catch (e) {
        console.error("Could not delete from gemini:", e);
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response.text.trim());
      } catch (parseError) {
        throw new Error(`Gemini generated invalid JSON: ${response.text.substring(0, 100)}`);
      }
      res.json(parsedResponse);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("429") || err.message.includes("Quota exceeded"))) {
         return res.status(429).json({ error: "AI Studio rate limit exceeded. Please wait a minute and try again." });
      }
      res.status(500).json({ error: err.message });
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
      }
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = req.headers['x-gemini-api-key'] as string;
      const ai = getAiClient(apiKey);
      const { message, history, imageBase64, model, pricingGuidelines } = req.body;
      const requestedModel = model || "gemini-2.5-flash";

      
      const parts: any[] = [];
      if (imageBase64) {
        // expect format: "data:image/jpeg;base64,....."
        const splitted = imageBase64.split(',');
        const base64Data = splitted.length > 1 ? splitted[1] : splitted[0];
        
        if (base64Data && base64Data.trim() !== '') {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          });
        }
      }
      parts.push({ text: message });

      const contents = [];
      // add system instruction if needed
      contents.push({
        role: "user",
        parts: [{ text: "You are an AI property assistant. We are analyzing a property video. Answer the user's question, which may include a specific frame from the video." }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will help analyze the property." }]
      });

      // format history
      if (history && history.length) {
        for (const msg of history) {
          contents.push({
             role: msg.role === 'assistant' ? 'model' : 'user',
             parts: [{ text: msg.content }]
          });
        }
      }

      contents.push({
        role: "user",
        parts: parts
      });

      let systemInstructionStr = "You are a professional property inspector assistant.";
      if (pricingGuidelines) {
        systemInstructionStr += `\nHere are some pricing and rate guidelines from the user to use when making cost estimates:\n${pricingGuidelines}`;
      }

      const response = await ai.models.generateContent({
        contents: contents,
        model: requestedModel,
        config: {
          systemInstruction: systemInstructionStr
        }
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("429") || err.message.includes("Quota exceeded"))) {
         return res.status(429).json({ error: "AI Studio rate limit exceeded. Please wait a minute and try again." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Global Error Handler for API routes
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    
    // Check if it's a rate limit error even after fallbacks
    if (err.message?.includes("429") || err.message?.includes("Quota exceeded") || err.status === 429) {
      return res.status(429).json({ error: "AI Studio rate limit exceeded. Please wait a minute and try again." });
    }

    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
