import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Category, Priority } from "./triage";

// DEMO DATA LAYER: everything lives in this browser's storage.
// Swap these functions for calls to your FastAPI + MongoDB backend.

export type Role = "student" | "staff" | "admin";
export type Status = "Pending" | "Assigned" | "In Progress" | "Resolved" | "Closed";

export interface User { id: string; name: string; email: string; password: string; role: Role; department: string; skill?: Category | undefined }
export interface Update { at: string; by: string; text: string; status?: Status | undefined }
export interface Complaint {
  id: string; ticket: string; title: string; description: string; building: string; floor: string; room: string;
  category: Category; aiCategory: Category; aiConfidence: number; priority: Priority;
  status: Status; reporterId: string; assigneeId?: string | undefined; createdAt: string; updates: Update[];
  image?: string | undefined; rating?: number | undefined;
}

export const DEMO_USERS: User[] = [
  { id: "u1", name: "Priya Raman", email: "student@campus.edu", password: "student123", role: "student", department: "IT" },
  { id: "u2", name: "Arun Kumar", email: "staff@campus.edu", password: "staff123", role: "staff", department: "Maintenance", skill: "Electrical" },
  { id: "u4", name: "Meena Das", email: "plumber@campus.edu", password: "staff123", role: "staff", department: "Maintenance", skill: "Plumbing" },
  { id: "u5", name: "Ravi Shankar", email: "it@campus.edu", password: "staff123", role: "staff", department: "IT Support", skill: "IT and Networking" },
  { id: "u3", name: "Dr. Lakshmi", email: "admin@campus.edu", password: "admin123", role: "admin", department: "Administration" },
];

export const BUILDINGS = ["Main Block", "IT Block", "Science Block", "Library", "Boys Hostel", "Girls Hostel", "Canteen"];

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString();
const seed: Complaint[] = [
  ["Ceiling fan not working", "Fan in classroom 204 stopped working completely.", "IT Block", "Electrical", "High", "In Progress", "u2", 2],
  ["Water leakage in washroom", "Tap leaking continuously on 1st floor washroom.", "Main Block", "Plumbing", "Medium", "Assigned", "u4", 3],
  ["Wi-Fi down in library", "Internet not working in the reading hall.", "Library", "IT and Networking", "High", "Resolved", "u5", 6],
  ["Broken chair", "Two chairs broken in lab 3.", "Science Block", "Furniture", "Low", "Pending", undefined, 1],
  ["Projector flickering", "Projector screen flickers during lectures.", "IT Block", "AV Equipment", "Medium", "Pending", undefined, 0],
  ["Overflowing dustbin", "Dustbin near canteen overflowing, bad smell.", "Canteen", "Housekeeping", "Medium", "Closed", undefined, 9],
  ["Socket sparking", "Socket in hostel room 12 sparks when plugged in.", "Boys Hostel", "Electrical", "Critical", "Resolved", "u2", 12],
].map(([title, description, building, cat, pr, st, as, ago], i) => ({
  id: `c${i + 1}`, ticket: `CMP-2026-${String(i + 1).padStart(4, "0")}`, title, description, building,
  floor: "1", room: "—", category: cat, aiCategory: cat, aiConfidence: 0.8, priority: pr, status: st,
  reporterId: "u1", assigneeId: as, createdAt: d(ago as number),
  updates: [{ at: d(ago as number), by: "Priya Raman", text: "Complaint submitted", status: "Pending" }],
})) as Complaint[];

interface Store {
  user: User | null; ready: boolean; complaints: Complaint[]; users: User[];
  login: (email: string, password: string) => boolean; logout: () => void;
  add: (c: Omit<Complaint, "id" | "ticket" | "createdAt" | "updates" | "status" | "reporterId">) => Complaint;
  update: (id: string, patch: Partial<Complaint>, note?: string) => void;
  reset: () => void;
}
const Ctx = createContext<Store | null>(null);
const KEY = "campusfix-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(seed);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = JSON.parse(raw); setComplaints(p.complaints); setUserId(p.userId); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify({ complaints, userId })); }, [complaints, userId, ready]);

  const user = DEMO_USERS.find((u) => u.id === userId) ?? null;
  const store: Store = {
    user, ready, complaints, users: DEMO_USERS,
    login: (email, password) => {
      const u = DEMO_USERS.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
      if (u) setUserId(u.id);
      return !!u;
    },
    logout: () => setUserId(null),
    add: (c) => {
      const n = complaints.length + 1;
      const full: Complaint = {
        ...c, id: `c${Date.now()}`, ticket: `CMP-2026-${String(n).padStart(4, "0")}`, createdAt: new Date().toISOString(),
        status: "Pending", reporterId: user!.id, updates: [{ at: new Date().toISOString(), by: user!.name, text: "Complaint submitted", status: "Pending" }],
      };
      setComplaints((x) => [full, ...x]);
      return full;
    },
    update: (id, patch, note) =>
      setComplaints((x) => x.map((c) => c.id !== id ? c : {
        ...c, ...patch,
        updates: note || patch.status ? [...c.updates, { at: new Date().toISOString(), by: user?.name ?? "System", text: note || `Status changed to ${patch.status}`, status: patch.status }] : c.updates,
      })),
    reset: () => setComplaints(seed),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}

export function visibleFor(user: User, list: Complaint[]) {
  if (user.role === "admin") return list;
  if (user.role === "staff") return list.filter((c) => c.assigneeId === user.id);
  return list.filter((c) => c.reporterId === user.id);
}
