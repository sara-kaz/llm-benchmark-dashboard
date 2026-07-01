"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wand2, Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MODEL_META } from "@/data/seed-benchmarks";
import type { BenchmarkMetrics, ModelId, RecommendationResult } from "@/lib/types";

interface RecommendationPanelProps {
  metrics: Record<ModelId, BenchmarkMetrics>;
}

const EXAMPLE = "A real-time customer support chatbot for an e-commerce site, tight startup budget.";

export function RecommendationPanel({ metrics }: RecommendationPanelProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, metrics }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: RecommendationResult = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't generate a recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const topMeta = result ? MODEL_META[result.recommended] : null;

  return (
    <Card
      className="glass-card relative overflow-hidden ring-1 ring-primary/20"
      style={topMeta ? { ["--accent" as string]: topMeta.color } : undefined}
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="size-5 text-primary" />
          Which model should you use?
        </CardTitle>
        <CardDescription>
          Describe your project and get a data-grounded recommendation from the benchmark numbers above —
          weighted for what your project actually needs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`e.g. "${EXAMPLE}"`}
          rows={3}
          className="resize-none"
        />
        <div>
          <Button onClick={handleSubmit} disabled={loading || !description.trim()} className="gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Analyzing…" : "Get Recommendation"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <AnimatePresence mode="wait">
          {result && topMeta ? (
            <motion.div
              key={result.recommended}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 rounded-xl border border-border p-4"
              style={{ boxShadow: `0 0 0 1px color-mix(in oklch, ${topMeta.color} 30%, transparent)` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Bot className="size-4" style={{ color: topMeta.color }} />
                <span className="text-sm text-muted-foreground">Recommended:</span>
                <span className="text-xl font-semibold" style={{ color: topMeta.color }}>
                  {topMeta.label}
                </span>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {result.source === "llm" ? "AI-assessed" : "Rule-based"}
                </Badge>
              </div>

              <p className="text-sm text-foreground/90">{result.rationale}</p>
              <p className="text-xs italic text-muted-foreground">{result.summary}</p>

              <div className="flex flex-col gap-2 pt-2">
                {result.ranked.map((entry) => {
                  const meta = MODEL_META[entry.model];
                  return (
                    <div key={entry.model} className="flex items-center gap-3">
                      <span
                        className="w-20 shrink-0 text-xs font-medium"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(entry.score, 2)}%`, background: meta.color }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {entry.score.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
