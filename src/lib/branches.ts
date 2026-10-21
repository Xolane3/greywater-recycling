export type Branch = {
  id: string;
  name: string;
  campus: string;
  city: string;
  lat: number;
  lng: number;
  purchaserId: string;
  systemsOnline: number;
  totalSystems: number;
  status: "healthy" | "attention" | "offline";
  recycledToday: number; // L
  savedToday: number; // L of fresh water saved
};

export type Purchaser = {
  id: string;
  company: string;
  contact: string;
  email: string;
  plan: "Starter" | "Growth" | "Enterprise";
  since: string;
};

export const PURCHASERS: Purchaser[] = [
  {
    id: "balwin",
    company: "Balwin Properties",
    contact: "Thandi Mokoena",
    email: "thandi@balwin.co.za",
    plan: "Enterprise",
    since: "Mar 2023",
  },
  {
    id: "varsity-living",
    company: "Varsity Living Group",
    contact: "Sipho Dlamini",
    email: "sipho@varsityliving.co.za",
    plan: "Growth",
    since: "Aug 2024",
  },
  {
    id: "kovacs",
    company: "Kovacs Student Housing",
    contact: "Lerato Ndlovu",
    email: "lerato@kovacs.co.za",
    plan: "Starter",
    since: "Feb 2026",
  },
];

export const BRANCHES: Branch[] = [
  {
    id: "up-hatfield",
    name: "UP — Hatfield",
    campus: "Hatfield Student Village",
    city: "Pretoria",
    lat: -25.7537543,
    lng: 28.2297346,
    purchaserId: "balwin",
    systemsOnline: 2,
    totalSystems: 2,
    status: "healthy",
    recycledToday: 198,
    savedToday: 152,
  },
  {
    id: "up-mamelodi",
    name: "UP — Mamelodi",
    campus: "Mamelodi Student Village",
    city: "Pretoria",
    lat: -25.7200,
    lng: 28.4000,
    purchaserId: "balwin",
    systemsOnline: 2,
    totalSystems: 2,
    status: "healthy",
    recycledToday: 198,
    savedToday: 152,
  },
  {
    id: "uj-apk",
    name: "UJ — Auckland Park",
    campus: "Sophiatown Residence",
    city: "Johannesburg",
    lat: -26.1800,
    lng: 28.0000,
    purchaserId: "varsity-living",
    systemsOnline: 0,
    totalSystems: 2,
    status: "offline",
    recycledToday: 0,
    savedToday: 0,
  },
  {
    id: "uj-soweto",
    name: "UJ — Soweto Campus",
    campus: "Soweto Res East",
    city: "Johannesburg",
    lat: -26.2600,
    lng: 27.9200,
    purchaserId: "varsity-living",
    systemsOnline: 2,
    totalSystems: 2,
    status: "healthy",
    recycledToday: 174,
    savedToday: 133,
  },
  {
    id: "ukzn-westville",
    name: "UKZN — Westville",
    campus: "Westville Residences",
    city: "Durban",
    lat: -29.8179,
    lng: 30.9428,
    purchaserId: "kovacs",
    systemsOnline: 1,
    totalSystems: 2,
    status: "attention",
    recycledToday: 96,
    savedToday: 71,
  },
  {
    id: "nwu-potch",
    name: "NWU — Potchefstroom",
    campus: "Village Res",
    city: "Potchefstroom",
    lat: -26.6934,
    lng: 27.0971,
    purchaserId: "kovacs",
    systemsOnline: 2,
    totalSystems: 2,
    status: "healthy",
    recycledToday: 142,
    savedToday: 108,
  },
];

export function getBranch(id?: string): Branch {
  return BRANCHES.find((b) => b.id === id) ?? BRANCHES[0];
}

export function branchesOfPurchaser(purchaserId: string): Branch[] {
  return BRANCHES.filter((b) => b.purchaserId === purchaserId);
}

export function getPurchaser(id?: string): Purchaser | undefined {
  return PURCHASERS.find((p) => p.id === id);
}

export function branchesByIds(ids: string[]): Branch[] {
  return BRANCHES.filter((b) => ids.includes(b.id));
}

export function totals(list: Branch[]) {
  return {
    recycled: list.reduce((s, b) => s + b.recycledToday, 0),
    saved: list.reduce((s, b) => s + b.savedToday, 0),
    online: list.reduce((s, b) => s + b.systemsOnline, 0),
    systems: list.reduce((s, b) => s + b.totalSystems, 0),
  };
}