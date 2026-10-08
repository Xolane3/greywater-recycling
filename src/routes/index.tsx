import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Droplet, MapPin, CheckCircle2, AlertCircle, WifiOff, Recycle, Leaf, Activity,
  Building2, Users, ShieldCheck, HardHat, BarChart3, Gauge,
} from "lucide-react";
import { NotificationsPanel, type AppNotification } from "@/components/NotificationsPanel";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BRANCHES, PURCHASERS, branchesOfPurchaser, getPurchaser, totals, type Branch } from "@/lib/branches";
import { roleLabel, useSession, visibleBranches, type DemoUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Control Centre — Amanzi Mpilo" },
      { name: "description", content: "Role-based greywater recycling control centre for site operators, system purchasers and administrators." },
      { property: "og:title", content: "Control Centre — Amanzi Mpilo" },
      { property: "og:description", content: "Track litres recycled and fresh water saved across every campus branch." },
    ],
  }),
  component: HomePage,
});

const statusMeta = {
  healthy: { label: "Healthy", icon: CheckCircle2, className: "text-safe", dot: "bg-safe" },
  attention: { label: "Needs attention", icon: AlertCircle, className: "text-[color:var(--warning)]", dot: "bg-[color:var(--warning)]" },
  offline: { label: "Offline", icon: WifiOff, className: "text-unsafe", dot: "bg-unsafe" },
} as const;

function StatusPill({ status }: { status: Branch["status"] }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={cn("w-2 h-2 rounded-full", meta.dot, status !== "offline" && "animate-pulse-glow")} />
      <Icon className={cn("w-3.5 h-3.5", meta.className)} />
      <span className={meta.className}>{meta.label}</span>
    </span>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Recycle; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5 border-border">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</p>
      <p className="text-3xl font-bold mt-1.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { user, ready } = useSession();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", type: "info", title: "Welcome back", message: "Your live sensor feeds are streaming.", time: "Just now", read: false },
    { id: "2", type: "alert", title: "UJ — Auckland Park offline", message: "No sensor data received for 3 hours.", time: "3h ago", read: false },
  ]);
  const markRead = (id: string) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));

  if (!ready || !user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const scoped = visibleBranches(user);
  const t = totals(scoped);
  const company = user.purchaserId ? getPurchaser(user.purchaserId)?.company : undefined;

  const subtitle =
    user.role === "admin"
      ? "Platform oversight • all purchasers"
      : user.role === "purchaser"
        ? `${company} • ${scoped.length} branches owned`
        : `${company} • ${scoped.length} assigned site${scoped.length === 1 ? "" : "s"}`;

  const RoleIcon = user.role === "admin" ? ShieldCheck : user.role === "purchaser" ? Building2 : HardHat;

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-water)" }}>
            <Droplet className="w-6 h-6 text-white" fill="white" fillOpacity={0.3} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Amanzi Mpilo</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="secondary" className="gap-1 ml-1 hidden sm:inline-flex">
            <RoleIcon className="w-3 h-3" />{roleLabel[user.role]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsPanel notifications={notifications} onMarkRead={markRead} onClearAll={() => setNotifications([])} />
          <ProfileMenu />
        </div>
      </header>

      {user.role === "admin" ? (
        <AdminView />
      ) : user.role === "purchaser" ? (
        <PurchaserView user={user} branches={scoped} t={t} />
      ) : (
        <OperatorView branches={scoped} t={t} />
      )}

      <footer className="text-center text-xs text-muted-foreground py-8 mt-6">
        Amanzi Mpilo • ESP32 + pH + turbidity sensors • Data shown is simulated
      </footer>
    </div>
  );
}

/* ---------------- Administrator ---------------- */

