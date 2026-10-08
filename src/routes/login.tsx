import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, HardHat, Building2, ShieldCheck, LogIn, Recycle, Leaf } from "lucide-react";
import { toast } from "sonner";
import { DEMO_PASSWORD, DEMO_USERS, findUser, readSession, roleLabel, writeSession, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Amanzi Mpilo" },
      { name: "description", content: "Sign in as a site operator, system purchaser or administrator to monitor greywater recycling." },
      { property: "og:title", content: "Sign in — Amanzi Mpilo" },
      { property: "og:description", content: "Role-based access for site operators, system purchasers and administrators." },
    ],
  }),
  component: LoginPage,
});

const roleTabs: { role: Role; icon: typeof HardHat; blurb: string }[] = [
  { role: "operator", icon: HardHat, blurb: "See only the sites you are assigned to." },
  { role: "purchaser", icon: Building2, blurb: "See every branch your company owns." },
  { role: "admin", icon: ShieldCheck, blurb: "Oversee all purchasers and their branches." },
];

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("operator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (readSession()) navigate({ to: "/" });
  }, [navigate]);

  const accounts = DEMO_USERS.filter((u) => u.role === role);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = findUser(email);
    if (!user || password !== DEMO_PASSWORD) {
      toast.error("Those details don't match a demo account", {
        description: `Pick an account below — the password is ${DEMO_PASSWORD}.`,
      });
      return;
    }
    if (user.role !== role) {
      toast.error(`That account signs in as a ${roleLabel[user.role]}`, {
        description: "Switch the tab above and try again.",
      });
      return;
    }
    writeSession(user);
    toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: "var(--gradient-water)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Droplet className="w-6 h-6 text-white" fill="white" fillOpacity={0.35} />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">Amanzi Mpilo</p>
            <p className="text-xs text-white/75">Greywater recycling intelligence</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            Every litre accounted for, across every campus.
          </h2>
          <p className="text-white/80 max-w-md text-sm">
            Live pH and turbidity readings decide when greywater is safe to reuse for gardens and toilet
            flushing — and the system stops the flow the moment it isn't.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <Recycle className="w-5 h-5 mb-2" />
              <p className="text-2xl font-bold">1 326 L</p>
              <p className="text-xs text-white/75">Recycled today</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <Leaf className="w-5 h-5 mb-2" />
              <p className="text-2xl font-bold">1 017 L</p>
              <p className="text-xs text-white/75">Fresh water saved</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/60">Demo environment • simulated sensor data</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-water)" }}>
              <Droplet className="w-5 h-5 text-white" fill="white" fillOpacity={0.35} />
            </div>
            <p className="font-bold">Amanzi Mpilo</p>
          </div>

          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose how you use the system.</p>

          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mt-6">
            <TabsList className="grid grid-cols-3 w-full">
              {roleTabs.map(({ role: r, icon: Icon }) => (
                <TabsTrigger key={r} value={r} className="text-xs gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{roleLabel[r].split(" ")[roleLabel[r].split(" ").length - 1]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <p className="text-xs text-muted-foreground mt-3">
            {roleTabs.find((t) => t.role === role)!.blurb}
          </p>

          <form onSubmit={submit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.za" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full rounded-xl gap-2">
              <LogIn className="w-4 h-4" /> Sign in as {roleLabel[role]}
            </Button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Demo accounts — tap to fill
            </p>
            <div className="space-y-2">
              {accounts.map((a) => (
                <Card
                  key={a.id}
                  onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}
                  className={cn(
                    "p-3 flex items-center justify-between cursor-pointer border-border hover:border-primary hover:shadow-sm transition-all",
                    email === a.email && "border-primary",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.email.split("@")[0]}</span>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Password for every demo account: <span className="font-medium text-foreground">{DEMO_PASSWORD}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
