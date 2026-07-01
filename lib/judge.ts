import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/json";

const JUDGE_MODEL = "claude-sonnet-4-5-20250929";

export interface JudgeScore {
  quality: number;
  reasoning: number;
  rationale: string;
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

export async function judgeResponse(
  originalPrompt: string,
  category: string,
  modelResponse: string,
): Promise<JudgeScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }
  if (!modelResponse.trim()) {
    return { quality: 1, reasoning: 1, rationale: "Empty response." };
  }

  const client = new Anthropic({ apiKey });
  const rubricPrompt = `You are an impartial evaluator grading an AI model's response to a benchmark task in the "${category}" category.

TASK GIVEN TO THE MODEL:
${originalPrompt}

MODEL'S RESPONSE:
${modelResponse}

Score the response on two axes, each from 1 (very poor) to 10 (excellent):
- "quality": correctness, clarity, completeness of the response.
- "reasoning": how sound and well-explained the underlying logic/steps are (for creative tasks, judge coherence and craft instead).

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"quality": <number>, "reasoning": <number>, "rationale": "<one sentence>"}`;

  const message = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 200,
    messages: [{ role: "user", content: rubricPrompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = extractJson<{ quality?: unknown; reasoning?: unknown; rationale?: unknown }>(text);

  return {
    quality: clampScore(parsed.quality),
    reasoning: clampScore(parsed.reasoning),
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
  };
}
