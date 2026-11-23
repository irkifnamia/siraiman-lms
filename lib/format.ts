const TZ = "Asia/Kuala_Lumpur";

export function fmtDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-MY", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: withTime ? undefined : "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function relDue(d: string | Date | null | undefined) {
  if (!d) return "No due date";
  const ms = new Date(d).getTime() - Date.now();
  const days = Math.round(ms / 86400000);
  if (ms < 0) return days === 0 ? "Due today (past)" : `Overdue ${Math.abs(days)}d`;
  const hours = Math.round(ms / 3600000);
  if (hours < 24) return `Due in ${hours}h`;
  return `Due in ${days}d`;
}

/** value for <input type="datetime-local"> in MYT */
export function toLocalInput(d: string | Date | null | undefined) {
  if (!d) return "";
  const t = new Date(new Date(d).getTime() + 8 * 3600000);
  return t.toISOString().slice(0, 16);
}

/** "2026-11-30T23:59" (MYT) -> ISO */
export function fromLocalInput(v: string | null) {
  if (!v) return null;
  return new Date(v + ":00+08:00").toISOString();
}

export function pct(mark: any, max: any) {
  const m = Number(mark), x = Number(max);
  if (!isFinite(m) || !x) return null;
  return Math.round((m / x) * 1000) / 10;
}

export function titleCase(s: string) {
  return (s || "").toLowerCase().replace(/(^|[\s'/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}
