import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables");
}

export const geminiClient = new GoogleGenAI({ apiKey });

/**
 * Utility for exponential backoff retries, useful for handling rate limits (429)
 * and transient network errors from the Gemini API.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff with jitter)
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`Gemini API call failed. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt} of ${maxRetries})`, error instanceof Error ? error.message : "Unknown error");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry failed");
}
