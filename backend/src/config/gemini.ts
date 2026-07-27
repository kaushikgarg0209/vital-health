import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

export const CLASSIFICATION_MODEL = env.GEMINI_CLASSIFICATION_MODEL;
export const EXTRACTION_MODEL = env.GEMINI_EXTRACTION_MODEL;

export const geminiClient = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});