function AdminView() {
  const all = totals(BRANCHES);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Users} label="System purchasers" value={String(PURCHASERS.length)} sub="Companies using Amanzi Mpilo" />
        <Kpi icon={Building2} label="Branches monitored" value={String(BRANCHES.length)} sub={`${all.online}/${all.systems} systems online`} />
        <Kpi icon={Recycle} label="Recycled today" value={`${all.recycled.toLocaleString("en-US")} L`} sub="Across the whole platform" />
        <Kpi icon={Leaf} label="Fresh water saved" value={`${all.saved.toLocaleString("en-US")} L`} sub="Today, all purchasers" />
      </div>

      <Card className="border-border mb-6 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-lg font-semibold">System purchasers</h2>
          <p className="text-sm text-muted-foreground">Every company on the platform and how much water they save.</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Primary contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Systems online</TableHead>
                <TableHead className="text-right">Recycled today</TableHead>
                <TableHead className="text-right">Saved today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PURCHASERS.map((p) => {
                const list = branchesOfPurchaser(p.id);
                const pt = totals(list);
                const pct = pt.systems ? (pt.online / pt.systems) * 100 : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.company}</p>
                      <p className="text-xs text-muted-foreground">Client since {p.since}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{p.contact}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.plan}</Badge></TableCell>
                    <TableCell className="text-sm">{list.length}</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 w-20" />
                        <span className="text-xs text-muted-foreground">{pt.online}/{pt.systems}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{pt.recycled.toLocaleString("en-US")} L</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{pt.saved.toLocaleString("en-US")} L</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <BranchTable branches={BRANCHES} title="All branches" description="Every monitored site across all purchasers." showOwner />
    </>
  );
}

/* ---------------- Purchaser ---------------- */

function PurchaserView({ user, branches, t }: { user: DemoUser; branches: Branch[]; t: ReturnType<typeof totals> }) {
  const p = getPurchaser(user.purchaserId);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Building2} label="Branches you own" value={String(branches.length)} sub={p?.plan ? `${p.plan} plan` : undefined} />
        <Kpi icon={Activity} label="Systems online" value={`${t.online}/${t.systems}`} sub="Live sensor units" />
        <Kpi icon={Recycle} label="Recycled today" value={`${t.recycled.toLocaleString("en-US")} L`} sub="All your branches" />
        <Kpi icon={Leaf} label="Fresh water saved" value={`${t.saved.toLocaleString("en-US")} L`} sub="Today" />
      </div>
      <BranchTable branches={branches} title="Your branches" description="Open a branch to see its live dashboard and reports." />
    </>
  );
}

/* ---------------- Operator ---------------- */

function OperatorView({ branches, t }: { branches: Branch[]; t: ReturnType<typeof totals> }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Kpi icon={Gauge} label="Sites assigned to you" value={String(branches.length)} sub={`${t.online}/${t.systems} systems online`} />
        <Kpi icon={Recycle} label="Recycled today" value={`${t.recycled.toLocaleString("en-US")} L`} sub="Your sites only" />
        <Kpi icon={Leaf} label="Fresh water saved" value={`${t.saved.toLocaleString("en-US")} L`} sub="Today" />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Your sites</h2>
        <p className="text-sm text-muted-foreground">You only see the branches you are assigned to work at.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <Card key={b.id} className="p-5 border-border hover:border-primary hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{b.campus} • {b.city}
                </p>
              </div>
              <StatusPill status={b.status} />
            </div>
            <div className="grid grid-cols-3 gap-3 py-3 border-t border-border text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Systems</p>
                <p className="font-semibold mt-0.5">{b.systemsOnline}/{b.totalSystems}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Recycled</p>
                <p className="font-semibold mt-0.5">{b.recycledToday} L</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Saved</p>
                <p className="font-semibold mt-0.5">{b.savedToday} L</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Link to="/dashboard" search={{ branch: b.id }} className="flex-1">
                <Button size="sm" className="w-full rounded-lg">Open dashboard</Button>
              </Link>
              <Link to="/reports" search={{ branch: b.id }}>
                <Button size="sm" variant="outline" className="rounded-lg gap-1.5"><BarChart3 className="w-4 h-4" />Reports</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------------- Shared branch table ---------------- */

function BranchTable({
  branches, title, description, showOwner,
}: { branches: Branch[]; title: string; description: string; showOwner?: boolean }) {
  return (
    <Card className="border-border overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              {showOwner && <TableHead>Purchaser</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Systems</TableHead>
              <TableHead className="text-right">Recycled today</TableHead>
              <TableHead className="text-right">Saved today</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.campus} • {b.city}</p>
                </TableCell>
                {showOwner && (
                  <TableCell className="text-sm">{getPurchaser(b.purchaserId)?.company}</TableCell>
                )}
                <TableCell><StatusPill status={b.status} /></TableCell>
                <TableCell className="text-sm tabular-nums">{b.systemsOnline}/{b.totalSystems}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{b.recycledToday.toLocaleString("en-US")} L</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{b.savedToday.toLocaleString("en-US")} L</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link to="/dashboard" search={{ branch: b.id }}>
                      <Button size="sm" variant="default" className="rounded-lg">Dashboard</Button>
                    </Link>
                    <Link to="/reports" search={{ branch: b.id }}>
                      <Button size="sm" variant="outline" className="rounded-lg">Reports</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
