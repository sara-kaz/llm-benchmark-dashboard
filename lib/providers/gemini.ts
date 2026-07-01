import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ModelCallResult } from "@/lib/providers/openaiCompatible";

const MODEL = "gemini-2.5-flash";

export async function callGemini(prompt: string): Promise<ModelCallResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODEL });
  const start = performance.now();
  const result = await model.generateContent(prompt);
  const latencyMs = performance.now() - start;
  const response = result.response;
  return {
    text: response.text(),
    latencyMs,
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
