import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { attendanceSummary, studentById, tasksForStudent } from "@/lib/queries";
import { pct } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Section, Stat, gradeTone } from "@/components/ui";

export default async function Marks() {
  const s = await requireStudent();
  const [tasks, att, me] = await Promise.all([tasksForStudent(s.sid, s.cls!), attendanceSummary(s.sid), studentById(s.sid)]);
  const returned = tasks.filter((t) => t.sub_status === "returned");
  const totalMark = returned.reduce((a, t) => a + Number(t.mark), 0);
  const totalMax = returned.reduce((a, t) => a + Number(t.max_mark), 0);

  return (
    <>
      <PageHeader title="My marks" sub="Returned work and attendance" />
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Overall" value={totalMax ? `${pct(totalMark, totalMax)}%` : "—"} hint={`${returned.length} marked`} />
        <Stat label="Submitted" value={`${tasks.filter((t) => t.sub_id).length}/${tasks.length}`} />
        <Stat label="Attendance" value={att.rate === null ? "—" : `${att.rate}%`} hint={`${att.total} sessions`} />
      </div>

      <Section title="Marks">
        {returned.length ? (
          <Card className="overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50"><tr><th className="th">Task</th><th className="th text-right">Mark</th><th className="th text-right">%</th></tr></thead>
              <tbody>
                {returned.map((t) => (
                  <tr key={t.id}>
                    <td className="td"><Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand-700">{t.title}</Link><div className="text-[11px] text-slate-400">{t.kind}</div></td>
                    <td className="td text-right tabular-nums">{Number(t.mark)}/{Number(t.max_mark)}</td>
                    <td className="td text-right tabular-nums font-medium text-brand-700">{pct(t.mark, t.max_mark)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : <Empty text="No marked work yet." />}
      </Section>

      <Section title="Attendance">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[["Present", att.P, "green"], ["Late", att.L, "amber"], ["Absent", att.A, "rose"], ["Excused", att.E, "slate"]].map(([l, n, t]) => (
            <div key={l as string} className="card py-2.5"><div className="text-[17px] font-semibold">{n as number}</div><Badge tone={t as string}>{l}</Badge></div>
          ))}
        </div>
      </Section>

      <Section title="Academic background">
        <Card className="p-3.5 grid grid-cols-4 gap-2 text-center">
          {[["SPM Add Math", me.spm_addmath], ["SPM Math", me.spm_math], ["DM015", me.dm015], ["DM025", me.dm025]].map(([l, g]) => (
            <div key={l}><div className="text-[10.5px] text-slate-400">{l}</div><div className="mt-1"><Badge tone={gradeTone(g)}>{g || "—"}</Badge></div></div>
          ))}
        </Card>
      </Section>
    </>
  );
}
