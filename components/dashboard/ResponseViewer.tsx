"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MODEL_META } from "@/data/seed-benchmarks";
import type { ModelId, PromptResult } from "@/lib/types";
import { formatCost, formatLatency, formatScore } from "@/lib/format";

interface ResponseViewerProps {
  promptResultsByModel: Partial<Record<ModelId, PromptResult[]>>;
}

const ALL_MODELS = Object.keys(MODEL_META) as ModelId[];

export function ResponseViewer({ promptResultsByModel }: ResponseViewerProps) {
  const [activeModel, setActiveModel] = useState<ModelId>("gpt");

  return (
    <Card className="glass-card ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle>Live Responses</CardTitle>
        <CardDescription>Actual model output and judge scoring from the last live run.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeModel} onValueChange={(v) => setActiveModel(v as ModelId)}>
          <TabsList>
            {ALL_MODELS.map((id) => (
              <TabsTrigger key={id} value={id} style={{ color: MODEL_META[id].color }}>
                {MODEL_META[id].label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ALL_MODELS.map((id) => {
            const results = promptResultsByModel[id];
            return (
              <TabsContent key={id} value={id} className="mt-4">
                {!results || results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Run a live comparison to see {MODEL_META[id].label}&apos;s real responses here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {results.map((r) => (
                      <div key={r.promptId} className="rounded-lg border border-border p-3">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {r.category}
                          </Badge>
                          {r.error ? (
                            <Badge variant="destructive">error: {r.error}</Badge>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatLatency(r.latencyMs)} · {formatCost(r.cost)} · Q{formatScore(r.quality)} / R
                                {formatScore(r.reasoning)}
                              </span>
                            </>
                          )}
                        </div>
                        {r.error ? null : (
                          <>
                            <p className="whitespace-pre-wrap text-sm text-foreground/90">{r.response}</p>
                            {r.judgeRationale ? (
                              <p className="mt-2 text-xs italic text-muted-foreground">
                                Judge: {r.judgeRationale}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
