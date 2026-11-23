import Link from "next/link";
import { Trophy } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { studentById, tasksForStudent } from "@/lib/queries";
import { leaderboard, markedRows } from "@/lib/analysis";
import { describe, gradeOf, r1 } from "@/lib/stats";
import { Badge, Card, Empty, PageHeader, Section, Stat, gradeTone } from "@/components/ui";

export default async function Marks() {
  const s = await requireStudent();
  const [tasks, me, rows] = await Promise.all([tasksForStudent(s.sid, s.cls!), studentById(s.sid), markedRows(true)]);
  const returned = tasks.filter((t) => t.sub_status === "returned");

  // Rankings use only returned marks, within the student's own class.
  const overall = leaderboard(rows, { cls: s.cls });
  const mine = overall.find((b) => b.student_id === s.sid);
  const perTask = new Map(returned.map((t) => {
    const lb = leaderboard(rows, { cls: s.cls, task: t.id });
    return [t.id, { me: lb.find((b) => b.student_id === s.sid), of: lb.length, avg: describe(lb.map((b) => b.score))?.mean }];
  }));

  return (
    <>
      <PageHeader title="My marks" sub={`Returned work · rankings within ${s.cls}`} />
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Average" value={mine ? `${r1(mine.score)}%` : "—"} hint={mine ? `Grade ${gradeOf(mine.score)}` : undefined} />
        <Stat label="Class rank" value={mine ? <span>{mine.rank}<span className="text-[13px] text-slate-400 font-normal">/{overall.length}</span></span> : "—"} />
        <Stat label="Submitted" value={`${tasks.filter((t) => t.sub_id).length}/${tasks.length}`} />
      </div>

      {mine && mine.rank <= 3 && (
        <div className="card px-4 py-3 mb-5 flex items-center gap-3 border-brand-200 bg-brand-50/60">
          <Trophy size={20} className="text-brand-600" />
          <div className="text-[13px]"><b>{["🥇 Top of the class", "🥈 2nd in class", "🥉 3rd in class"][mine.rank - 1]}</b> — keep it up!</div>
        </div>
      )}

      <Section title="Marks & rank per task">
        {returned.length ? (
          <div className="card divide-y divide-slate-100">
            {returned.map((t) => {
              const r = perTask.get(t.id)!;
              const p = (Number(t.mark) / Number(t.max_mark)) * 100;
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                    <div className="text-[11.5px] text-slate-500">
                      {t.kind} · Rank <b className="text-slate-700">{r.me?.rank ?? "—"}</b>/{r.of} · Class avg {r1(r.avg)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-brand-700 tabular-nums">{Number(t.mark)}<span className="text-slate-400 font-normal text-[12px]">/{Number(t.max_mark)}</span></div>
                    <Badge tone={gradeTone(gradeOf(p))}>{gradeOf(p)}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : <Empty text="No marked work yet." />}
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
