import OpenAI from "openai";
import { withRetry } from "@/lib/retry";

export interface ModelCallResult {
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

interface OpenAICompatibleConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
}

export function createOpenAICompatibleCaller(config: OpenAICompatibleConfig) {
  return async function callModel(prompt: string): Promise<ModelCallResult> {
    if (!config.apiKey) {
      throw new Error("Missing API key");
    }
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
    const start = performance.now();
    const completion = await withRetry(() =>
      client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
      }),
    );
    const latencyMs = performance.now() - start;
    const text = completion.choices[0]?.message?.content ?? "";
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;
    return { text, latencyMs, inputTokens, outputTokens };
  };
}
