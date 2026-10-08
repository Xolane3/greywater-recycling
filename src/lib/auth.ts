import { useCallback, useEffect, useState } from "react";
import { BRANCHES, branchesByIds, branchesOfPurchaser, type Branch } from "./branches";

export type Role = "operator" | "purchaser" | "admin";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  purchaserId?: string;
  branchIds?: string[];
};

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: DemoUser[] = [
  {
    id: "op-uj",
    name: "Bongani Khumalo",
    email: "bongani@varsityliving.co.za",
    role: "operator",
    title: "Site Operator — UJ Auckland Park",
    purchaserId: "varsity-living",
    branchIds: ["uj-apk", "uj-soweto"],
  },
  {
    id: "op-uct",
    name: "Naledi Botha",
    email: "naledi@balwin.co.za",
    role: "operator",
    title: "Site Operator — UCT Upper Campus",
    purchaserId: "balwin",
    branchIds: ["uct-upper"],
  },
  {
    id: "buy-balwin",
    name: "Thandi Mokoena",
    email: "thandi@balwin.co.za",
    role: "purchaser",
    title: "System Purchaser — Balwin Properties",
    purchaserId: "balwin",
  },
  {
    id: "buy-varsity",
    name: "Sipho Dlamini",
    email: "sipho@varsityliving.co.za",
    role: "purchaser",
    title: "System Purchaser — Varsity Living Group",
    purchaserId: "varsity-living",
  },
  {
    id: "admin-1",
    name: "Amanzi Admin",
    email: "admin@amanzimpilo.za",
    role: "admin",
    title: "Platform Administrator",
  },
];

const KEY = "amanzi.session";

export function findUser(email: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function readSession(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(KEY);
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}

export function writeSession(user: DemoUser) {
  window.localStorage.setItem(KEY, user.id);
  window.dispatchEvent(new Event("amanzi-session"));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("amanzi-session"));
}

export function useSession() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => setUser(readSession()), []);

  useEffect(() => {
    sync();
    setReady(true);
    window.addEventListener("amanzi-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("amanzi-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return { user, ready, signOut: clearSession };
}

/** Branches a user is allowed to see. */
export function visibleBranches(user: DemoUser | null): Branch[] {
  if (!user) return [];
  if (user.role === "admin") return BRANCHES;
  if (user.role === "purchaser") return branchesOfPurchaser(user.purchaserId!);
  return branchesByIds(user.branchIds ?? []);
}

export function canAccessBranch(user: DemoUser | null, branchId: string) {
  return visibleBranches(user).some((b) => b.id === branchId);
}

export const roleLabel: Record<Role, string> = {
  operator: "Site Operator",
  purchaser: "System Purchaser",
  admin: "Administrator",
};
