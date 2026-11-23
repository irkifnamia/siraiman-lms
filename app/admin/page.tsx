import Link from "next/link";
import { ChevronRight, Plus, AlertCircle, PenLine } from "lucide-react";
import { db, currentSemester } from "@/lib/db";
import { driveConnected } from "@/lib/drive";
import { fmtDate, relDue, titleCase } from "@/lib/format";
import { Badge, DueChip, Empty, KindIcon, Ring, Section, greeting } from "@/components/ui";
import { adminProfile } from "@/lib/auth";

export default async function AdminHome() {
  const sql = db();
  const [counts, classes, toMark, recent, upcoming, sem, drive] = await Promise.all([
    sql`SELECT
      (SELECT count(*) FROM students WHERE active)::int AS students,
      (SELECT count(*) FROM assignments WHERE published)::int AS tasks,
      (SELECT count(*) FROM submissions WHERE status='submitted')::int AS to_mark,
      (SELECT count(*) FROM submissions WHERE status='returned')::int AS returned,
      (SELECT round(avg(100.0*s.mark/a.max_mark)) FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.mark IS NOT NULL)::int AS avg`,
    sql`SELECT s.class_code, count(*)::int n,
          count(*) FILTER (WHERE system='SDS')::int sds, count(*) FILTER (WHERE system='SES')::int ses
        FROM students s WHERE active GROUP BY 1 ORDER BY 1`,
    sql`SELECT a.id, a.title, a.class_code, count(s.*)::int n FROM submissions s JOIN assignments a ON a.id=s.assignment_id
        WHERE s.status='submitted' GROUP BY a.id ORDER BY min(s.submitted_at) LIMIT 5`,
    sql`SELECT s.submitted_at, st.nickname, st.class_code, a.title, a.id FROM submissions s
        JOIN students st ON st.id=s.student_id JOIN assignments a ON a.id=s.assignment_id
        WHERE s.file_url IS NOT NULL ORDER BY s.submitted_at DESC LIMIT 6`,
    sql`SELECT a.*, (SELECT count(*) FROM submissions WHERE assignment_id=a.id AND file_url IS NOT NULL)::int subs,
          (SELECT count(*) FROM students WHERE active AND (a.class_code IS NULL OR class_code=a.class_code))::int total
        FROM assignments a WHERE published AND due_at > now() ORDER BY due_at LIMIT 4`,
    currentSemester(),
    driveConnected(),
  ]);
  const prof = await adminProfile();
  const c = counts[0];

  return (
    <>
      {/* Hero: the one bold element */}
      <section className="graph-teal rounded-2xl text-white p-5 md:p-6 mb-5 shadow-[0_8px_24px_-12px_rgba(15,61,58,.6)]">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-brand-100">{new Date().toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="!text-white text-[22px] md:text-[26px] font-bold leading-tight mt-0.5">{greeting()}, {prof.name}</h1>
          </div>
          <Ring value={c.returned + c.to_mark ? Math.round((c.returned / (c.returned + c.to_mark)) * 100) : null} size={68}
            label={<span className="text-[10px] leading-tight text-brand-100"><b className="block text-white text-[15px] num">{c.to_mark}</b>to mark</span>} />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[[c.students, "students", "/admin/students"], [c.tasks, "tasks", "/admin/assignments"], [c.returned, "returned", "/admin/assignments"], [c.avg === null ? "—" : `${c.avg}%`, "average", "/admin/analysis"]].map(([v, l, h]) => (
            <Link key={l as string} href={h as string} className="rounded-xl bg-white/10 hover:bg-white/15 px-2.5 py-2 transition-colors">
              <div className="text-[17px] font-bold num">{v}</div>
              <div className="text-[11px] text-brand-100">{l}</div>
            </Link>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          {toMark[0] ? (
            <Link href={`/admin/assignments/${toMark[0].id}?f=tomark`} className="flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-white text-ink px-3.5 h-11 text-[13px] font-semibold active:scale-[.99] transition-transform">
              <PenLine size={16} className="text-brand-600 shrink-0" /><span className="truncate">Mark {toMark[0].title}</span>
              <span className="ml-auto chip bg-marigold/25 text-amber-800 num shrink-0">{toMark[0].n} new</span>
            </Link>
          ) : <div className="flex-1 rounded-xl bg-white/10 px-3.5 h-11 grid items-center text-[12.5px] text-brand-100">All submissions are marked.</div>}
          <Link href="/admin/assignments/new" className="rounded-xl bg-white/15 hover:bg-white/20 px-3.5 h-11 inline-flex items-center gap-1.5 text-[13px] font-semibold shrink-0"><Plus size={16} /> Task</Link>
        </div>
      </section>

      {!drive && (
        <Link href="/admin/settings" className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 mb-4 text-[12.5px] text-amber-800">
          <AlertCircle size={16} className="shrink-0" /> Connect Google Drive so students can upload files directly. <ChevronRight size={14} className="ml-auto" />
        </Link>
      )}

      <div className="grid md:grid-cols-2 gap-x-5">
        <Section title="Classes">
          <div className="card divide-y divide-slate-100">
            {classes.map((k) => (
              <Link key={k.class_code} href={`/admin/students?class=${k.class_code}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                <div className="h-9 px-2 rounded-lg bg-brand-50 text-brand-800 grid place-items-center text-[12px] font-bold">{k.class_code}</div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium">{k.n} students</div>
                  <div className="text-[11.5px] text-slate-500">SDS {k.sds} · SES {k.ses}</div>
                </div>
                <ChevronRight size={15} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Waiting to be marked">
          {toMark.length ? (
            <div className="card divide-y divide-slate-100">
              {toMark.map((t) => (
                <Link key={t.id} href={`/admin/assignments/${t.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium truncate">{t.title}</div><div className="text-[11.5px] text-slate-500">{t.class_code || "All classes"}</div></div>
                  <Badge tone="amber">{t.n} new</Badge>
                </Link>
              ))}
            </div>
          ) : <Empty text="Nothing waiting. 🎉" />}
        </Section>

        <Section title="Upcoming deadlines">
          {upcoming.length ? (
            <div className="card divide-y divide-slate-100">
              {upcoming.map((t) => (
                <Link key={t.id} href={`/admin/assignments/${t.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                  <KindIcon kind={t.kind} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                      <DueChip due={t.due_at} />
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${t.total ? (t.subs / t.total) * 100 : 0}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 num">{t.subs} of {t.total} submitted{t.class_code ? ` in ${t.class_code}` : ""}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : <Empty text="No upcoming deadlines." />}
        </Section>

        <Section title="Recent submissions">
          {recent.length ? (
            <div className="card divide-y divide-slate-100">
              {recent.map((r, i) => (
                <Link key={i} href={`/admin/assignments/${r.id}`} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]"><b className="font-medium">{titleCase(r.nickname)}</b> <span className="text-slate-400">({r.class_code})</span></div>
                    <div className="text-[11.5px] text-slate-500 truncate">{r.title}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{fmtDate(r.submitted_at, true)}</span>
                </Link>
              ))}
            </div>
          ) : <Empty text="No submissions yet." />}
        </Section>
      </div>

    </>
  );
}
