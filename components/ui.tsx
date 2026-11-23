import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold tracking-tight text-slate-900 truncate">{title}</h1>
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
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
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
      <div className="text-[22px] font-semibold text-slate-900 leading-tight mt-0.5">{value}</div>
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
    <div className="card px-4 py-8 text-center text-[13px] text-slate-400">
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
