import type { ModelId } from "@/lib/types";

/** Approximate $ per 1M tokens, June 2026 published pricing. */
export const PRICING: Record<ModelId, { inputPer1M: number; outputPer1M: number }> = {
  gpt: { inputPer1M: 0.15, outputPer1M: 0.6 },
  claude: { inputPer1M: 3, outputPer1M: 15 },
  gemini: { inputPer1M: 0.075, outputPer1M: 0.3 },
  deepseek: { inputPer1M: 0.27, outputPer1M: 1.1 },
  llama: { inputPer1M: 0.59, outputPer1M: 0.79 },
};

export function calcCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  const { inputPer1M, outputPer1M } = PRICING[model];
  return (inputTokens / 1_000_000) * inputPer1M + (outputTokens / 1_000_000) * outputPer1M;
}
