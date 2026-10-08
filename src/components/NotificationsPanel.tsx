import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: "alert" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface Props {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const iconMap = {
  alert: { Icon: AlertTriangle, color: "text-unsafe bg-unsafe/10" },
  success: { Icon: CheckCircle2, color: "text-safe bg-safe/10" },
  info: { Icon: Info, color: "text-primary bg-primary/10" },
};

export function NotificationsPanel({ notifications, onMarkRead, onClearAll }: Props) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-accent">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-unsafe text-unsafe-foreground flex items-center justify-center ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 bg-popover border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => {
              const { Icon, color } = iconMap[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={cn(
                    "w-full text-left flex gap-3 p-4 border-b border-border/50 hover:bg-accent/40 transition-colors",
                    !n.read && "bg-accent/20",
                  )}
                >
                  <div className={cn("p-2 rounded-lg h-fit", color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
