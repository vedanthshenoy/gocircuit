
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY!);

async function listModels() {
  try {
    // The SDK doesn't have a direct listModels in the main class easily accessible sometimes depending on version,
    // but we can try to fetch it or just test a few common names.
    // Actually, let's just test the most likely stable names.
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash",
      "gemini-2.0-pro-exp",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.0-flash",
      "gemini-3.0-pro"
    ];

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("test");
        console.log(`✅ ${modelName} is AVAILABLE`);
      } catch (e) {
        console.log(`❌ ${modelName} failed: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
