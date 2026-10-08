import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { roleLabel, useSession } from "@/lib/auth";

export function ProfileMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState("Site Operator");
  const [email, setEmail] = useState("operator@amanzimpilo.za");
  const [alerts, setAlerts] = useState(true);
  const [autoCutoff, setAutoCutoff] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 pl-1 pr-3 rounded-full hover:bg-accent">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span className="text-sm">{name}</span>
              <span className="text-xs text-muted-foreground font-normal">{email}</span>
              {user && (
                <Badge variant="secondary" className="w-fit text-[10px] font-medium mt-1">
                  {roleLabel[user.role]}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="w-4 h-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Shield className="w-4 h-4 mr-2" /> Security
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-unsafe focus:text-unsafe"
            onClick={() => {
              signOut();
              toast.success("Signed out");
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your account information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setProfileOpen(false); toast.success("Profile updated"); }}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>System Settings</DialogTitle>
            <DialogDescription>Configure alerts and automation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Push alerts</Label>
                <p className="text-xs text-muted-foreground">Receive unsafe water alerts</p>
              </div>
              <Switch checked={alerts} onCheckedChange={setAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto cutoff (relay)</Label>
                <p className="text-xs text-muted-foreground">Stop flow on unsafe reading</p>
              </div>
              <Switch checked={autoCutoff} onCheckedChange={setAutoCutoff} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setSettingsOpen(false); toast.success("Settings saved"); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
