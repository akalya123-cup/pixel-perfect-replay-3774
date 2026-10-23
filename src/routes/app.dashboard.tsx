import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Inbox, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, visibleFor, type Status } from "@/lib/store";
import { StatusBadge, PriorityBadge } from "@/components/badges";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CampusFix AI" }, { name: "description", content: "Complaint overview and analytics." }, { property: "og:title", content: "Dashboard — CampusFix AI" }, { property: "og:description", content: "Complaint overview and analytics." }] }),
  component: Dashboard,
});

const STATUSES: Status[] = ["Pending", "Assigned", "In Progress", "Resolved", "Closed"];
const COLORS = ["var(--chart-3)", "var(--chart-5)", "var(--chart-1)", "var(--chart-2)", "var(--muted-foreground)"];

function Dashboard() {
  const { user, complaints } = useStore();
  const list = visibleFor(user!, complaints);
  const count = (s: Status) => list.filter((c) => c.status === s).length;
  const byStatus = STATUSES.map((s) => ({ name: s, value: count(s) })).filter((x) => x.value);
  const byCat = Object.entries(list.reduce<Record<string, number>>((a, c) => ((a[c.category] = (a[c.category] || 0) + 1), a), {})).map(([name, value]) => ({ name, value }));
  const byBuilding = Object.entries(list.reduce<Record<string, number>>((a, c) => ((a[c.building] = (a[c.building] || 0) + 1), a), {})).map(([name, value]) => ({ name, value }));
  const critical = list.filter((c) => (c.priority === "Critical" || c.priority === "High") && c.status !== "Closed" && c.status !== "Resolved").length;

  const stats = [
    { label: "Total", value: list.length, icon: Inbox },
    { label: "Open", value: count("Pending") + count("Assigned") + count("In Progress"), icon: Clock },
    { label: "High / critical open", value: critical, icon: AlertTriangle },
    { label: "Resolved", value: count("Resolved") + count("Closed"), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user!.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{user!.role === "admin" ? "Campus-wide overview" : user!.role === "staff" ? "Your assigned work" : "Your reported issues"}</p>
        </div>
        {user!.role === "student" && <Button asChild><Link to="/app/new"><PlusCircle className="size-4" />Report a problem</Link></Button>}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-card">
            <s.icon className="size-5 text-primary" />
            <p className="mt-3 text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="By status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {byStatus.map((s) => <Cell key={s.name} fill={COLORS[STATUSES.indexOf(s.name as Status)]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title={user!.role === "admin" ? "By building" : "By category"}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={user!.role === "admin" ? byBuilding : byCat}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {user!.role === "admin" && (
        <Card title="By category">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCat} layout="vertical"><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="name" width={170} fontSize={11} /><Tooltip /><Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card title="Recent activity">
        {list.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p> : (
          <ul className="divide-y">
            {list.slice(0, 6).map((c) => (
              <li key={c.id}><Link to="/app/complaints/$id" params={{ id: c.id }} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                <div className="min-w-0"><p className="truncate font-semibold">{c.title}</p><p className="text-xs text-muted-foreground">{c.ticket} · {c.building}</p></div>
                <div className="flex gap-2"><PriorityBadge p={c.priority} /><StatusBadge s={c.status} /></div>
              </Link></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-5 shadow-card"><h2 className="mb-3 font-bold">{title}</h2>{children}</section>;
}
