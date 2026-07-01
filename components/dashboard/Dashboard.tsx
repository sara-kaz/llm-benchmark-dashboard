"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { ModelCard } from "@/components/dashboard/ModelCard";
import { RadarComparison } from "@/components/dashboard/RadarComparison";
import { MetricBarChart } from "@/components/dashboard/MetricBarChart";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { RunComparisonPanel, type RunStatus } from "@/components/dashboard/RunComparisonPanel";
import { ResponseViewer } from "@/components/dashboard/ResponseViewer";
import { RecommendationPanel } from "@/components/dashboard/RecommendationPanel";
import { MODEL_META, SEED_BENCHMARKS, REFERENCE_AS_OF } from "@/data/seed-benchmarks";
import { formatCost, formatTokensPerSec } from "@/lib/format";
import type { BenchmarkMetrics, LiveRunResult, ModelId, PromptResult } from "@/lib/types";

const ALL_MODELS = Object.keys(MODEL_META) as ModelId[];

export function Dashboard() {
  const [liveResults, setLiveResults] = useState<Partial<Record<ModelId, LiveRunResult>>>({});
  const [runStatus, setRunStatus] = useState<Record<ModelId, RunStatus>>(
    Object.fromEntries(ALL_MODELS.map((id) => [id, "idle"])) as Record<ModelId, RunStatus>,
  );
  const [selectedModels, setSelectedModels] = useState<Set<ModelId>>(new Set(ALL_MODELS));
  const [isRunning, setIsRunning] = useState(false);

  const displayMetrics = useMemo(() => {
    const map = {} as Record<ModelId, BenchmarkMetrics>;
    for (const id of ALL_MODELS) {
      const live = liveResults[id];
      const seed = SEED_BENCHMARKS.find((b) => b.model === id)!;
      map[id] = live ? live.metrics : seed.metrics;
    }
    return map;
  }, [liveResults]);

  const displaySource = useMemo(() => {
    const map = {} as Record<ModelId, "reference" | "live">;
    for (const id of ALL_MODELS) {
      map[id] = liveResults[id]?.source ?? "reference";
    }
    return map;
  }, [liveResults]);

  const promptResultsByModel = useMemo(() => {
    const map: Partial<Record<ModelId, PromptResult[]>> = {};
    for (const id of ALL_MODELS) {
      map[id] = liveResults[id]?.promptResults;
    }
    return map;
  }, [liveResults]);

  function toggleModel(model: ModelId) {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  async function runComparison() {
    setIsRunning(true);
    const targets = Array.from(selectedModels);
    setRunStatus((prev) => {
      const next = { ...prev };
      for (const id of targets) next[id] = "running";
      return next;
    });

    await Promise.all(
      targets.map(async (model) => {
        try {
          const res = await fetch("/api/run-comparison", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model }),
          });
          if (!res.ok) throw new Error(`Request failed: ${res.status}`);
          const result: LiveRunResult = await res.json();
          setLiveResults((prev) => ({ ...prev, [model]: result }));
          setRunStatus((prev) => ({
            ...prev,
            [model]: result.source === "live" ? "live" : "fallback",
          }));
        } catch {
          setRunStatus((prev) => ({ ...prev, [model]: "error" }));
        }
      }),
    );

    setIsRunning(false);
  }

  const barCostData = ALL_MODELS.map((id) => ({
    name: MODEL_META[id].label,
    value: displayMetrics[id].costPer1M,
    color: MODEL_META[id].color,
  }));
  const barSpeedData = ALL_MODELS.map((id) => ({
    name: MODEL_META[id].label,
    value: displayMetrics[id].tokensPerSec,
    color: MODEL_META[id].color,
  }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          Reference data as of {REFERENCE_AS_OF} · live runs use real provider APIs
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          LLM Benchmark <span className="text-primary">Dashboard</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Compare GPT, Claude, Gemini, DeepSeek, and Llama head-to-head on speed, cost, quality, and reasoning —
          backed by real API calls and LLM-judge scoring.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ALL_MODELS.map((id) => (
          <ModelCard
            key={id}
            meta={MODEL_META[id]}
            metrics={displayMetrics[id]}
            source={displaySource[id]}
            isRunning={runStatus[id] === "running"}
          />
        ))}
      </section>

      <RecommendationPanel metrics={displayMetrics} />

      <RunComparisonPanel
        selectedModels={selectedModels}
        onToggleModel={toggleModel}
        runStatus={runStatus}
        onRun={runComparison}
        isRunning={isRunning}
      />

      <RadarComparison metrics={displayMetrics} activeModels={ALL_MODELS} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MetricBarChart
          title="Cost"
          description="Blended $ per 1M tokens (lower is cheaper)"
          data={barCostData}
          valueFormatter={formatCost}
        />
        <MetricBarChart
          title="Speed"
          description="Tokens generated per second (higher is faster)"
          data={barSpeedData}
          valueFormatter={formatTokensPerSec}
        />
      </section>

      <LeaderboardTable
        rows={ALL_MODELS.map((id) => ({
          model: id,
          metrics: displayMetrics[id],
          source: displaySource[id],
        }))}
      />

      <ResponseViewer promptResultsByModel={promptResultsByModel} />
    </div>
  );
}
