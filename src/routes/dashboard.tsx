import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Droplet, Activity, Zap, Wifi, Clock, ShieldCheck, ShieldAlert, RefreshCw, BarChart3, AlertTriangle, ArrowLeft, Building2, SlidersHorizontal, Trash2, Sprout, Toilet, WashingMachine, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TankIcon } from "@/components/TankIcon";
import { SensorCard } from "@/components/SensorCard";
import { NotificationsPanel, type AppNotification } from "@/components/NotificationsPanel";
import { ProfileMenu } from "@/components/ProfileMenu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBranch } from "@/lib/branches";

const PH_MIN = 6.5;
const PH_MAX = 8.5;
const TURBIDITY_MAX = 300;

function evaluateWaterCapabilities(ph: number, turbidity: number) {
  const phSafe = ph >= PH_MIN && ph <= PH_MAX;
  const turbSafe = turbidity <= TURBIDITY_MAX;
  const basicSafe = phSafe && turbSafe;

  return {
    safe: basicSafe,
    phSafe,
    turbSafe,
    // Specific thresholds per non-potable reuse type:
    canToilet: basicSafe,
    canIrrigation: basicSafe && turbidity <= 250,
    canOutdoorCleaning: basicSafe && turbidity <= 200,
    canLaundry: basicSafe && turbidity <= 100 && ph >= 6.8 && ph <= 7.8,
  };
}

function getApprovedUsesList(capabilities: ReturnType<typeof evaluateWaterCapabilities>): string {
  const list: string[] = [];
  if (capabilities.canToilet) list.push("Toilet Flushing");
  if (capabilities.canIrrigation) list.push("Garden Irrigation");
  if (capabilities.canOutdoorCleaning) list.push("Outdoor Cleaning");
  if (capabilities.canLaundry) list.push("Laundry Washing");

  return list.length > 0 ? list.join(", ") : "None (Requires Treatment)";
}

function getRecommendations(ph: number, turbidity: number) {
  const recs: string[] = [];
  if (ph < PH_MIN) {
    recs.push("Add an alkaline buffer (e.g., sodium bicarbonate) to raise pH levels.");
  } else if (ph > PH_MAX) {
    recs.push("Add a mild acid corrector or dilute with freshwater to lower alkalinity.");
  }
  if (turbidity > TURBIDITY_MAX) {
    recs.push("Activate backwash filter cycle or add a bio-coagulant to drop suspended solids.");
  }
  return recs;
}

function explainUnsafe(ph: number, turbidity: number) {
  const reasons: string[] = [];
  if (ph < PH_MIN) reasons.push(`pH is too acidic (${ph.toFixed(1)}) — likely soap, vinegar or chemical residue.`);
  else if (ph > PH_MAX) reasons.push(`pH is too alkaline (${ph.toFixed(1)}) — likely heavy detergent or bleach.`);
  if (turbidity > TURBIDITY_MAX) reasons.push(`Water is too cloudy (${turbidity} NTU vs max ${TURBIDITY_MAX}) — too much dirt, oil or food waste.`);
  return reasons;
}

const searchSchema = z.object({ branch: z.string().optional() });

export const Route = createFileRoute("/dashboard")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Dashboard — Amanzi Mpilo" },
      { name: "description", content: "Real-time greywater quality monitoring with safe reuse automation." },
    ],
  }),
  component: Dashboard,
});

const scenarios = [
  { ph: 7.1, turbidity: 85, label: "Clean greywater (All Reuse Safe)" },
  { ph: 7.3, turbidity: 120, label: "Light shower runoff (Toilet, Irrigation & Car Wash Safe)" },
  { ph: 6.9, turbidity: 95, label: "Sink rinse (Toilet & Laundry Safe)" },
  { ph: 10.2, turbidity: 480, label: "Soapy / contaminated (Unsafe)" },
  { ph: 7.0, turbidity: 70, label: "Filtered greywater (Optimal Quality)" },
];

