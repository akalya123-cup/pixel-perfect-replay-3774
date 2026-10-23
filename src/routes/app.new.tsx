import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUILDINGS, useStore } from "@/lib/store";
import { CATEGORIES, classify, recommendPriority, type Category } from "@/lib/triage";
import { PriorityBadge } from "@/components/badges";

export const Route = createFileRoute("/app/new")({
  head: () => ({ meta: [{ title: "Report a problem — CampusFix AI" }, { name: "description", content: "Submit a campus maintenance complaint." }, { property: "og:title", content: "Report a problem — CampusFix AI" }, { property: "og:description", content: "Submit a campus maintenance complaint." }] }),
  component: NewComplaint,
});

const sel = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

function NewComplaint() {
  const { add, user, complaints } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ title: "", description: "", building: "", floor: "", room: "" });
  const [override, setOverride] = useState<Category | "">("");
  const [image, setImage] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ai = useMemo(() => classify(`${f.title} ${f.description}`), [f.title, f.description]);
  const category = override || ai.category;
  const related = complaints.filter((c) => c.building === f.building && c.category === category && c.status !== "Closed").length;
  const priority = recommendPriority(`${f.title} ${f.description}`, category, related);

  if (user?.role !== "student") return <p className="text-muted-foreground">Only students and faculty can submit complaints. <Link to="/app/dashboard" className="text-primary">Back</Link></p>;

  const onFile = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use JPG, PNG or WEBP"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<"title" | "description" | "building" | "room", string>> = {};
    if (f.title.trim().length < 5) er.title = "At least 5 characters";
    if (f.description.trim().length < 10) er.description = "At least 10 characters";
    if (!f.building) er.building = "Choose a building";
    if (!f.room.trim()) er.room = "Required";
    setErrors(er);
    if (Object.keys(er).length) return;
    const c = add({ ...f, category, aiCategory: ai.category, aiConfidence: ai.confidence, priority, image });
    toast.success(`Submitted ${c.ticket}`, { description: `${category} · ${priority} priority` });
    nav({ to: "/app/complaints/$id", params: { id: c.id } });
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const Err = ({ k }: { k: string }) => errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">Report a problem</h1>
        <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" value={f.title} onChange={set("title")} placeholder="e.g. Ceiling fan not working" /><Err k="title" /></div>
        <div className="space-y-1.5"><Label htmlFor="d">Description</Label><Textarea id="d" rows={4} value={f.description} onChange={set("description")} placeholder="What's wrong, since when, how many people affected?" /><Err k="description" /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="b">Building</Label><select id="b" className={sel} value={f.building} onChange={set("building")}><option value="">Select…</option>{BUILDINGS.map((b) => <option key={b}>{b}</option>)}</select><Err k="building" /></div>
          <div className="space-y-1.5"><Label htmlFor="fl">Floor</Label><Input id="fl" value={f.floor} onChange={set("floor")} /></div>
          <div className="space-y-1.5"><Label htmlFor="r">Room / location</Label><Input id="r" value={f.room} onChange={set("room")} /><Err k="room" /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="cat">Category (change if the suggestion is wrong)</Label>
          <select id="cat" className={sel} value={override} onChange={(e) => setOverride(e.target.value as Category)}><option value="">Use suggestion: {ai.category}</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="img">Photo (optional, max 2 MB)</Label><Input id="img" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
          {image && <img src={image} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />}</div>
        <Button type="submit">Submit complaint</Button>
      </form>
      <aside className="h-fit rounded-xl border bg-accent/50 p-5">
        <div className="flex items-center gap-2 font-bold text-accent-foreground"><Sparkles className="size-4" />Smart suggestion</div>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted-foreground">Category</dt><dd className="font-semibold">{category}{override && " (your choice)"}</dd></div>
          <div><dt className="text-muted-foreground">Match confidence</dt><dd className="font-semibold">{Math.round(ai.confidence * 100)}%{ai.needsReview && f.description && <span className="ml-2 text-xs text-destructive">needs review</span>}</dd></div>
          {ai.alternatives.length > 0 && <div><dt className="text-muted-foreground">Alternatives</dt><dd>{ai.alternatives.map((a) => a.category).join(", ")}</dd></div>}
          <div><dt className="text-muted-foreground">Recommended priority</dt><dd className="mt-1"><PriorityBadge p={priority} /></dd></div>
          {related > 0 && <div className="text-xs text-muted-foreground">{related} similar open report(s) in this building</div>}
        </dl>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Rule-based keyword fallback. Connect your trained classifier to replace it.</p>
      </aside>
    </div>
  );
}
