import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Power, Trash2 } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { fmtDate, pct, titleCase } from "@/lib/format";
import { attendanceSummary } from "@/lib/queries";
import { Badge, Card, PageHeader, Section, Stat, statusOf } from "@/components/ui";
import { ConfirmButton } from "@/components/Confirm";
import { StudentForm } from "@/components/StudentForm";
import { deleteStudent, resetPin, toggleActive } from "@/app/actions/admin";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classes = await getClasses();
  if (id === "new") {
    return (
      <>
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Students</Link>
        <PageHeader title="Add student" />
        <Card className="p-4"><StudentForm classes={classes} /></Card>
      </>
    );
  }
  const s = (await db()`SELECT * FROM students WHERE id = ${Number(id)}`)[0];
  if (!s) notFound();
  const [tasks, att] = await Promise.all([
    db()`SELECT a.id, a.title, a.kind, a.due_at, a.max_mark, sb.status, sb.mark, sb.submitted_at
         FROM assignments a LEFT JOIN submissions sb ON sb.assignment_id=a.id AND sb.student_id=${s.id}
         WHERE a.published AND (a.class_code IS NULL OR a.class_code=${s.class_code}) ORDER BY a.due_at NULLS LAST`,
    attendanceSummary(s.id),
  ]);
  const marked = tasks.filter((t) => t.mark !== null);
  const avg = marked.length ? Math.round(marked.reduce((a, t) => a + pct(t.mark, t.max_mark)!, 0) / marked.length) : null;

  return (
    <>
      <Link href={`/admin/students?class=${s.class_code}`} className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> {s.class_code}</Link>
      <PageHeader title={titleCase(s.full_name)} sub={<>{s.nickname} · {s.matric} · {s.class_code} · {s.system} {!s.active && <Badge tone="rose">inactive</Badge>}</>} />

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Average" value={avg === null ? "—" : `${avg}%`} hint={`${marked.length} marked`} />
        <Stat label="Submitted" value={`${tasks.filter((t) => t.status).length}/${tasks.length}`} />
        <Stat label="Attendance" value={att.rate === null ? "—" : `${att.rate}%`} hint={`A ${att.A} · L ${att.L}`} />
      </div>

      <div className="grid md:grid-cols-[1fr_1fr] gap-x-5">
        <Section title="Tasks">
          <div className="card divide-y divide-slate-100">
            {tasks.length ? tasks.map((t) => {
              const st = statusOf(t.status ? t : null, t.due_at);
              return (
                <Link key={t.id} href={`/admin/assignments/${t.id}`} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50">
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate">{t.title}</div><div className="text-[11px] text-slate-400">{t.submitted_at ? fmtDate(t.submitted_at, true) : t.kind}</div></div>
                  {t.mark !== null ? <span className="text-[13px] font-semibold text-brand-700 tabular-nums">{Number(t.mark)}/{Number(t.max_mark)}</span> : <Badge tone={st.tone}>{st.label}</Badge>}
                </Link>
              );
            }) : <div className="px-3.5 py-6 text-center text-[12.5px] text-slate-400">No tasks yet</div>}
          </div>
        </Section>

        <Section title="Profile">
          <Card className="p-4"><StudentForm s={s} classes={classes} /></Card>
          <div className="flex flex-wrap gap-2 mt-3">
            <form action={resetPin}><input type="hidden" name="id" value={s.id} /><button className="btn-outline"><KeyRound size={14} /> Reset PIN</button></form>
            <form action={toggleActive}><input type="hidden" name="id" value={s.id} /><button className="btn-outline"><Power size={14} /> {s.active ? "Deactivate" : "Activate"}</button></form>
            <form action={deleteStudent}><input type="hidden" name="id" value={s.id} /><ConfirmButton message="Delete this student and all their submissions?"><Trash2 size={14} /> Delete</ConfirmButton></form>
          </div>
          <p className="text-[11.5px] text-slate-400 mt-2">
            PIN: {s.pin_hash ? "custom" : `default (${s.matric.slice(-4)})`} · Last login: {s.last_login ? fmtDate(s.last_login, true) : "never"}
          </p>
        </Section>
      </div>
    </>
  );
}
