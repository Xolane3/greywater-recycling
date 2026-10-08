import { Card } from "@/components/ui/card";
import { Sprout, Toilet, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReuseDestinationsProps {
  safe: boolean;
}

const destinations = [
  { icon: Sprout, label: "Garden Irrigation", desc: "Plants & vegetation" },
  { icon: Toilet, label: "Toilet Flushing", desc: "Sanitation reuse" },
  { icon: Droplets, label: "Outdoor Cleaning", desc: "Surfaces & vehicles" },
];

export function ReuseDestinations({ safe }: ReuseDestinationsProps) {
  return (
    <Card className="p-6 bg-card border-border/60">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">Reuse Destinations</h3>
          <p className="text-xs text-muted-foreground">Non-potable distribution points</p>
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-full",
            safe ? "bg-safe/15 text-safe" : "bg-unsafe/15 text-unsafe",
          )}
        >
          {safe ? "Flow Active" : "Flow Stopped"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {destinations.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className={cn(
              "p-4 rounded-2xl border transition-all",
              safe
                ? "bg-safe/5 border-safe/30 text-foreground"
                : "bg-unsafe/5 border-unsafe/20 text-muted-foreground opacity-60",
            )}
          >
            <Icon
              className={cn("w-8 h-8 mb-3", safe ? "text-safe" : "text-unsafe")}
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
