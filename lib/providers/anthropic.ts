import Anthropic from "@anthropic-ai/sdk";
import type { ModelCallResult } from "@/lib/providers/openaiCompatible";
import { withRetry } from "@/lib/retry";

const MODEL = "claude-sonnet-4-5-20250929";

export async function callClaude(prompt: string): Promise<ModelCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }
  const client = new Anthropic({ apiKey });
  const start = performance.now();
  const message = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  );
  const latencyMs = performance.now() - start;
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return {
    text,
    latencyMs,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
