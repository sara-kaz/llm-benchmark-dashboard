"use client";

import { CheckCircle2, Loader2, Play, XCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MODEL_META } from "@/data/seed-benchmarks";
import type { ModelId } from "@/lib/types";
import { EVAL_SUITE } from "@/data/eval-suite";

export type RunStatus = "idle" | "running" | "live" | "fallback" | "error";

interface RunComparisonPanelProps {
  selectedModels: Set<ModelId>;
  onToggleModel: (model: ModelId) => void;
  runStatus: Record<ModelId, RunStatus>;
  onRun: () => void;
  isRunning: boolean;
}

const ALL_MODELS = Object.keys(MODEL_META) as ModelId[];

export function RunComparisonPanel({
  selectedModels,
  onToggleModel,
  runStatus,
  onRun,
  isRunning,
}: RunComparisonPanelProps) {
  return (
    <Card className="glass-card ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle>Run Live Comparison</CardTitle>
        <CardDescription>
          Sends {EVAL_SUITE.length} fixed prompts (coding, math, reasoning, creative, knowledge) to each selected
          model, measures real latency &amp; cost, and scores quality/reasoning with an LLM judge. Models without a
          configured API key automatically fall back to reference data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          {ALL_MODELS.map((id) => {
            const meta = MODEL_META[id];
            const status = runStatus[id];
            return (
              <label
                key={id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={selectedModels.has(id)}
                  onCheckedChange={() => onToggleModel(id)}
                  disabled={isRunning}
                />
                <span style={{ color: meta.color }} className="font-medium">
                  {meta.label}
                </span>
                <StatusIcon status={status} />
              </label>
            );
          })}
        </div>
        <div>
          <Button onClick={onRun} disabled={isRunning || selectedModels.size === 0} className="gap-2">
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {isRunning ? "Running comparison…" : "Run Live Comparison"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status?: RunStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="size-3.5 animate-spin text-muted-foreground" />;
    case "live":
      return <CheckCircle2 className="size-3.5 text-emerald-400" />;
    case "fallback":
      return <CheckCircle2 className="size-3.5 text-amber-400" />;
    case "error":
      return <XCircle className="size-3.5 text-destructive" />;
    default:
      return <Circle className="size-3 text-muted-foreground/30" />;
  }
}
