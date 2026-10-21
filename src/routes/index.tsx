import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Droplet, MapPin, ArrowLeft, Building2, HardHat, ShieldCheck, Wifi, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsPanel, type AppNotification } from "@/components/NotificationsPanel";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BRANCHES, getPurchaser, type Branch } from "@/lib/branches";
import { useSession, visibleBranches, roleLabel } from "@/lib/auth";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ branch: z.string().optional() });

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sites Map — Amanzi Mpilo" },
      { name: "description", content: "Live map view showing purchaser owned and site operator assigned branches." },
    ],
  }),
  component: SitesMapPage,
});

const STATUS_COLOR: Record<Branch["status"], string> = {
  healthy: "#16a34a",
  attention: "#f59e0b",
  offline: "#dc2626",
};

const STATUS_LABEL: Record<Branch["status"], string> = {
  healthy: "Online",
  attention: "Needs attention",
  offline: "Offline",
};

/**
 * Real, live map (Leaflet + OpenStreetMap). Markers are anchored to true
 * lat/lng, so they stay exactly on the real location while you pan / zoom.
 * Leaflet touches `window` on import, so it is loaded dynamically (SSR-safe).
 */
function BranchMap({
  branches,
  selectedId,
  onOpen,
}: {
  branches: Branch[];
  selectedId?: string;
  onOpen: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const branchesRef = useRef(branches);
  const onOpenRef = useRef(onOpen);
  const [mapReady, setMapReady] = useState(false);

  branchesRef.current = branches;
  onOpenRef.current = onOpen;

  // 1. Create the map once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([-27.5, 28.5], 6);

      const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles &copy; Esri" }
      );

      L.control.layers({ Street: street, Satellite: satellite }, undefined, { position: "topright" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // 2. Draw markers whenever the branches / selection change
  const markerKey = branches.map((b) => `${b.id}:${b.status}:${b.systemsOnline}`).join("|") + `#${selectedId ?? ""}`;

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    branchesRef.current.forEach((b) => {
      const color = STATUS_COLOR[b.status];
      const selected = b.id === selectedId;
      const size = selected ? 1.25 : 1;

      const icon = L.divIcon({
        className: "",
        iconSize: [36 * size, 44 * size],
        iconAnchor: [18 * size, 44 * size], // tip of the pin sits exactly on the coordinate
        tooltipAnchor: [0, -40 * size],
        html: `<svg width="${36 * size}" height="${44 * size}" viewBox="0 0 36 44" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))">
          <path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="${color}" stroke="${selected ? "#0ea5e9" : "#fff"}" stroke-width="${selected ? 3 : 2}"/>
          <circle cx="18" cy="18" r="7" fill="#fff"/>
        </svg>`,
      });

      const purchaser = getPurchaser(b.purchaserId);
      const tooltip = `
        <div style="min-width:180px;font-size:12px;line-height:1.4">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <strong style="font-size:13px">${b.name}</strong>
            <span style="color:${color};font-weight:600;font-size:10px">${STATUS_LABEL[b.status]}</span>
          </div>
          <div style="color:#64748b">${b.campus} • ${b.city}</div>
          <div style="color:#64748b;font-family:monospace;font-size:10px;margin-top:2px">GPS: ${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}</div>
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0">
            Systems: <strong>${b.systemsOnline}/${b.totalSystems} online</strong>
          </div>
          ${purchaser ? `<div style="color:#0284c7;font-size:10px;margin-top:2px">${purchaser.company}</div>` : ""}
          <div style="color:#94a3b8;font-size:10px;margin-top:4px">Click pin to open dashboard</div>
        </div>`;

      const marker = L.marker([b.lat, b.lng], { icon, title: b.name, riseOnHover: true })
        .addTo(map)
        .bindTooltip(tooltip, { direction: "top", opacity: 1 });

      marker.on("click", () => onOpenRef.current(b.id));
      markersRef.current.push(marker);
    });
  }, [mapReady, markerKey]); // eslint-disable-line

  // 3. Fly to the selected site, or fit every site in view
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    const list = branchesRef.current;
    const target = selectedId ? list.find((b) => b.id === selectedId) : undefined;

    if (target) {
      map.flyTo([target.lat, target.lng], 14, { duration: 1.2 });
    } else if (list.length === 1) {
      map.setView([list[0].lat, list[0].lng], 14);
    } else if (list.length > 1) {
      map.fitBounds(L.latLngBounds(list.map((b) => [b.lat, b.lng] as [number, number])), {
        padding: [60, 60],
        maxZoom: 12,
      });
    }
  }, [mapReady, selectedId, branches.length]);

  return (
    <div className="relative z-0 w-full h-[520px] rounded-xl overflow-hidden border border-border bg-muted">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function SitesMapPage() {
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const { branch: branchId } = Route.useSearch();

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", type: "info", title: "Map view active", message: "Showing live site locations on map.", time: "Just now", read: false },
    { id: "2", type: "alert", title: "UJ — Auckland Park offline", message: "No sensor data received for 3 hours.", time: "3h ago", read: false },
  ]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }

  const assignedBranches = visibleBranches(user);
  const company = user.purchaserId ? getPurchaser(user.purchaserId)?.company : undefined;
  const selected = assignedBranches.find((b) => b.id === branchId);

  const markRead = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const RoleIcon = user.role === "admin" ? ShieldCheck : user.role === "purchaser" ? Building2 : HardHat;

  const openDashboard = (id: string) => navigate({ to: "/dashboard", search: { branch: id } });
  const focusOnMap = (id: string) => navigate({ to: "/", search: { branch: id } });

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
                <MapPin className="w-5 h-5 text-primary" /> Live Branch Map
              </h3>
              <p className="text-xs text-muted-foreground">
                {selected
                  ? `Focused on ${selected.name} (${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}). Drag or zoom freely.`
                  : "Drag and zoom freely — pins stay on each site's real GPS location."}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: STATUS_COLOR.healthy }} />
                <span className="text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: STATUS_COLOR.attention }} />
                <span className="text-muted-foreground">Attention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: STATUS_COLOR.offline }} />
                <span className="text-muted-foreground">Offline</span>
              </div>
            </div>
          </div>

          <BranchMap branches={assignedBranches} selectedId={selected?.id} onOpen={openDashboard} />

          {/* Site Cards List */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" /> Managed Site Locations ({assignedBranches.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedBranches.map((b) => {
                const offline = b.status === "offline";
                const isSelected = b.id === selected?.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => focusOnMap(b.id)}
                    className={cn(
                      "p-3.5 rounded-xl cursor-pointer border transition-all flex items-center justify-between gap-2 shadow-xs",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span
                        className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", offline && "animate-pulse")}
                        style={{ background: STATUS_COLOR[b.status] }}
                      />
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.campus} • {b.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>{b.systemsOnline}/{b.totalSystems}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Open dashboard"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDashboard(b.id);
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Amanzi Mpilo • Live GPS Map • ESP32 + pH + Turbidity sensors
      </footer>
    </div>
  );
}
