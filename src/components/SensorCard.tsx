import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SensorCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  range: string;
  status: "safe" | "unsafe" | "warning";
  trend?: number[];
}

export function SensorCard({ icon: Icon, label, value, unit, range, status, trend }: SensorCardProps) {
  const statusColors = {
    safe: "text-safe bg-safe/10 border-safe/30",
    unsafe: "text-unsafe bg-unsafe/10 border-unsafe/30",
    warning: "text-warning bg-warning/10 border-warning/30",
  };

  return (
    <Card className="p-5 bg-card border-border/60 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/70">{range}</p>
          </div>
        </div>
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border", statusColors[status])}>
          {status}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold text-foreground tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {trend && (
        <div className="mt-4 flex items-end gap-1 h-10">
          {trend.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/30 rounded-sm transition-all"
              style={{ height: `${v}%` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
