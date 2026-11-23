import { db } from "./db";

export type Slot = { id: number; day: number; start_min: number; end_min: number; kind: string; label: string; class_codes: string[]; venue: string | null };
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Colour per class; lectures share one colour. Kept in one place so every view matches. */
const PALETTE: Record<string, { bar: string; bg: string; text: string; dot: string }> = {
  F3T1: { bar: "bg-brand-500", bg: "bg-brand-50", text: "text-brand-800", dot: "#149f93" },
  H7T5: { bar: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-800", dot: "#0ea5e9" },
  J1T2: { bar: "bg-marigold", bg: "bg-amber-50", text: "text-amber-900", dot: "#f2b33d" },
  LECTURE: { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-800", dot: "#8b5cf6" },
  OTHER: { bar: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-700", dot: "#94a3b8" },
};
export const colorOf = (s: Pick<Slot, "kind" | "label">) =>
  s.kind === "Lecture" ? PALETTE.LECTURE : PALETTE[s.label] || PALETTE.OTHER;

export const hm = (m: number) => {
  const h = Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")}${h < 12 ? " am" : " pm"}`;
};
export const range = (s: Slot) => `${hm(s.start_min)} – ${hm(s.end_min)}`;

/** Now in Malaysia time as {day, min}. */
export function nowMYT() {
  const d = new Date(Date.now() + 8 * 3600000);
  return { day: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export async function allSlots(): Promise<Slot[]> {
  return (await db()`SELECT * FROM timetable_slots ORDER BY day, start_min`) as Slot[];
}
export async function slotsForClass(cls: string): Promise<Slot[]> {
  return (await db()`SELECT * FROM timetable_slots WHERE ${cls} = ANY(class_codes) ORDER BY day, start_min`) as Slot[];
}

/** Current slot (if in session) and the next upcoming one, wrapping round the week. */
export function nowAndNext(slots: Slot[]) {
  const { day, min } = nowMYT();
  const t = day * 1440 + min;
  const abs = (s: Slot) => s.day * 1440 + s.start_min;
  const current = slots.find((s) => s.day === day && s.start_min <= min && min < s.end_min) || null;
  const sorted = [...slots].sort((a, b) => abs(a) - abs(b));
  const next = sorted.find((s) => abs(s) > t) || sorted[0] || null;
  const today = slots.filter((s) => s.day === day);
  return { current, next, today, day, min };
}
