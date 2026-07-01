export function formatCost(costPer1M: number): string {
  return costPer1M < 1 ? `$${costPer1M.toFixed(3)}` : `$${costPer1M.toFixed(2)}`;
}

export function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

export function formatTokensPerSec(tps: number): string {
  return `${Math.round(tps)} tok/s`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}
