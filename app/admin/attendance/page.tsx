import Link from "next/link";
import { db, getClasses } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader, Section } from "@/components/ui";
import { AttendanceForm } from "@/components/AttendanceForm";

function todayMYT() {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
}

export default async function Attendance({ searchParams }: { searchParams: Promise<{ class?: string; date?: string }> }) {
  const classes = await getClasses();
  const { class: cls = classes[0], date = todayMYT() } = await searchParams;
  const [students, existing, history] = await Promise.all([
    db()`SELECT id, nickname, matric FROM students WHERE active AND class_code = ${cls} ORDER BY nickname`,
    db()`SELECT student_id, status FROM attendance WHERE class_code = ${cls} AND session_date = ${date}`,
    db()`SELECT session_date::text d, count(*) FILTER (WHERE status='P')::int p, count(*) FILTER (WHERE status='L')::int l,
           count(*) FILTER (WHERE status='A')::int a, count(*)::int n
         FROM attendance WHERE class_code = ${cls} GROUP BY 1 ORDER BY 1 DESC LIMIT 12`,
  ]);
  const ex = Object.fromEntries(existing.map((e) => [e.student_id, e.status]));

  return (
    <>
      <PageHeader title="Attendance" sub={`${cls} · ${fmtDate(date)}`} />
      <form className="flex gap-2 mb-4">
        <select name="class" defaultValue={cls} className="input w-28">{classes.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="date" name="date" defaultValue={date} className="input flex-1" />
        <button className="btn-outline">Go</button>
      </form>

      <AttendanceForm key={`${cls}-${date}`} cls={cls} date={date} students={students} existing={ex} />

      {history.length > 0 && (
        <Section title="Previous sessions">
          <div className="card divide-y divide-slate-100 mt-4">
            {history.map((h) => (
              <Link key={h.d} href={`?class=${cls}&date=${h.d}`} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 text-[12.5px]">
                <span className="font-medium flex-1">{fmtDate(h.d)}</span>
                <span className="text-emerald-600">P {h.p}</span><span className="text-amber-600">L {h.l}</span><span className="text-rose-600">A {h.a}</span>
                <span className="text-slate-400 w-12 text-right">{Math.round(((h.p + h.l) / h.n) * 100)}%</span>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
