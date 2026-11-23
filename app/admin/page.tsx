import Link from "next/link";
import { ChevronRight, Plus, Megaphone, CheckSquare, ClipboardList, AlertCircle } from "lucide-react";
import { db, currentSemester } from "@/lib/db";
import { driveConnected } from "@/lib/drive";
import { fmtDate, relDue, titleCase } from "@/lib/format";
import { Badge, Empty, PageHeader, Section, Stat } from "@/components/ui";

export default async function AdminHome() {
  const sql = db();
  const [counts, classes, toMark, recent, upcoming, sem, drive] = await Promise.all([
    sql`SELECT
      (SELECT count(*) FROM students WHERE active)::int AS students,
      (SELECT count(*) FROM assignments WHERE published)::int AS tasks,
      (SELECT count(*) FROM submissions WHERE status='submitted')::int AS to_mark,
      (SELECT round(100.0*count(*) FILTER (WHERE status IN ('P','L'))/NULLIF(count(*),0)) FROM attendance)::int AS att`,
    sql`SELECT s.class_code, count(*)::int n,
          count(*) FILTER (WHERE system='SDS')::int sds, count(*) FILTER (WHERE system='SES')::int ses
        FROM students s WHERE active GROUP BY 1 ORDER BY 1`,
    sql`SELECT a.id, a.title, a.class_code, count(s.*)::int n FROM submissions s JOIN assignments a ON a.id=s.assignment_id
        WHERE s.status='submitted' GROUP BY a.id ORDER BY min(s.submitted_at) LIMIT 5`,
    sql`SELECT s.submitted_at, st.nickname, st.class_code, a.title, a.id FROM submissions s
        JOIN students st ON st.id=s.student_id JOIN assignments a ON a.id=s.assignment_id
        WHERE s.file_url IS NOT NULL ORDER BY s.submitted_at DESC LIMIT 6`,
    sql`SELECT a.*, (SELECT count(*) FROM submissions WHERE assignment_id=a.id)::int subs,
          (SELECT count(*) FROM students WHERE active AND (a.class_code IS NULL OR class_code=a.class_code))::int total
        FROM assignments a WHERE published AND due_at > now() ORDER BY due_at LIMIT 4`,
    currentSemester(),
    driveConnected(),
  ]);
  const c = counts[0];

  return (
    <>
      <PageHeader title="Dashboard" sub={sem}
        action={<Link href="/admin/assignments/new" className="btn-primary"><Plus size={15} /> New task</Link>} />

      {!drive && (
        <Link href="/admin/settings" className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 mb-4 text-[12.5px] text-amber-800">
          <AlertCircle size={16} className="shrink-0" /> Connect Google Drive so students can upload files directly. <ChevronRight size={14} className="ml-auto" />
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        <Stat label="Students" value={c.students} hint={`${classes.length} classes`} href="/admin/students" />
        <Stat label="Tasks" value={c.tasks} href="/admin/assignments" />
        <Stat label="To mark" value={c.to_mark} href="/admin/assignments" />
        <Stat label="Attendance" value={c.att === null ? "—" : `${c.att}%`} href="/admin/attendance" />
      </div>

      <div className="grid md:grid-cols-2 gap-x-5">
        <Section title="Classes">
          <div className="card divide-y divide-slate-100">
            {classes.map((k) => (
              <Link key={k.class_code} href={`/admin/students?class=${k.class_code}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center text-[11px] font-semibold">{k.class_code}</div>
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
                <Link key={t.id} href={`/admin/assignments/${t.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
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
                <Link key={t.id} href={`/admin/assignments/${t.id}`} className="block px-3.5 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                    <span className="text-[11.5px] text-slate-500 shrink-0">{relDue(t.due_at)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${t.total ? (t.subs / t.total) * 100 : 0}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{t.subs}/{t.total} submitted · {t.class_code || "All classes"}</div>
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

      <Section title="Quick actions">
        <div className="grid grid-cols-3 gap-2.5">
          {[["/admin/announcements", "Announce", Megaphone], ["/admin/attendance", "Attendance", CheckSquare], ["/admin/gradebook", "Gradebook", ClipboardList]].map(([h, l, I]: any) => (
            <Link key={h} href={h} className="card py-3.5 flex flex-col items-center gap-1.5 text-[12px] font-medium hover:border-brand-300"><I size={18} className="text-brand-600" />{l}</Link>
          ))}
        </div>
      </Section>
    </>
  );
}
