import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

export const CLASSIFICATION_MODEL = env.GEMINI_CLASSIFICATION_MODEL;
export const EXTRACTION_MODEL = env.GEMINI_EXTRACTION_MODEL;
export const EMBEDDING_MODEL = env.GEMINI_EMBEDDING_MODEL;

export const EMBEDDING_CHUNK_SIZE = env.EMBEDDING_CHUNK_SIZE;
export const EMBEDDING_CHUNK_OVERLAP = env.EMBEDDING_CHUNK_OVERLAP;
export const EMBEDDING_MIN_SIMILARITY = env.EMBEDDING_MIN_SIMILARITY;
export const CHAT_MODEL = env.GEMINI_CHAT_MODEL;
export const CHAT_HISTORY_LIMIT = env.CHAT_HISTORY_LIMIT;
export const CHAT_RETRIEVAL_LIMIT = env.CHAT_RETRIEVAL_LIMIT;

export const geminiClient = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});
