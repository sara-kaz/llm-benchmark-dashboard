import type { BenchmarkMetrics, CriteriaWeights, ModelId, ModelScore } from "@/lib/types";

/** Used only when the description matches no keyword rule at all. */
const BASELINE_WEIGHTS: CriteriaWeights = { speed: 0.4, cost: 0.4, quality: 0.6, reasoning: 0.5 };

/**
 * Used for axes that no rule touched, when at least one other axis DID match.
 * Kept low so an explicit signal (e.g. "accuracy matters most") isn't drowned
 * out by a model's raw speed/cost dominance on the axes nobody asked about.
 */
const UNMATCHED_FALLBACK = 0.1;

const KEYWORD_RULES: { label: string; pattern: RegExp; weights: Partial<CriteriaWeights> }[] = [
  {
    label: "latency-sensitive",
    pattern: /\b(real-?time|chatbot|customer support|live chat|voice|latency|instant|streaming)\b/i,
    weights: { speed: 0.9 },
  },
  {
    label: "budget-conscious",
    pattern: /\b(budget|cheap|cost|free tier|startup|bootstrapped|low-cost|affordable)\b/i,
    weights: { cost: 0.9 },
  },
  {
    label: "coding-heavy",
    pattern: /\b(code|coding|programming|developer|debug|software|api integration|ide)\b/i,
    weights: { reasoning: 0.85, quality: 0.7 },
  },
  {
    label: "analytical/reasoning-heavy",
    pattern: /\b(math|logic|analysis|research|legal|financial|planning|multi-step|agent|reasoning)\b/i,
    weights: { reasoning: 1 },
  },
  {
    label: "creative",
    pattern: /\b(creative|story|marketing|copywriting|content|blog|brand|writing)\b/i,
    weights: { quality: 0.85 },
  },
  {
    label: "accuracy-critical",
    pattern: /\b(medical|health|diagnosis|clinical|safety-critical|accuracy|compliance)\b/i,
    weights: { quality: 1, reasoning: 0.85 },
  },
  {
    label: "high-volume/scale",
    pattern: /\b(high volume|scale|millions of|batch|bulk|large-scale)\b/i,
    weights: { cost: 0.8, speed: 0.6 },
  },
];

export function heuristicWeights(description: string): { weights: CriteriaWeights; summary: string } {
  const weights: CriteriaWeights = { speed: 0, cost: 0, quality: 0, reasoning: 0 };
  const touched = new Set<keyof CriteriaWeights>();
  const matchedLabels: string[] = [];

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(description)) {
      matchedLabels.push(rule.label);
      for (const key of Object.keys(rule.weights) as (keyof CriteriaWeights)[]) {
        weights[key] = Math.max(weights[key], rule.weights[key]!);
        touched.add(key);
      }
    }
  }

  for (const key of Object.keys(weights) as (keyof CriteriaWeights)[]) {
    if (!touched.has(key)) {
      weights[key] = touched.size > 0 ? UNMATCHED_FALLBACK : BASELINE_WEIGHTS[key];
    }
  }

  const summary = matchedLabels.length
    ? `Detected this project is ${matchedLabels.join(", ")} — weighted the criteria accordingly.`
    : "No strong signal detected in the description, so balanced default weights were used. Mention things like budget, latency needs, or task type (coding, creative, analysis) for a sharper recommendation.";

  return { weights, summary };
}

export function scoreModels(
  metrics: Record<ModelId, BenchmarkMetrics>,
  weights: CriteriaWeights,
): ModelScore[] {
  const entries = Object.entries(metrics) as [ModelId, BenchmarkMetrics][];
  const maxSpeed = Math.max(...entries.map(([, m]) => m.tokensPerSec), 1);
  const maxCost = Math.max(...entries.map(([, m]) => m.costPer1M), 0.01);
  const minCost = Math.min(...entries.map(([, m]) => m.costPer1M));
  const costSpread = maxCost - minCost || 1;
  const totalWeight = weights.speed + weights.cost + weights.quality + weights.reasoning || 1;

  const scored = entries.map(([model, m]) => {
    const breakdown: CriteriaWeights = {
      speed: (m.tokensPerSec / maxSpeed) * 100,
      cost: 100 - ((m.costPer1M - minCost) / costSpread) * 80,
      quality: m.quality * 10,
      reasoning: m.reasoning * 10,
    };
    const score =
      (weights.speed * breakdown.speed +
        weights.cost * breakdown.cost +
        weights.quality * breakdown.quality +
        weights.reasoning * breakdown.reasoning) /
      totalWeight;

    return { model, score: Math.round(score * 10) / 10, breakdown };
  });

  return scored.sort((a, b) => b.score - a.score);
}
