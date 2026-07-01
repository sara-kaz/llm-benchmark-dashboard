import type { ModelBenchmark, ModelMeta } from "@/lib/types";

export const REFERENCE_AS_OF = "June 2026";

export const MODEL_META: Record<ModelMeta["id"], ModelMeta> = {
  gpt: {
    id: "gpt",
    label: "GPT",
    vendor: "OpenAI",
    modelName: "gpt-4o-mini",
    color: "#10a37f",
    accentClass: "model-gpt",
  },
  claude: {
    id: "claude",
    label: "Claude",
    vendor: "Anthropic",
    modelName: "claude-sonnet-4-5-20250929",
    color: "#d97757",
    accentClass: "model-claude",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    vendor: "Google",
    modelName: "gemini-1.5-flash",
    color: "#4285f4",
    accentClass: "model-gemini",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    vendor: "DeepSeek",
    modelName: "deepseek-chat",
    color: "#6366f1",
    accentClass: "model-deepseek",
  },
  llama: {
    id: "llama",
    label: "Llama",
    vendor: "Meta (via Groq)",
    modelName: "llama-3.3-70b-versatile",
    color: "#0866ff",
    accentClass: "model-llama",
  },
};

/**
 * Illustrative reference numbers approximated from published pricing pages and
 * public throughput/quality leaderboards as of REFERENCE_AS_OF. Used as the
 * always-populated baseline and as a fallback when a live call isn't available.
 */
export const SEED_BENCHMARKS: ModelBenchmark[] = [
  {
    model: "gpt",
    source: "reference",
    asOf: REFERENCE_AS_OF,
    metrics: {
      tokensPerSec: 90,
      latencyMs: 550,
      costPer1M: 2.5,
      quality: 9.0,
      reasoning: 8.7,
    },
  },
  {
    model: "claude",
    source: "reference",
    asOf: REFERENCE_AS_OF,
    metrics: {
      tokensPerSec: 75,
      latencyMs: 600,
      costPer1M: 4.5,
      quality: 9.2,
      reasoning: 9.0,
    },
  },
  {
    model: "gemini",
    source: "reference",
    asOf: REFERENCE_AS_OF,
    metrics: {
      tokensPerSec: 110,
      latencyMs: 500,
      costPer1M: 1.25,
      quality: 8.6,
      reasoning: 8.4,
    },
  },
  {
    model: "deepseek",
    source: "reference",
    asOf: REFERENCE_AS_OF,
    metrics: {
      tokensPerSec: 60,
      latencyMs: 700,
      costPer1M: 0.55,
      quality: 8.3,
      reasoning: 8.8,
    },
  },
  {
    model: "llama",
    source: "reference",
    asOf: REFERENCE_AS_OF,
    metrics: {
      tokensPerSec: 280,
      latencyMs: 250,
      costPer1M: 0.65,
      quality: 8.0,
      reasoning: 7.8,
    },
  },
];
