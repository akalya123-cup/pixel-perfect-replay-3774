import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore, visibleFor, type Status } from "@/lib/store";
import type { Priority } from "@/lib/triage";
import { PriorityBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/app/complaints/$id")({
  head: () => ({ meta: [{ title: "Complaint details — CampusFix AI" }, { name: "description", content: "Track a maintenance complaint." }, { property: "og:title", content: "Complaint details — CampusFix AI" }, { property: "og:description", content: "Track a maintenance complaint." }] }),
  component: Detail,
});

const sel = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

function Detail() {
  const { id } = Route.useParams();
  const { user, complaints, users, update } = useStore();
  const [note, setNote] = useState("");
  const c = visibleFor(user!, complaints).find((x) => x.id === id);
  if (!c) return <p className="text-muted-foreground">Complaint not found or not accessible. <Link to="/app/complaints" className="text-primary">Back</Link></p>;

  const staff = users.filter((u) => u.role === "staff");
  const suggested = staff.find((s) => s.skill === c.category);
  const reporter = users.find((u) => u.id === c.reporterId);
  const assignee = users.find((u) => u.id === c.assigneeId);

  const setStatus = (s: Status) => { update(c.id, { status: s }, note.trim() || undefined); setNote(""); toast.success(`Marked ${s}`); };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/app/complaints" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />All complaints</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <p className="font-mono text-xs text-muted-foreground">{c.ticket}</p>
            <h1 className="mt-1 text-2xl font-bold">{c.title}</h1>
            <div className="mt-3 flex gap-2"><PriorityBadge p={c.priority} /><StatusBadge s={c.status} /></div>
            <p className="mt-4 whitespace-pre-wrap">{c.description}</p>
            {c.image && <img src={c.image} alt="Reported issue" className="mt-4 max-h-72 rounded-lg object-cover" />}
          </section>
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-bold">Timeline</h2>
            <ol className="space-y-4 border-l-2 border-border pl-5">
              {c.updates.map((u, i) => (
                <li key={i} className="relative"><span className="absolute -left-[27px] top-1 size-3 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{u.text}</p>
                  <p className="text-xs text-muted-foreground">{u.by} · {new Date(u.at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-5 text-sm shadow-card">
            <dl className="space-y-2">
              <Row k="Category" v={c.category} /><Row k="Suggested" v={`${c.aiCategory} (${Math.round(c.aiConfidence * 100)}%)`} />
              <Row k="Location" v={`${c.building}, Floor ${c.floor || "—"}, ${c.room}`} /><Row k="Reported by" v={reporter?.name ?? "—"} />
              <Row k="Assigned to" v={assignee?.name ?? "Unassigned"} /><Row k="Submitted" v={new Date(c.createdAt).toLocaleDateString()} />
            </dl>
          </section>

          {user!.role === "admin" && (
            <section className="space-y-3 rounded-xl border bg-card p-5 shadow-card">
              <h3 className="font-bold">Manage</h3>
              <label className="block text-xs text-muted-foreground">Assign staff {suggested && `(suggested: ${suggested.name})`}
                <select className={sel} value={c.assigneeId ?? ""} onChange={(e) => { update(c.id, { assigneeId: e.target.value || undefined, status: e.target.value ? "Assigned" : "Pending" }, e.target.value ? `Assigned to ${staff.find((s) => s.id === e.target.value)?.name}` : "Unassigned"); toast.success("Assignment updated"); }}>
                  <option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.skill}</option>)}
                </select></label>
              <label className="block text-xs text-muted-foreground">Priority
                <select className={sel} value={c.priority} onChange={(e) => update(c.id, { priority: e.target.value as Priority }, `Priority set to ${e.target.value}`)}>
                  {["Critical", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
                </select></label>
              {c.status === "Resolved" && <Button className="w-full" onClick={() => setStatus("Closed")}>Verify & close</Button>}
            </section>
          )}

          {user!.role === "staff" && c.status !== "Closed" && (
            <section className="space-y-3 rounded-xl border bg-card p-5 shadow-card">
              <h3 className="font-bold">Work update</h3>
              <Textarea rows={3} placeholder="What did you do?" value={note} onChange={(e) => setNote(e.target.value)} />
              {c.status !== "In Progress" && c.status !== "Resolved" && <Button variant="outline" className="w-full" onClick={() => setStatus("In Progress")}>Start work</Button>}
              {c.status !== "Resolved" && <Button className="w-full" onClick={() => setStatus("Resolved")}>Mark resolved</Button>}
              <Button variant="ghost" className="w-full" disabled={!note.trim()} onClick={() => { update(c.id, {}, note.trim()); setNote(""); }}>Add note only</Button>
            </section>
          )}

          {user!.role === "student" && (c.status === "Resolved" || c.status === "Closed") && (
            <section className="space-y-3 rounded-xl border bg-card p-5 shadow-card">
              <h3 className="font-bold">Your feedback</h3>
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n} stars`} onClick={() => { update(c.id, { rating: n }, `Rated ${n}/5`); toast.success("Thanks for the feedback"); }}>
                  <Star className={n <= (c.rating ?? 0) ? "size-6 fill-warning text-warning" : "size-6 text-muted-foreground"} />
                </button>))}</div>
              <Textarea rows={2} placeholder="Still broken? Tell us why" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button variant="outline" className="w-full" disabled={!note.trim()} onClick={() => { update(c.id, { status: c.assigneeId ? "Assigned" : "Pending" }, `Reopened: ${note.trim()}`); setNote(""); toast("Complaint reopened"); }}>Reopen complaint</Button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
