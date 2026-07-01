"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODEL_META } from "@/data/seed-benchmarks";
import type { BenchmarkMetrics, ModelId } from "@/lib/types";
import { buildRadarData } from "@/lib/normalize";

interface RadarComparisonProps {
  metrics: Record<ModelId, BenchmarkMetrics>;
  activeModels: ModelId[];
}

export function RadarComparison({ metrics, activeModels }: RadarComparisonProps) {
  const data = buildRadarData(metrics);

  return (
    <Card className="glass-card ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle>Overall Comparison</CardTitle>
        <CardDescription>
          Normalized 0-100 per axis — speed, cost (inverted), quality, and reasoning across all models.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
              />
              {activeModels.map((id) => (
                <Radar
                  key={id}
                  name={MODEL_META[id].label}
                  dataKey={id}
                  stroke={MODEL_META[id].color}
                  fill={MODEL_META[id].color}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
