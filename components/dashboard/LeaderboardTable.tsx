"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODEL_META } from "@/data/seed-benchmarks";
import type { BenchmarkMetrics, ModelId } from "@/lib/types";
import { formatCost, formatLatency, formatScore, formatTokensPerSec } from "@/lib/format";

interface LeaderboardRow {
  model: ModelId;
  metrics: BenchmarkMetrics;
  source: "reference" | "live";
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
}

type SortKey = "tokensPerSec" | "latencyMs" | "costPer1M" | "quality" | "reasoning";

const COLUMNS: { key: SortKey; label: string; higherIsBetter: boolean }[] = [
  { key: "tokensPerSec", label: "Speed", higherIsBetter: true },
  { key: "latencyMs", label: "Latency", higherIsBetter: false },
  { key: "costPer1M", label: "Cost / 1M", higherIsBetter: false },
  { key: "quality", label: "Quality", higherIsBetter: true },
  { key: "reasoning", label: "Reasoning", higherIsBetter: true },
];

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("quality");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const diff = a.metrics[sortKey] - b.metrics[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey, higherIsBetter: boolean) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(higherIsBetter ? "desc" : "asc");
    }
  }

  return (
    <Card className="glass-card ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>Click a column to sort.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.key}>
                  <button
                    onClick={() => toggleSort(col.key, col.higherIsBetter)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-40" />
                    )}
                  </button>
                </TableHead>
              ))}
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const meta = MODEL_META[row.model];
              return (
                <TableRow key={row.model}>
                  <TableCell className="font-medium" style={{ color: meta.color }}>
                    {meta.label}
                  </TableCell>
                  <TableCell className="font-mono">{formatTokensPerSec(row.metrics.tokensPerSec)}</TableCell>
                  <TableCell className="font-mono">{formatLatency(row.metrics.latencyMs)}</TableCell>
                  <TableCell className="font-mono">{formatCost(row.metrics.costPer1M)}</TableCell>
                  <TableCell className="font-mono">{formatScore(row.metrics.quality)}</TableCell>
                  <TableCell className="font-mono">{formatScore(row.metrics.reasoning)}</TableCell>
                  <TableCell>
                    <Badge variant={row.source === "live" ? "secondary" : "outline"} className="text-[10px]">
                      {row.source}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
