"use client";

import { motion } from "framer-motion";
import { Loader2, Radio, History } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ModelMeta } from "@/lib/types";
import { formatCost, formatLatency, formatScore, formatTokensPerSec } from "@/lib/format";

interface ModelCardProps {
  meta: ModelMeta;
  metrics: {
    tokensPerSec: number;
    latencyMs: number;
    costPer1M: number;
    quality: number;
    reasoning: number;
  };
  source: "reference" | "live";
  isRunning?: boolean;
}

export function ModelCard({ meta, metrics, source, isRunning }: ModelCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="glass-card relative overflow-hidden ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_0_0_1px_var(--accent),0_8px_24px_-8px_var(--accent)]"
        style={{ ["--accent" as string]: meta.color }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: meta.color }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{meta.vendor}</p>
              <h3 className="text-lg font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </h3>
            </div>
            {isRunning ? (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Running
              </Badge>
            ) : source === "live" ? (
              <Badge variant="secondary" className="gap-1 text-emerald-400">
                <Radio className="size-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <History className="size-3" />
                Reference
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-1">
          <Stat label="Speed" value={formatTokensPerSec(metrics.tokensPerSec)} />
          <Stat label="Latency" value={formatLatency(metrics.latencyMs)} />
          <Stat label="Cost / 1M tok" value={formatCost(metrics.costPer1M)} />
          <Stat
            label="Quality / Reasoning"
            value={`${formatScore(metrics.quality)} / ${formatScore(metrics.reasoning)}`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
