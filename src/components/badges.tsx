import { cn } from "@/lib/utils";
import type { Status } from "@/lib/store";
import type { Priority } from "@/lib/triage";

const status: Record<Status, string> = {
  Pending: "bg-warning/15 text-foreground",
  Assigned: "bg-info/15 text-info",
  "In Progress": "bg-primary/15 text-primary",
  Resolved: "bg-success/15 text-success",
  Closed: "bg-muted text-muted-foreground",
};
const priority: Record<Priority, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/20 text-foreground",
  Low: "bg-muted text-muted-foreground",
};
const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";
export const StatusBadge = ({ s }: { s: Status }) => <span className={cn(base, status[s])}>{s}</span>;
export const PriorityBadge = ({ p }: { p: Priority }) => <span className={cn(base, priority[p])}>{p}</span>;
