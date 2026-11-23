import Link from "next/link";
import { Download } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { pct } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";

export default async function Gradebook({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const classes = await getClasses();
  const { class: cls = classes[0] } = await searchParams;
  const [tasks, students, subs] = await Promise.all([
    db()`SELECT id, title, kind, max_mark FROM assignments WHERE class_code IS NULL OR class_code = ${cls} ORDER BY due_at NULLS LAST, id`,
    db()`SELECT id, nickname, matric FROM students WHERE active AND class_code = ${cls} ORDER BY nickname`,
    db()`SELECT sb.student_id, sb.assignment_id, sb.mark, sb.status, sb.file_url FROM submissions sb JOIN students s ON s.id = sb.student_id WHERE s.class_code = ${cls}`,
  ]);
  const key = (s: number, a: number) => `${s}:${a}`;
  const map = new Map(subs.map((x) => [key(x.student_id, x.assignment_id), x]));
  const colAvg = tasks.map((t) => {
    const ms = students.map((s) => map.get(key(s.id, t.id))?.mark).filter((m) => m !== null && m !== undefined).map(Number);
    return ms.length ? pct(ms.reduce((a, b) => a + b, 0) / ms.length, t.max_mark) : null;
  });

  return (
    <>
      <PageHeader title="Gradebook" sub="Marks by class · grey = not yet returned"
        action={<a href={`/api/export?type=gradebook&class=${cls}`} className="btn-outline"><Download size={15} /> CSV</a>} />
      <div className="flex gap-1.5 mb-3">
        {classes.map((c) => (
          <Link key={c} href={`?class=${c}`} className={`px-3 h-7 rounded-full text-[12px] border inline-flex items-center ${c === cls ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`}>{c}</Link>
        ))}
      </div>
      {!tasks.length ? <Empty text="No tasks for this class yet." /> : (
        <div className="card overflow-auto max-h-[70dvh]">
          <table className="text-[12.5px] border-separate border-spacing-0 min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50">
                <th className="th sticky left-0 bg-slate-50 z-10 min-w-36">Student</th>
                {tasks.map((t) => (
                  <th key={t.id} className="th text-center min-w-20 normal-case tracking-normal font-medium">
                    <Link href={`/admin/assignments/${t.id}`} className="hover:text-brand-700 line-clamp-2" title={t.title}>{t.title}</Link>
                    <div className="text-slate-400 font-normal">/{Number(t.max_mark)}</div>
                  </th>
                ))}
                <th className="th text-center">Avg %</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const ps = tasks.map((t) => { const m = map.get(key(s.id, t.id)); return m?.mark != null ? pct(m.mark, t.max_mark) : null; }).filter((x) => x !== null) as number[];
                const avg = ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : null;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="td sticky left-0 bg-white font-medium"><Link href={`/admin/students/${s.id}`} className="hover:text-brand-700">{s.nickname}</Link></td>
                    {tasks.map((t) => {
                      const m = map.get(key(s.id, t.id));
                      return (
                        <td key={t.id} className="td text-center tabular-nums">
                          {m?.mark != null ? <span className={m.status === "returned" ? "text-slate-800" : "text-slate-400"}>{Number(m.mark)}</span>
                            : m?.file_url ? <span className="text-amber-500" title="Submitted, not marked">●</span>
                            : <span className="text-slate-200">—</span>}
                        </td>
                      );
                    })}
                    <td className={`td text-center font-semibold tabular-nums ${avg === null ? "text-slate-300" : avg >= 80 ? "text-emerald-600" : avg >= 50 ? "text-brand-700" : "text-rose-600"}`}>{avg ?? "—"}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-medium">
                <td className="td sticky left-0 bg-slate-50 text-[11.5px] text-slate-500">Class avg %</td>
                {colAvg.map((v, i) => <td key={i} className="td text-center tabular-nums text-slate-600">{v ?? "—"}</td>)}
                <td className="td" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
