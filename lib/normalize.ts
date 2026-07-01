import type { BenchmarkMetrics, ModelId } from "@/lib/types";

export interface RadarAxisRow {
  metric: string;
  [modelId: string]: string | number;
}

/**
 * Normalizes raw metrics onto a comparable 0-100 scale per axis, for the
 * radar chart. Speed/quality/reasoning are "higher is better" (scaled
 * against the max in the current set); cost is inverted so cheaper scores
 * higher.
 */
export function buildRadarData(metrics: Record<ModelId, BenchmarkMetrics>): RadarAxisRow[] {
  const entries = Object.entries(metrics) as [ModelId, BenchmarkMetrics][];
  const maxSpeed = Math.max(...entries.map(([, m]) => m.tokensPerSec), 1);
  const maxCost = Math.max(...entries.map(([, m]) => m.costPer1M), 0.01);
  const minCost = Math.min(...entries.map(([, m]) => m.costPer1M));

  const speedRow: RadarAxisRow = { metric: "Speed" };
  const costRow: RadarAxisRow = { metric: "Affordability" };
  const qualityRow: RadarAxisRow = { metric: "Quality" };
  const reasoningRow: RadarAxisRow = { metric: "Reasoning" };

  for (const [id, m] of entries) {
    speedRow[id] = Math.round((m.tokensPerSec / maxSpeed) * 100);
    const costSpread = maxCost - minCost || 1;
    costRow[id] = Math.round(100 - ((m.costPer1M - minCost) / costSpread) * 80);
    qualityRow[id] = Math.round(m.quality * 10);
    reasoningRow[id] = Math.round(m.reasoning * 10);
  }

  return [speedRow, costRow, qualityRow, reasoningRow];
}
