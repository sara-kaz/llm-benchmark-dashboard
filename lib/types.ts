export type ModelId = "gpt" | "claude" | "gemini" | "deepseek" | "llama";

export interface ModelMeta {
  id: ModelId;
  label: string;
  vendor: string;
  modelName: string;
  color: string;
  accentClass: string;
}

export interface BenchmarkMetrics {
  /** tokens generated per second */
  tokensPerSec: number;
  /** time to first meaningful response, ms */
  latencyMs: number;
  /** blended $ per 1M tokens (input+output average at typical ratio) */
  costPer1M: number;
  /** 1-10 */
  quality: number;
  /** 1-10 */
  reasoning: number;
}

export interface ModelBenchmark {
  model: ModelId;
  source: "reference" | "live";
  metrics: BenchmarkMetrics;
  /** ISO date the reference numbers were last checked, only for source=reference */
  asOf?: string;
}

export interface EvalPrompt {
  id: string;
  category: "coding" | "math" | "reasoning" | "creative" | "knowledge";
  label: string;
  prompt: string;
}

export interface PromptResult {
  promptId: string;
  category: EvalPrompt["category"];
  response: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  quality: number;
  reasoning: number;
  judgeRationale?: string;
  error?: string;
}

export interface LiveRunResult {
  model: ModelId;
  source: "live" | "reference";
  metrics: BenchmarkMetrics;
  promptResults: PromptResult[];
  error?: string;
}

/** How much a project should prioritize each criterion, 0 (irrelevant) to 1 (critical). */
export interface CriteriaWeights {
  speed: number;
  cost: number;
  quality: number;
  reasoning: number;
}

export interface ModelScore {
  model: ModelId;
  /** weighted composite score, 0-100 */
  score: number;
  /** per-axis normalized score, 0-100, before weighting */
  breakdown: CriteriaWeights;
}

export interface RecommendationResult {
  weights: CriteriaWeights;
  /** one-sentence explanation of what the project needs most, from the LLM or the heuristic fallback */
  summary: string;
  source: "llm" | "heuristic";
  recommended: ModelId;
  /** data-grounded explanation citing the recommended model's actual benchmark numbers */
  rationale: string;
  ranked: ModelScore[];
}
