import { NextResponse } from "next/server";
import { z } from "zod";
import { EVAL_SUITE } from "@/data/eval-suite";
import { SEED_BENCHMARKS } from "@/data/seed-benchmarks";
import { PROVIDER_REGISTRY } from "@/lib/providers";
import { judgeResponse } from "@/lib/judge";
import { calcCost } from "@/lib/pricing";
import type { LiveRunResult, ModelId, PromptResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  model: z.enum(["gpt", "claude", "gemini", "deepseek", "llama"]),
});

function referenceFallback(model: ModelId, error?: string): LiveRunResult {
  const ref = SEED_BENCHMARKS.find((b) => b.model === model)!;
  return {
    model,
    source: "reference",
    metrics: ref.metrics,
    promptResults: [],
    error,
  };
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { model } = parsed.data;
  const caller = PROVIDER_REGISTRY[model];
  const refMetrics = SEED_BENCHMARKS.find((b) => b.model === model)!.metrics;

  const promptResults = await Promise.all(
    EVAL_SUITE.map(async (evalPrompt): Promise<PromptResult> => {
      try {
        const { text, latencyMs, inputTokens, outputTokens } = await caller(evalPrompt.prompt);
        const cost = calcCost(model, inputTokens, outputTokens);

        let quality = refMetrics.quality;
        let reasoning = refMetrics.reasoning;
        let judgeRationale: string | undefined;
        try {
          const score = await judgeResponse(evalPrompt.prompt, evalPrompt.category, text);
          quality = score.quality;
          reasoning = score.reasoning;
          judgeRationale = score.rationale;
        } catch {
          judgeRationale = "Judge unavailable — using reference score.";
        }

        return {
          promptId: evalPrompt.id,
          category: evalPrompt.category,
          response: text,
          latencyMs,
          inputTokens,
          outputTokens,
          cost,
          quality,
          reasoning,
          judgeRationale,
        };
      } catch (err) {
        return {
          promptId: evalPrompt.id,
          category: evalPrompt.category,
          response: "",
          latencyMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          quality: 0,
          reasoning: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }),
  );

  const successful = promptResults.filter((r) => !r.error);

  if (successful.length === 0) {
    return NextResponse.json(referenceFallback(model, promptResults[0]?.error ?? "All prompts failed"));
  }

  const totalInputTokens = successful.reduce((sum, r) => sum + r.inputTokens, 0);
  const totalOutputTokens = successful.reduce((sum, r) => sum + r.outputTokens, 0);
  const totalCost = successful.reduce((sum, r) => sum + r.cost, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const avgLatencyMs = successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length;
  const totalLatencySec = successful.reduce((sum, r) => sum + r.latencyMs, 0) / 1000;
  const tokensPerSec = totalLatencySec > 0 ? totalOutputTokens / totalLatencySec : 0;
  const avgQuality = successful.reduce((sum, r) => sum + r.quality, 0) / successful.length;
  const avgReasoning = successful.reduce((sum, r) => sum + r.reasoning, 0) / successful.length;
  const costPer1M = totalTokens > 0 ? (totalCost / totalTokens) * 1_000_000 : refMetrics.costPer1M;

  const result: LiveRunResult = {
    model,
    source: "live",
    metrics: {
      tokensPerSec: Math.round(tokensPerSec),
      latencyMs: Math.round(avgLatencyMs),
      costPer1M: Math.round(costPer1M * 100) / 100,
      quality: Math.round(avgQuality * 10) / 10,
      reasoning: Math.round(avgReasoning * 10) / 10,
    },
    promptResults,
  };

  return NextResponse.json(result);
}
