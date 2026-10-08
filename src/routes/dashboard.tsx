import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Droplet, Activity, Zap, Wifi, Clock, ShieldCheck, ShieldAlert, RefreshCw, BarChart3, AlertTriangle, ArrowLeft, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TankIcon } from "@/components/TankIcon";
import { SensorCard } from "@/components/SensorCard";
import { ReuseDestinations } from "@/components/ReuseDestinations";
import { NotificationsPanel, type AppNotification } from "@/components/NotificationsPanel";
import { ProfileMenu } from "@/components/ProfileMenu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBranch } from "@/lib/branches";

const PH_MIN = 6.5;
const PH_MAX = 8.5;
const TURBIDITY_MAX = 300;

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
  { ph: 7.1, turbidity: 85, label: "Clean greywater" },
  { ph: 7.3, turbidity: 120, label: "Light shower runoff" },
  { ph: 6.9, turbidity: 95, label: "Sink rinse" },
  { ph: 10.2, turbidity: 480, label: "Soapy / contaminated" },
  { ph: 7.0, turbidity: 70, label: "Filtered greywater" },
];

function evaluate(ph: number, turbidity: number) {
  const phSafe = ph >= PH_MIN && ph <= PH_MAX;
  const turbSafe = turbidity <= TURBIDITY_MAX;
  return { safe: phSafe && turbSafe, phSafe, turbSafe };
}

function Dashboard() {
  const { branch: branchId } = Route.useSearch();
  const branch = getBranch(branchId);
  const isOffline = branch.status === "offline";

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const reading = scenarios[scenarioIdx];
  const { safe, phSafe, turbSafe } = evaluate(reading.ph, reading.turbidity);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [phTrend, setPhTrend] = useState<number[]>([40, 55, 48, 60, 52, 58, 50, 62]);
  const [turbTrend, setTurbTrend] = useState<number[]>([30, 35, 28, 42, 38, 45, 40, 35]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", type: "info", title: "System online", message: `${branch.name} • ESP32 streaming sensor data.`, time: "Just now", read: false },
    { id: "2", type: "success", title: "Daily report", message: "Greywater stayed within safe range for 22h yesterday.", time: "2h ago", read: false },
  ]);

  useEffect(() => {
    if (isOffline) return;
    const id = setInterval(() => {
      setScenarioIdx((i) => (i + 1) % scenarios.length);
      setLastUpdate(new Date());
      setPhTrend((t) => [...t.slice(1), 30 + Math.random() * 60]);
      setTurbTrend((t) => [...t.slice(1), 25 + Math.random() * 60]);
    }, 6000);
    return () => clearInterval(id);
  }, [isOffline]);

  useEffect(() => {
    if (!safe && !isOffline) {
      const reasons = explainUnsafe(reading.ph, reading.turbidity);
      const why = reasons.join(" ");
      const id = crypto.randomUUID();
      setNotifications((prev) => [
        { id, type: "alert" as const, title: "Unsafe water detected", message: why || "Sensors out of range — relay closed.", time: "Just now", read: false },
        ...prev,
      ].slice(0, 20));
      const toastId = toast.error("Unsafe water — distribution stopped", {
        description: (
          <div className="space-y-1 mt-1">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        ),
        duration: 7000,
        cancel: {
          label: "Cancel",
          onClick: () => toast.dismiss(toastId),
        },
      });
    }
  }, [scenarioIdx]); // eslint-disable-line

  const markRead = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const clearAll = () => setNotifications([]);

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
            <span className={cn("w-2 h-2 rounded-full", isOffline ? "bg-muted-foreground" : "bg-safe animate-pulse-glow")} />
            <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{isOffline ? "ESP32 Offline" : "ESP32 Online"}</span>
          </div>
          <Link to="/" >
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
                <h2 className="text-3xl font-bold">{safe ? "Safe for Reuse" : "Unsafe — Do Not Reuse"}</h2>
                <p className="text-sm opacity-90 mt-1">Sample: {reading.label}</p>
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
            <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur text-white text-xs space-y-1 relative z-10">
              <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Why this water isn't safe:</p>
              {explainUnsafe(reading.ph, reading.turbidity).map((r, i) => (
                <p key={i} className="opacity-95 pl-5">• {r}</p>
              ))}
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
              <TankIcon label="Inlet Tank" safe={true} level={78} role="Catches your used water" description="This is the first stop. Water from your shower, basin and laundry collects here before any cleaning happens." />
              <TankIcon label="Treatment" safe={safe} level={64} role="Cleans the water" description="Filters and sensors check the water here. If it's still dirty, it stays here and won't move forward." />
              <TankIcon label="Storage" safe={safe} level={52} role="Holds clean water" description="Once the water passes the safety check, it rests in this tank until you need it." />
              <TankIcon label="Distribution" safe={safe} level={safe ? 70 : 12} role="Sends water to plants & toilet" description="Pipes the clean water to your garden, toilet flush or outdoor tap. Closes its valve automatically if unsafe." />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <ReuseDestinations safe={safe} />
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
