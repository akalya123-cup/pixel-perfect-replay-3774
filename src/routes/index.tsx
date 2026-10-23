import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — CampusFix AI" },
      { name: "description", content: "Report and resolve campus maintenance issues with AI-assisted triage." },
      { property: "og:title", content: "CampusFix AI — Campus Maintenance" },
      { property: "og:description", content: "Report and resolve campus maintenance issues with AI-assisted triage." },
    ],
  }),
  component: Login,
});

const demos = [
  { label: "Student", email: "student@campus.edu", pw: "student123" },
  { label: "Maintenance staff", email: "staff@campus.edu", pw: "staff123" },
  { label: "Administrator", email: "admin@campus.edu", pw: "admin123" },
];

function Login() {
  const { login, user, ready } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (ready && user) nav({ to: "/app/dashboard" }); }, [ready, user, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return setErr("Enter your email and password.");
    if (!login(email, pw)) setErr("Incorrect email or password.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-bold text-sidebar-accent-foreground">
          <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Wrench className="size-5" /></div>
          CampusFix AI
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-sidebar-accent-foreground">Report it once.<br />We route it to the right hands.</h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/80">Complaints are auto-categorised, prioritised and assigned to maintenance staff, with every update tracked to closure.</p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Demo build · data stored in this browser only</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your college account.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input id="pw" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} />
                <button type="button" aria-label="Toggle password" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <div className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo accounts</p>
            <div className="grid gap-2">
              {demos.map((d) => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPw(d.pw); login(d.email, d.pw); }}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm shadow-card hover:border-primary">
                  <span className="font-semibold">{d.label}</span><span className="text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