function Dashboard() {
  const { branch: branchId } = Route.useSearch();
  const branch = getBranch(branchId);
  const isOffline = branch.status === "offline";

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reading = scenarios[scenarioIdx];
  const capabilities = evaluateWaterCapabilities(reading.ph, reading.turbidity);
  const { safe, phSafe, turbSafe } = capabilities;

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [phTrend, setPhTrend] = useState<number[]>([40, 55, 48, 60, 52, 58, 50, 62]);
  const [turbTrend, setTurbTrend] = useState<number[]>([30, 35, 28, 42, 38, 45, 40, 35]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", type: "info", title: "System online", message: `${branch.name} ESP32 streaming sensor data.`, time: "Just now", read: false },
    { id: "2", type: "success", title: "Daily report", message: "Greywater stayed within safe range for 22h yesterday.", time: "2h ago", read: false },
  ]);

  useEffect(() => {
    if (isOffline || isPaused) return;
    const id = setInterval(() => {
      setScenarioIdx((i) => (i + 1) % scenarios.length);
      setLastUpdate(new Date());
      setPhTrend((t) => [...t.slice(1), 30 + Math.random() * 60]);
      setTurbTrend((t) => [...t.slice(1), 25 + Math.random() * 60]);
    }, 6000);
    return () => clearInterval(id);
  }, [isOffline, isPaused]);

  useEffect(() => {
    if (!safe && !isOffline) {
      setIsPaused(true);

      const recs = getRecommendations(reading.ph, reading.turbidity);
      const id = crypto.randomUUID();
      setNotifications((prev) => [
        { 
          id, 
          type: "alert" as const, 
          title: "UNSAFE WATER DETECTED — SYSTEM PAUSED", 
          message: recs.join(" "), 
          time: "Just now", 
          read: false 
        },
        ...prev,
      ].slice(0, 20));

      toast.error("UNSAFE WATER DETECTED — SYSTEM PAUSED", {
        description: "Distribution halted automatically. Select an action below to proceed.",
        duration: Infinity,
      });
    } else if (safe && !isOffline) {
      const approvedText = getApprovedUsesList(capabilities);
      const id = crypto.randomUUID();
      setNotifications((prev) => [
        { 
          id, 
          type: "success" as const, 
          title: "Water Ready for Non-Potable Reuse", 
          message: `Quality checks passed. Approved reuse destinations: ${approvedText}.`, 
          time: "Just now", 
          read: false 
        },
        ...prev,
      ].slice(0, 20));
    }
  }, [scenarioIdx]); // eslint-disable-line

  const handleRetryTreat = () => {
    toast.dismiss();
    toast.success("Treatment retry initiated", { description: "Re-running filtration cycle..." });
    setScenarioIdx(0);
    setIsPaused(false);
    setLastUpdate(new Date());
  };

  const handleDrainSewage = () => {
    toast.dismiss();
    toast.warning("Water drained to sewage", { description: "Contaminated batch safely flushed." });
    setScenarioIdx(0);
    setIsPaused(false);
    setLastUpdate(new Date());
  };

  const markRead = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const clearAll = () => setNotifications([]);

  const recommendations = getRecommendations(reading.ph, reading.turbidity);
  const approvedUsesText = getApprovedUsesList(capabilities);

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-water)" }}>
            <Droplet className="w-6 h-6 text-white" fill="white" fillOpacity={0.3} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Amanzi Mpilo</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{branch.name} • {branch.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs">
            <span className={cn("w-2 h-2 rounded-full", isOffline ? "bg-muted-foreground" : isPaused ? "bg-amber-500 animate-pulse" : "bg-safe animate-pulse-glow")} />
            <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{isOffline ? "ESP32 Offline" : isPaused ? "System Paused" : "ESP32 Online"}</span>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Switch branch</span>
            </Button>
          </Link>
          <Link to="/reports" search={{ branch: branch.id }}>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
          </Link>
          <NotificationsPanel notifications={notifications} onMarkRead={markRead} onClearAll={clearAll} />
          <ProfileMenu />
        </div>
      </header>

      {isOffline ? (
        <Card className="p-8 mb-6 border-border text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-unsafe mb-3" />
          <h2 className="text-xl font-semibold mb-1">This branch is offline</h2>
          <p className="text-sm text-muted-foreground">No sensor data is being received from {branch.name}. Check the ESP32 power and Wi-Fi.</p>
        </Card>
      ) : (
        <Card className="p-6 mb-6 border-0 relative overflow-hidden" style={{ background: safe ? "var(--gradient-safe)" : "var(--gradient-unsafe)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur">
                {safe ? <ShieldCheck className="w-8 h-8 text-white" /> : <ShieldAlert className="w-8 h-8 text-white" />}
              </div>
              <div className="text-white">
                <p className="text-xs uppercase tracking-widest opacity-80">Water Status</p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {safe ? "Safe for Non-Potable Reuse" : "Unsafe — System Paused"}
                </h2>
                <p className="text-sm opacity-90 mt-1">Sample: {reading.label}</p>
                {safe && (
                  <p className="text-xs font-semibold bg-white/20 backdrop-blur px-2.5 py-1 rounded-lg mt-2 inline-block">
                    ✓ Safe for: {approvedUsesText}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-xs">
              <Clock className="w-4 h-4" />
              <span suppressHydrationWarning>Updated {lastUpdate.toLocaleTimeString()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-8 w-8 text-white hover:bg-white/15"
                onClick={() => { setScenarioIdx((i) => (i + 1) % scenarios.length); setLastUpdate(new Date()); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!safe && (
            <div className="mt-4 p-4 rounded-xl bg-black/30 backdrop-blur text-white text-xs space-y-3 relative z-10 border border-white/20 shadow-2xl">
              <p className="font-bold flex items-center gap-1.5 text-sm text-amber-300">
                <AlertTriangle className="w-4 h-4" /> Automatic Action Required — System Paused
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-white/90">Why this water isn't safe:</p>
                {explainUnsafe(reading.ph, reading.turbidity).map((r, i) => (
                  <p key={i} className="opacity-90 pl-3">• {r}</p>
                ))}
              </div>
              <div className="space-y-1 pt-1">
                <p className="font-semibold text-white/90">Recommendations:</p>
                {recommendations.map((rec, i) => (
                  <p key={i} className="opacity-90 pl-3">• {rec}</p>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" variant="secondary" className="gap-1.5 text-xs bg-white text-slate-900 hover:bg-slate-100 font-bold" onClick={handleRetryTreat}>
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Try Again (Re-treat Water)
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleDrainSewage}>
                  <Trash2 className="w-3.5 h-3.5" /> Drain to Sewage
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {!isOffline && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <SensorCard
              icon={Activity}
              label="pH Level"
              value={reading.ph.toFixed(1)}
              unit="pH"
              range={`Safe range ${PH_MIN}–${PH_MAX}`}
              status={phSafe ? "safe" : "unsafe"}
              trend={phTrend}
            />
            <SensorCard
              icon={Droplet}
              label="Turbidity"
              value={String(reading.turbidity)}
              unit="NTU"
              range={`Max ${TURBIDITY_MAX} NTU`}
              status={turbSafe ? "safe" : "unsafe"}
              trend={turbTrend}
            />
          </div>

          <Card className="p-6 mb-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Tank Network</h3>
                <p className="text-xs text-muted-foreground">Visual status across collection & distribution tanks</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
              <TankIcon label="Inlet Tank" safe={true} level={78} role="Catches your used water" description="First collection reservoir for greywater." />
              <TankIcon label="Treatment" safe={safe} level={64} role="Cleans the water" description="Filters and neutralizers active." />
              <TankIcon label="Storage" safe={safe} level={52} role="Holds clean water" description="Ready for non-potable reuse." />
              <TankIcon label="Distribution" safe={safe} level={safe ? 70 : 12} role="Non-potable feed" description="Pipes water to approved destinations." />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <Card className="p-6 bg-card border-border/60">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold">Reuse Destinations</h3>
                    <p className="text-xs text-muted-foreground">Individual green/red status per non-potable reuse requirement</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full", safe ? "bg-safe/15 text-safe" : "bg-unsafe/15 text-unsafe")}>
                    {safe ? "Flow Active" : "Flow Stopped"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Toilet Flushing */}
                  <div className={cn("p-4 rounded-2xl border transition-all", capabilities.canToilet ? "bg-safe/10 border-safe/40 text-foreground" : "bg-unsafe/10 border-unsafe/30 text-muted-foreground")}>
                    <Toilet className={cn("w-7 h-7 mb-2", capabilities.canToilet ? "text-safe" : "text-unsafe")} />
                    <p className="text-xs font-bold">Toilet Flushing</p>
                    <p className={cn("text-[10px] font-semibold mt-0.5", capabilities.canToilet ? "text-safe" : "text-unsafe")}>
                      {capabilities.canToilet ? "Safe for reuse" : "Unsafe"}
                    </p>
                  </div>

                  {/* Garden Irrigation */}
                  <div className={cn("p-4 rounded-2xl border transition-all", capabilities.canIrrigation ? "bg-safe/10 border-safe/40 text-foreground" : "bg-unsafe/10 border-unsafe/30 text-muted-foreground")}>
                    <Sprout className={cn("w-7 h-7 mb-2", capabilities.canIrrigation ? "text-safe" : "text-unsafe")} />
                    <p className="text-xs font-bold">Garden Irrigation</p>
                    <p className={cn("text-[10px] font-semibold mt-0.5", capabilities.canIrrigation ? "text-safe" : "text-unsafe")}>
                      {capabilities.canIrrigation ? "Safe for reuse" : "Unsafe"}
                    </p>
                  </div>

                  {/* Outdoor Cleaning */}
                  <div className={cn("p-4 rounded-2xl border transition-all", capabilities.canOutdoorCleaning ? "bg-safe/10 border-safe/40 text-foreground" : "bg-unsafe/10 border-unsafe/30 text-muted-foreground")}>
                    <Car className={cn("w-7 h-7 mb-2", capabilities.canOutdoorCleaning ? "text-safe" : "text-unsafe")} />
                    <p className="text-xs font-bold">Outdoor Cleaning</p>
                    <p className={cn("text-[10px] font-semibold mt-0.5", capabilities.canOutdoorCleaning ? "text-safe" : "text-unsafe")}>
                      {capabilities.canOutdoorCleaning ? "Safe for reuse" : "Unsafe"}
                    </p>
                  </div>

                  {/* Laundry Washing */}
                  <div className={cn("p-4 rounded-2xl border transition-all", capabilities.canLaundry ? "bg-safe/10 border-safe/40 text-foreground" : "bg-unsafe/10 border-unsafe/30 text-muted-foreground")}>
                    <WashingMachine className={cn("w-7 h-7 mb-2", capabilities.canLaundry ? "text-safe" : "text-unsafe")} />
                    <p className="text-xs font-bold">Laundry Washing</p>
                    <p className={cn("text-[10px] font-semibold mt-0.5", capabilities.canLaundry ? "text-safe" : "text-unsafe")}>
                      {capabilities.canLaundry ? "Safe for reuse" : "Requires <100 NTU"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-1">Actuators</h3>
              <p className="text-xs text-muted-foreground mb-4">Relay & LED state</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60">
                  <div className="flex items-center gap-2.5">
                    <Zap className={cn("w-4 h-4", safe ? "text-safe" : "text-muted-foreground")} />
                    <span className="text-sm">Relay Module</span>
                  </div>
                  <span className={cn("text-xs font-semibold", safe ? "text-safe" : "text-unsafe")}>
                    {safe ? "ACTIVATED" : "DEACTIVATED"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-3 h-3 rounded-full", safe ? "bg-safe shadow-[0_0_12px] shadow-safe" : "bg-muted")} />
                    <span className="text-sm">Green LED</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{safe ? "ON" : "OFF"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-3 h-3 rounded-full", !safe ? "bg-unsafe shadow-[0_0_12px] shadow-unsafe animate-pulse-glow" : "bg-muted")} />
                    <span className="text-sm">Red LED</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{!safe ? "ON" : "OFF"}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <footer className="text-center text-xs text-muted-foreground py-6">
        Amanzi Mpilo POC • ESP32 + pH + Turbidity sensors • Data shown is simulated
      </footer>
    </div>
  );
}