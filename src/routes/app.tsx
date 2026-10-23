import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LayoutDashboard, ListChecks, LogOut, Menu, PlusCircle, Wrench } from "lucide-react";
import { useStore, visibleFor } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({ component: Shell });

function Shell() {
  const { user, ready, logout, complaints } = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (ready && !user) nav({ to: "/" }); }, [ready, user, nav]);
  if (!user) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;

  const pending = visibleFor(user, complaints).filter((c) => c.status === "Pending" || c.status === "Assigned").length;
  const links = [
    { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/complaints", label: user.role === "staff" ? "My tasks" : user.role === "admin" ? "All complaints" : "My complaints", icon: ListChecks },
    ...(user.role === "student" ? [{ to: "/app/new", label: "New complaint", icon: PlusCircle }] : []),
  ] as const;

  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 bg-sidebar p-4 text-sidebar-foreground transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-8 flex items-center gap-2 px-2 font-bold text-sidebar-accent-foreground">
          <div className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Wrench className="size-4" /></div>CampusFix AI
        </div>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} activeOptions={{ exact: l.to !== "/app/complaints" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
              <l.icon className="size-4" />{l.label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-lg bg-sidebar-accent p-3 text-xs">
          <p className="font-semibold text-sidebar-accent-foreground">{user.name}</p>
          <p className="capitalize opacity-70">{user.role} · {user.department}</p>
          <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="mt-2 flex items-center gap-1.5 text-sidebar-primary"><LogOut className="size-3.5" />Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <button className="lg:hidden" aria-label="Menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <span className="hidden text-xs text-muted-foreground lg:block">Demo data · stored in this browser</span>
          <div className="relative" title={`${pending} open items`}>
            <Bell className="size-5 text-muted-foreground" />
            {pending > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{pending}</span>}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
