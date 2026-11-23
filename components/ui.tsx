import Link from "next/link";
import { BookOpen, ClipboardList, FileText, FolderKanban, Zap, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="text-[21px] font-bold truncate">{title}</h1>
        {sub && <p className="text-[12.5px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const body = (
    <div className="card p-3.5 h-full">
      <div className="text-[11.5px] text-slate-500">{label}</div>
      <div className="text-[22px] font-bold text-ink leading-tight mt-0.5 num">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block hover:-translate-y-px transition">{body}</Link> : body;
}

const tones: Record<string, string> = {
  teal: "bg-brand-50 text-brand-700",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-600",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-sky-700",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof tones | string }) {
  return <span className={`chip ${tones[tone] || tones.slate}`}>{children}</span>;
}

export function Empty({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="card px-4 py-8 text-center text-[13px] text-slate-500">
      <Inbox size={20} className="mx-auto mb-2 text-brand-300" strokeWidth={1.6} />
      {text}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function statusOf(sub: any, due?: string | null) {
  if (!sub) {
    if (due && new Date(due).getTime() < Date.now()) return { label: "Missing", tone: "rose" };
    return { label: "Pending", tone: "amber" };
  }
  if (sub.status === "returned") return { label: "Returned", tone: "green" };
  if (due && new Date(sub.submitted_at).getTime() > new Date(due).getTime()) return { label: "Late", tone: "amber" };
  return { label: "Submitted", tone: "blue" };
}

export function gradeTone(g?: string | null) {
  if (!g) return "slate";
  if (g.startsWith("A")) return "green";
  if (g.startsWith("B")) return "teal";
  if (g.startsWith("C")) return "amber";
  return "rose";
}

/** Progress ring. Animates once on load (the page's only ambient motion). */
export function Ring({ value, size = 64, stroke = 6, label, track = "rgba(255,255,255,.18)", color = "#fff" }: {
  value: number | null; size?: number; stroke?: number; label?: React.ReactNode; track?: string; color?: string;
}) {
  const r = (size - stroke) / 2, len = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {value !== null && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={len} strokeDashoffset={len * (1 - v / 100)} className="animate-draw"
            style={{ ["--len" as any]: len }} />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">{label}</div>
    </div>
  );
}

const KIND: Record<string, { I: any; c: string }> = {
  Tutorial: { I: BookOpen, c: "bg-brand-50 text-brand-700" },
  Quiz: { I: Zap, c: "bg-amber-50 text-amber-700" },
  Test: { I: FileText, c: "bg-sky-50 text-sky-700" },
  Assignment: { I: ClipboardList, c: "bg-violet-50 text-violet-700" },
  Project: { I: FolderKanban, c: "bg-rose-50 text-rose-700" },
};
export function KindIcon({ kind, size = 36 }: { kind: string; size?: number }) {
  const k = KIND[kind] || KIND.Tutorial;
  return <div className={`rounded-lg grid place-items-center shrink-0 ${k.c}`} style={{ width: size, height: size }}><k.I size={size * 0.47} strokeWidth={1.9} /></div>;
}

/** Deadline chip whose colour carries urgency: overdue, within 48h, later. */
export function DueChip({ due, done }: { due?: string | Date | null; done?: boolean }) {
  if (!due) return <span className="chip bg-slate-100 text-slate-500">No deadline</span>;
  const ms = new Date(due).getTime() - Date.now(), h = ms / 3600000, d = Math.round(h / 24);
  const text = ms < 0 ? `${Math.max(1, Math.round(-h / 24))}d overdue` : h < 24 ? `${Math.max(1, Math.round(h))}h left` : `${d} ${d === 1 ? "day" : "days"} left`;
  const tone = done ? "bg-slate-100 text-slate-500" : ms < 0 ? "bg-rose-50 text-rose-600" : h < 48 ? "bg-marigold/20 text-amber-800" : "bg-slate-100 text-slate-600";
  return <span className={`chip num ${tone}`}>{text}</span>;
}

export function greeting() {
  const h = new Date(Date.now() + 8 * 3600000).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
