import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore, visibleFor } from "@/lib/store";
import { CATEGORIES } from "@/lib/triage";
import { PriorityBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/app/complaints/")({
  head: () => ({ meta: [{ title: "Complaints — CampusFix AI" }, { name: "description", content: "Search and filter maintenance complaints." }, { property: "og:title", content: "Complaints — CampusFix AI" }, { property: "og:description", content: "Search and filter maintenance complaints." }] }),
  component: List,
});

const sel = "h-9 rounded-md border border-input bg-card px-3 text-sm";

function List() {
  const { user, complaints, users } = useStore();
  const [q, setQ] = useState(""); const [st, setSt] = useState(""); const [cat, setCat] = useState(""); const [pr, setPr] = useState("");
  const rows = visibleFor(user!, complaints).filter((c) =>
    (!q || `${c.title} ${c.ticket} ${c.building}`.toLowerCase().includes(q.toLowerCase())) && (!st || c.status === st) && (!cat || c.category === cat) && (!pr || c.priority === pr));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Complaints</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search title, ticket, building" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="Status" className={sel} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option>{["Pending", "Assigned", "In Progress", "Resolved", "Closed"].map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Category" className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Priority" className={sel} value={pr} onChange={(e) => setPr(e.target.value)}><option value="">All priorities</option>{["Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Ticket", "Title", "Category", "Location", "Assignee", "Priority", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-mono text-xs"><Link to="/app/complaints/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.ticket}</Link></td>
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3">{c.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.building}</td>
                <td className="px-4 py-3 text-muted-foreground">{users.find((u) => u.id === c.assigneeId)?.name ?? "—"}</td>
                <td className="px-4 py-3"><PriorityBadge p={c.priority} /></td>
                <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No complaints match.</p>}
      </div>
    </div>
  );
}
