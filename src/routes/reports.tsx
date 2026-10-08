import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Droplet, Recycle, Leaf, TrendingUp, Sprout, Toilet, Droplets, Building2 } from "lucide-react";
import { getBranch } from "@/lib/branches";

const searchSchema = z.object({ branch: z.string().optional() });

export const Route = createFileRoute("/reports")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Reports — Amanzi Mpilo" },
      { name: "description", content: "Daily, monthly and yearly water recycling reports." },
    ],
  }),
  component: ReportsPage,
});

type Period = "daily" | "monthly" | "yearly";

const datasets: Record<Period, { label: string; recycled: number; saved: number }[]> = {
  daily: [
    { label: "Mon", recycled: 168, saved: 124 },
    { label: "Tue", recycled: 142, saved: 110 },
    { label: "Wed", recycled: 195, saved: 150 },
    { label: "Thu", recycled: 178, saved: 138 },
    { label: "Fri", recycled: 210, saved: 170 },
    { label: "Sat", recycled: 230, saved: 180 },
    { label: "Sun", recycled: 161, saved: 90 },
  ],
  monthly: [
    { label: "Jan", recycled: 4820, saved: 3650 },
    { label: "Feb", recycled: 4410, saved: 3320 },
    { label: "Mar", recycled: 5210, saved: 3980 },
    { label: "Apr", recycled: 4980, saved: 3760 },
    { label: "May", recycled: 5640, saved: 4280 },
    { label: "Jun", recycled: 5320, saved: 4020 },
    { label: "Jul", recycled: 5980, saved: 4510 },
    { label: "Aug", recycled: 6120, saved: 4630 },
    { label: "Sep", recycled: 5780, saved: 4380 },
    { label: "Oct", recycled: 5440, saved: 4110 },
    { label: "Nov", recycled: 5860, saved: 4440 },
    { label: "Dec", recycled: 6210, saved: 4720 },
  ],
  yearly: [
    { label: "2021", recycled: 38200, saved: 28900 },
    { label: "2022", recycled: 52400, saved: 39600 },
    { label: "2023", recycled: 61800, saved: 46700 },
    { label: "2024", recycled: 68300, saved: 51800 },
    { label: "2025", recycled: 74100, saved: 56200 },
  ],
};

const breakdown = [
  { icon: Sprout, label: "Garden irrigation", pct: 48 },
  { icon: Toilet, label: "Toilet flushing", pct: 32 },
  { icon: Droplets, label: "Outdoor cleaning", pct: 20 },
];

function ReportsPage() {
  const { branch: branchId } = Route.useSearch();
  const branch = getBranch(branchId);
  const [period, setPeriod] = useState<Period>("daily");

  const data = datasets[period];
  const max = Math.max(...data.map((d) => d.recycled));
  const totalRecycled = data.reduce((s, d) => s + d.recycled, 0);
  const totalSaved = data.reduce((s, d) => s + d.saved, 0);
  const unsafeBlocked = Math.round(totalRecycled * 0.25);
  const buckets = data.length;

  const periodLabel = period === "daily" ? "This week" : period === "monthly" ? "This year (by month)" : "All years";
  const avgLabel = period === "daily" ? "L recycled / day" : period === "monthly" ? "L recycled / month" : "L recycled / year";

  const breakdownWithL = breakdown.map((b) => ({ ...b, litres: Math.round((totalRecycled * b.pct) / 100) }));

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" search={{ branch: branch.id }}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">Water Reports</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{branch.name} • {branch.city}</p>
          </div>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5">
            <Building2 className="w-4 h-4" />
            Switch branch
          </Button>
        </Link>
      </header>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value={period} className="mt-6 space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border">
              <Recycle className="w-6 h-6 text-safe mb-3" />
              <p className="text-xs text-muted-foreground">Water Recycled</p>
              <p className="text-3xl font-bold mt-1">{totalRecycled.toLocaleString("en-US")} L</p>
              <p className="text-[11px] text-muted-foreground mt-1">{period} total</p>
            </Card>
            <Card className="p-5 border-border">
              <Leaf className="w-6 h-6 text-safe mb-3" />
              <p className="text-xs text-muted-foreground">Fresh Water Saved</p>
              <p className="text-3xl font-bold mt-1">{totalSaved.toLocaleString("en-US")} L</p>
              <p className="text-[11px] text-muted-foreground mt-1">≈ {Math.round(totalSaved / 8)} showers avoided</p>
            </Card>
            <Card className="p-5 border-border">
              <Droplet className="w-6 h-6 text-unsafe mb-3" />
              <p className="text-xs text-muted-foreground">Unsafe Water Blocked</p>
              <p className="text-3xl font-bold mt-1">{unsafeBlocked.toLocaleString("en-US")} L</p>
              <p className="text-[11px] text-muted-foreground mt-1">stopped from reaching plants</p>
            </Card>
            <Card className="p-5 border-border">
              <TrendingUp className="w-6 h-6 text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-3xl font-bold mt-1">{Math.round(totalRecycled / buckets).toLocaleString("en-US")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{avgLabel}</p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6 border-border">
            <div className="mb-5">
              <h3 className="text-lg font-semibold">{periodLabel}</h3>
              <p className="text-xs text-muted-foreground">Litres recycled vs litres of fresh water saved</p>
            </div>
            <div className="flex items-end justify-between gap-2 h-48 overflow-x-auto">
              {data.map((d) => (
                <div key={d.label} className="flex-1 min-w-[28px] flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    <div
                      className="w-3 rounded-t bg-safe/80 transition-all"
                      style={{ height: `${(d.recycled / max) * 100}%` }}
                      title={`${d.recycled} L recycled`}
                    />
                    <div
                      className="w-3 rounded-t bg-primary/70 transition-all"
                      style={{ height: `${(d.saved / max) * 100}%` }}
                      title={`${d.saved} L saved`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-safe/80" /> Recycled</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/70" /> Saved</span>
            </div>
          </Card>

          {/* Breakdown */}
          <Card className="p-6 border-border">
            <div className="mb-5">
              <h3 className="text-lg font-semibold">Where the recycled water went</h3>
              <p className="text-xs text-muted-foreground">Distribution across reuse points</p>
            </div>
            <div className="space-y-4">
              {breakdownWithL.map(({ icon: Icon, label, litres, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-safe" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{litres.toLocaleString("en-US")} L • {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-safe to-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Amanzi Mpilo POC • Figures shown are simulated for demo
      </footer>
    </div>
  );
}
