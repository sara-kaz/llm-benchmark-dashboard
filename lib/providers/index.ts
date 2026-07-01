import type { ModelId } from "@/lib/types";
import { createOpenAICompatibleCaller, type ModelCallResult } from "@/lib/providers/openaiCompatible";
import { callClaude } from "@/lib/providers/anthropic";
import { callGemini } from "@/lib/providers/gemini";

export type { ModelCallResult };

const callGpt = createOpenAICompatibleCaller({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
});

const callDeepseek = createOpenAICompatibleCaller({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
});

const callLlama = createOpenAICompatibleCaller({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
});

export const PROVIDER_REGISTRY: Record<ModelId, (prompt: string) => Promise<ModelCallResult>> = {
  gpt: callGpt,
  claude: callClaude,
  gemini: callGemini,
  deepseek: callDeepseek,
  llama: callLlama,
};
