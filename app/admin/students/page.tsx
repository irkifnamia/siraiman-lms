import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { titleCase } from "@/lib/format";
import { Badge, Empty, PageHeader, gradeTone } from "@/components/ui";

export default async function Students({ searchParams }: { searchParams: Promise<{ class?: string; q?: string; sys?: string }> }) {
  const { class: cls = "", q = "", sys = "" } = await searchParams;
  const classes = await getClasses();
  const like = `%${q.toUpperCase()}%`;
  const rows = await db()`
    SELECT s.*,
      (SELECT count(*) FROM submissions WHERE student_id=s.id)::int subs
    FROM students s
    WHERE (${cls} = '' OR class_code = ${cls}) AND (${sys} = '' OR system = ${sys})
      AND (${q} = '' OR full_name LIKE ${like} OR nickname LIKE ${like} OR matric LIKE ${like})
    ORDER BY class_code, full_name`;

  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ class: cls, q, sys, ...o }).toString();
  const chip = (on: boolean) => `px-3 h-7 rounded-full text-[12px] border inline-flex items-center ${on ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`;

  return (
    <>
      <PageHeader title="Students" sub={`${rows.length} shown`}
        action={<div className="flex gap-2">
          <a href={`/api/export?type=students&class=${cls}`} className="btn-outline px-2.5" title="Export CSV"><Download size={15} /></a>
          <Link href="/admin/students/new" className="btn-primary"><Plus size={15} /> Add</Link>
        </div>} />

      <form className="relative mb-3">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <input name="q" defaultValue={q} placeholder="Search name, nickname or matric" className="input pl-9" />
        <input type="hidden" name="class" value={cls} /><input type="hidden" name="sys" value={sys} />
      </form>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        <Link href={qs({ class: "" })} className={chip(!cls)}>All</Link>
        {classes.map((c) => <Link key={c} href={qs({ class: c })} className={chip(cls === c)}>{c}</Link>)}
        <span className="w-px bg-slate-200 mx-1" />
        {["SDS", "SES"].map((x) => <Link key={x} href={qs({ sys: sys === x ? "" : x })} className={chip(sys === x)}>{x}</Link>)}
      </div>

      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((s) => (
            <Link key={s.id} href={`/admin/students/${s.id}`} className={`flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 ${s.active ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium truncate">{titleCase(s.full_name)}</div>
                <div className="text-[11.5px] text-slate-500">{s.nickname} · {s.matric} · {s.class_code}</div>
              </div>
              <div className="hidden sm:flex gap-1">
                <Badge tone={gradeTone(s.spm_addmath)}>AM {s.spm_addmath || "—"}</Badge>
                {s.dm025 && <Badge tone={gradeTone(s.dm025)}>DM025 {s.dm025}</Badge>}
              </div>
              <Badge tone={s.system === "SES" ? "blue" : "teal"}>{s.system}</Badge>
            </Link>
          ))}
        </div>
      ) : <Empty text="No students match." />}
    </>
  );
}
