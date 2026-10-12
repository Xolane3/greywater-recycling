import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Droplet, MapPin, ArrowLeft, Building2, HardHat, ShieldCheck, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsPanel, type AppNotification } from "@/components/NotificationsPanel";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BRANCHES, getPurchaser, getBranch, type Branch } from "@/lib/branches";
import { useSession, visibleBranches, roleLabel } from "@/lib/auth";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ branch: z.string().optional() });

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sites Map — Amanzi Mpilo" },
      { name: "description", content: "Interactive map view showing purchaser owned and site operator assigned branches." },
    ],
  }),
  component: SitesMapPage,
});

// Helper to project GPS Lat/Lng onto relative percentage overlay coordinates for South Africa scope
function getGeoPosition(lat: number, lng: number) {
  // Bounding box for South Africa branch extent
  const minLat = -30.5;
  const maxLat = -25.0;
  const minLng = 26.5;
  const maxLng = 31.5;

  const top = ((maxLat - lat) / (maxLat - minLat)) * 100;
  const left = ((lng - minLng) / (maxLng - minLng)) * 100;

  return {
    top: `${Math.max(8, Math.min(92, top))}%`,
    left: `${Math.max(8, Math.min(92, left))}%`,
  };
}

function SitesMapPage() {
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const { branch: branchId } = Route.useSearch();
  const activeBranch = getBranch(branchId);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", type: "info", title: "Map view active", message: "Showing live site locations on map.", time: "Just now", read: false },
    { id: "2", type: "alert", title: "UJ — Auckland Park offline", message: "No sensor data received for 3 hours.", time: "3h ago", read: false },
  ]);

  if (!ready || !user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const assignedBranches = visibleBranches(user);
  const company = user.purchaserId ? getPurchaser(user.purchaserId)?.company : undefined;

  const markRead = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const RoleIcon = user.role === "admin" ? ShieldCheck : user.role === "purchaser" ? Building2 : HardHat;

  // Generate dynamic Google Maps Embed URL centered at active site's exact GPS location
  const mapEmbedUrl = `https://maps.google.com/maps?q=${activeBranch.lat},${activeBranch.lng}&z=11&output=embed`;

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto flex flex-col justify-between">
      <div>
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
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {user.role === "purchaser" ? (
                  <>
                    <Building2 className="w-3 h-3 text-primary" />
                    <span>{company} — {assignedBranches.length} Owned Sites</span>
                  </>
                ) : user.role === "operator" ? (
                  <>
                    <HardHat className="w-3 h-3 text-amber-500" />
                    <span>{company} — {assignedBranches.length} Assigned Sites</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span>All System Sites ({BRANCHES.length})</span>
                  </>
                )}
              </p>
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

        {/* Map Display Card */}
        <Card className="p-5 bg-card border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Exact Branch Map Locations
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing precise GPS positions for {activeBranch.name} ({activeBranch.lat}, {activeBranch.lng}).
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-safe animate-pulse-glow inline-block" />
                <span className="text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-unsafe inline-block" />
                <span className="text-muted-foreground">Offline</span>
              </div>
            </div>
          </div>

          {/* Interactive Google Map Container */}
          <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-border bg-muted">
            <iframe
              title="Exact Branch Location Map"
              src={mapEmbedUrl}
              className="w-full h-full border-0 opacity-90"
              loading="lazy"
            />

            {/* Geo-projected Marker Pins */}
            <div className="absolute inset-0 pointer-events-none">
              {assignedBranches.map((b: Branch) => {
                const offline = b.status === "offline";
                const isSelected = b.id === activeBranch.id;
                const pos = getGeoPosition(b.lat, b.lng);
                const purchaser = getPurchaser(b.purchaserId);

                return (
                  <div
                    key={b.id}
                    style={{ top: pos.top, left: pos.left }}
                    className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group z-10"
                  >
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/dashboard", search: { branch: b.id } })}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-full shadow-2xl transition-all duration-200 transform group-hover:scale-125 focus:outline-none",
                        offline ? "bg-unsafe text-white" : "bg-safe text-white",
                        isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background scale-110"
                      )}
                    >
                      <MapPin className="w-5 h-5 fill-current" />
                    </button>

                    {/* Hover Info Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30">
                      <div className="bg-popover text-popover-foreground border border-border text-xs rounded-xl p-3 shadow-2xl whitespace-nowrap min-w-[190px]">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="font-bold text-sm">{b.name}</span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", offline ? "bg-unsafe/20 text-unsafe" : "bg-safe/20 text-safe")}>
                            {offline ? "Offline" : "Online"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{b.campus} • {b.city}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">GPS: {b.lat}, {b.lng}</p>
                        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Systems:</span>
                          <span className="font-semibold">{b.systemsOnline}/{b.totalSystems} Online</span>
                        </div>
                        {purchaser && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-primary">
                            <Building2 className="w-3 h-3" />
                            <span>{purchaser.company}</span>
                          </div>
                        )}
                      </div>
                      <div className="w-2.5 h-2.5 bg-popover border-r border-b border-border rotate-45 -mt-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Site Cards List */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" /> Managed Site Locations ({assignedBranches.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedBranches.map((b) => {
                const offline = b.status === "offline";
                const isSelected = b.id === activeBranch.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate({ to: "/dashboard", search: { branch: b.id } })}
                    className={cn(
                      "p-3.5 rounded-xl cursor-pointer border transition-all flex items-center justify-between shadow-xs",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", offline ? "bg-unsafe animate-pulse" : "bg-safe")} />
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.campus} • {b.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>{b.systemsOnline}/{b.totalSystems}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Amanzi Mpilo • Exact GPS Coordinates • ESP32 + pH + Turbidity sensors
      </footer>
    </div>
  );
}