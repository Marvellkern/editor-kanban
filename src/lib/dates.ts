const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local calendar date as "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso)!;
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1) return null; // e.g. 2026-02-31
  return d;
}

export function isValidISODate(iso: unknown): iso is string {
  return typeof iso === "string" && parseISODate(iso) !== null;
}

/** Whole calendar days from today to the date (negative = past). DST-safe. */
export function daysUntil(iso: string, today = todayISO()): number {
  const a = parseISODate(today)!;
  const b = parseISODate(iso)!;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === new Date().getFullYear() ? label : `${label}, ${d.getFullYear()}`;
}

export type DeadlineState = "none" | "normal" | "soon" | "today" | "overdue" | "done";

export interface DeadlineInfo {
  state: DeadlineState;
  label: string;
  /** Full sentence for screen readers / tooltips. */
  long: string;
}

export function deadlineInfo(deadline: string | undefined, isDone: boolean): DeadlineInfo {
  if (!deadline || !isValidISODate(deadline)) return { state: "none", label: "", long: "" };
  const date = formatShortDate(deadline);
  if (isDone) return { state: "done", label: date, long: `Deadline ${date}, delivered` };
  const n = daysUntil(deadline);
  if (n < 0) {
    const late = `${-n} day${n === -1 ? "" : "s"} late`;
    return { state: "overdue", label: late, long: `Overdue: ${late} (was due ${date})` };
  }
  if (n === 0) return { state: "today", label: "Today", long: `Due today (${date})` };
  if (n <= 3) {
    const soon = n === 1 ? "Tomorrow" : `in ${n} days`;
    return { state: "soon", label: soon, long: `Due ${soon.toLowerCase()} (${date})` };
  }
  return { state: "normal", label: date, long: `Due ${date}` };
}

/** Used by the "Due this week" filter: overdue or due within the next 7 days. */
export function isDueThisWeek(deadline: string | undefined, isDone: boolean): boolean {
  if (!deadline || !isValidISODate(deadline)) return false;
  const n = daysUntil(deadline);
  if (n < 0) return !isDone;
  return n <= 6;
}

export function backupFilename(): string {
  return `kanban-backup-${todayISO()}.json`;
}
