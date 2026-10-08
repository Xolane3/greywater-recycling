import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface TankIconProps {
  label: string;
  safe: boolean;
  level: number; // 0-100
  description: string;
  role: string; // friendly one-liner
}

export function TankIcon({ label, safe, level, description, role }: TankIconProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-2 cursor-help group">
            <div className="relative w-20 h-24">
              <svg viewBox="0 0 80 96" className="w-full h-full">
                <defs>
                  <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={safe ? "oklch(0.72 0.18 155)" : "oklch(0.65 0.24 25)"} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={safe ? "oklch(0.55 0.18 160)" : "oklch(0.55 0.22 20)"} stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <rect x="10" y="14" width="60" height="78" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
                <rect x="6" y="8" width="68" height="10" rx="3" fill="currentColor" className="text-muted" />
                <clipPath id={`clip-${label}`}>
                  <rect x="12" y="16" width="56" height="74" rx="4" />
                </clipPath>
                <g clipPath={`url(#clip-${label})`}>
                  <rect
                    x="10"
                    y={16 + (74 * (100 - level)) / 100}
                    width="60"
                    height={(74 * level) / 100 + 4}
                    fill={`url(#grad-${label})`}
                    className={cn(safe ? "" : "animate-pulse-glow")}
                  />
                  <path
                    d={`M10 ${16 + (74 * (100 - level)) / 100} Q 25 ${13 + (74 * (100 - level)) / 100}, 40 ${16 + (74 * (100 - level)) / 100} T 70 ${16 + (74 * (100 - level)) / 100} V 92 H 10 Z`}
                    fill={`url(#grad-${label})`}
                    opacity="0.6"
                    className="animate-wave"
                  />
                </g>
              </svg>
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-background",
                  safe ? "bg-safe" : "bg-unsafe animate-pulse-glow",
                )}
              />
            </div>
            <div className="text-center max-w-[120px]">
              <div className="flex items-center justify-center gap-1">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <Info className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{role}</p>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wide mt-1", safe ? "text-safe" : "text-unsafe")}>
                {level}% • {safe ? "Safe" : "Unsafe"}
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
