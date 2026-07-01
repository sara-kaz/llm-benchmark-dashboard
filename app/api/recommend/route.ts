import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/json";
import { withRetry } from "@/lib/retry";
import { heuristicWeights, scoreModels } from "@/lib/recommend";
import { SEED_BENCHMARKS, MODEL_META } from "@/data/seed-benchmarks";
import type { BenchmarkMetrics, CriteriaWeights, ModelId, RecommendationResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const metricsSchema = z.object({
  tokensPerSec: z.number(),
  latencyMs: z.number(),
  costPer1M: z.number(),
  quality: z.number(),
  reasoning: z.number(),
});

const bodySchema = z.object({
  description: z.string().min(3).max(2000),
  metrics: z.record(z.string(), metricsSchema).optional(),
});

async function llmWeights(description: string): Promise<{ weights: CriteriaWeights; summary: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }
  const client = new Anthropic({ apiKey });
  const prompt = `A developer describes a project they want to power with an LLM API:

"${description}"

Assign an importance weight from 0 to 1 for each of these four criteria, reflecting how much THIS SPECIFIC project should prioritize it when choosing which LLM to use:
- "speed": low latency / high throughput matters (e.g. real-time chat, live voice, high request volume)
- "cost": cheap per-token pricing matters (e.g. tight budget, very high volume, hobby project)
- "quality": correctness/completeness/polish of output matters (e.g. user-facing content, accuracy-critical)
- "reasoning": multi-step logical/analytical ability matters (e.g. coding, math, planning, agents)

Respond with ONLY JSON, no other text, in exactly this shape:
{"speed": <0-1>, "cost": <0-1>, "quality": <0-1>, "reasoning": <0-1>, "summary": "<one sentence on what this project needs most and why>"}`;

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  );

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = extractJson<{
    speed?: unknown;
    cost?: unknown;
    quality?: unknown;
    reasoning?: unknown;
    summary?: unknown;
  }>(text);

  const clamp = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isNaN(n) ? 0.5 : Math.min(1, Math.max(0, n));
  };

  return {
    weights: {
      speed: clamp(parsed.speed),
      cost: clamp(parsed.cost),
      quality: clamp(parsed.quality),
      reasoning: clamp(parsed.reasoning),
    },
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { description } = parsed.data;

  const metrics: Record<ModelId, BenchmarkMetrics> =
    (parsed.data.metrics as Record<ModelId, BenchmarkMetrics> | undefined) ??
    (Object.fromEntries(SEED_BENCHMARKS.map((b) => [b.model, b.metrics])) as Record<ModelId, BenchmarkMetrics>);

  let weights: CriteriaWeights;
  let summary: string;
  let source: "llm" | "heuristic";
  try {
    const result = await llmWeights(description);
    weights = result.weights;
    summary = result.summary || heuristicWeights(description).summary;
    source = "llm";
  } catch {
    const result = heuristicWeights(description);
    weights = result.weights;
    summary = result.summary;
    source = "heuristic";
  }

  const ranked = scoreModels(metrics, weights);
  const top = ranked[0];
  const runnerUp = ranked[1];
  const topMeta = MODEL_META[top.model];
  const topMetrics = metrics[top.model];
  const gap = runnerUp && runnerUp.score > 0 ? Math.round(((top.score - runnerUp.score) / runnerUp.score) * 100) : 0;

  const rationale = `${topMeta.label} scores highest for this project (${top.score.toFixed(1)}/100)${
    runnerUp ? `, ${gap}% ahead of ${MODEL_META[runnerUp.model].label}` : ""
  } — driven by ${Math.round(topMetrics.tokensPerSec)} tok/s throughput, $${topMetrics.costPer1M.toFixed(
    2,
  )}/1M token cost, and quality/reasoning scores of ${topMetrics.quality.toFixed(1)}/${topMetrics.reasoning.toFixed(
    1,
  )}.`;

  const result: RecommendationResult = {
    weights,
    summary,
    source,
    recommended: top.model,
    rationale,
    ranked,
  };

  return NextResponse.json(result);
}
