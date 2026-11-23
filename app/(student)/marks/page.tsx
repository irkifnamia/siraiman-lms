import Link from "next/link";
import { Trophy } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentById, tasksForStudent } from "@/lib/queries";
import { leaderboard, markedRows } from "@/lib/analysis";
import { describe, gradeOf, r1 } from "@/lib/stats";
import { fmtDate } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Section, Stat, gradeTone } from "@/components/ui";

export default async function Performance() {
  const s = await requireStudent();
  const [tasks, me, rows, assess] = await Promise.all([
    tasksForStudent(s.sid, s.cls!), studentById(s.sid), markedRows(true),
    db()`SELECT a.id, a.title, a.kind, a.max_mark::float AS max, a.weight::float AS weight, a.held_on,
           m.mark::float AS mark, m.grp, m.remark,
           (SELECT avg(100.0 * m2.mark / a.max_mark) FROM assessment_marks m2 JOIN students s2 ON s2.id = m2.student_id
             WHERE m2.assessment_id = a.id AND m2.mark IS NOT NULL AND s2.class_code = ${s.cls})::float AS class_avg
         FROM assessments a LEFT JOIN assessment_marks m ON m.assessment_id = a.id AND m.student_id = ${s.sid}
         WHERE a.published AND (a.class_code IS NULL OR a.class_code = ${s.cls})
         ORDER BY a.held_on NULLS LAST, a.id`,
  ]);
  const returned = tasks.filter((t) => t.sub_status === "returned");

  // Rankings use only returned task marks, within the student's own class.
  const overall = leaderboard(rows, { cls: s.cls });
  const mine = overall.find((b) => b.student_id === s.sid);
  const perTask = new Map(returned.map((t) => {
    const lb = leaderboard(rows, { cls: s.cls, task: t.id });
    return [t.id, { me: lb.find((b) => b.student_id === s.sid), of: lb.length, avg: describe(lb.map((b) => b.score))?.mean }];
  }));
  const weighted = assess.filter((a) => a.weight != null && a.mark != null);
  const wGot = weighted.reduce((x, a) => x + (a.mark / a.max) * a.weight, 0);
  const wMax = weighted.reduce((x, a) => x + a.weight, 0);

  return (
    <>
      <PageHeader title="My performance" sub={`Background, task marks and assessments · rankings within ${s.cls}`} />
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Task average" value={mine ? `${r1(mine.score)}%` : "—"} hint={mine ? `Grade ${gradeOf(mine.score)}` : undefined} />
        <Stat label="Class rank" value={mine ? <span>{mine.rank}<span className="text-[13px] text-slate-400 font-normal">/{overall.length}</span></span> : "—"} />
        <Stat label="Assessments" value={wMax ? <span>{r1(wGot)}<span className="text-[13px] text-slate-400 font-normal">/{r1(wMax)}%</span></span> : `${assess.filter((a) => a.mark != null).length}`}
          hint={wMax ? "weighted so far" : "marked"} />
      </div>

      {mine && mine.rank <= 3 && (
        <div className="card px-4 py-3 mb-5 flex items-center gap-3 border-marigold/50 bg-marigold/10">
          <Trophy size={20} className="text-amber-600" />
          <div className="text-[13px]"><b>{["🥇 Top of the class", "🥈 2nd in class", "🥉 3rd in class"][mine.rank - 1]}</b> — keep it up!</div>
        </div>
      )}

      <Section title="1. Academic background">
        <Card className="p-3.5 grid grid-cols-4 gap-2 text-center">
          {[["SPM Add Math", me.spm_addmath], ["SPM Math", me.spm_math], ["DM015", me.dm015], ["DM025", me.dm025]].map(([l, g]) => (
            <div key={l}><div className="text-[10.5px] text-slate-500 leading-tight min-h-7">{l}</div><div className="mt-1"><Badge tone={gradeTone(g)}>{g || "—"}</Badge></div></div>
          ))}
        </Card>
      </Section>

      <Section title="2. Marks & rank for tasks">
        {returned.length ? (
          <div className="card divide-y divide-slate-100">
            {returned.map((t) => {
              const r = perTask.get(t.id)!;
              const p = (Number(t.mark) / Number(t.max_mark)) * 100;
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                    <div className="text-[11.5px] text-slate-500">Rank <b className="text-slate-700">{r.me?.rank ?? "—"}</b>/{r.of} · class avg {r1(r.avg)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-ink num">{Number(t.mark)}<span className="text-slate-400 font-normal text-[12px]">/{Number(t.max_mark)}</span></div>
                    <Badge tone={gradeTone(gradeOf(p))}>{gradeOf(p)}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : <Empty text="No marked tasks yet." />}
      </Section>

      <Section title="3. Assessment marks">
        {assess.length ? (
          <div className="card divide-y divide-slate-100">
            {assess.map((a) => {
              const p = a.mark != null ? (a.mark / a.max) * 100 : null;
              return (
                <div key={a.id} className="flex items-center gap-3 px-3.5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{a.title}</div>
                    <div className="text-[11.5px] text-slate-500">
                      {a.kind}{a.grp && ` · ${a.grp}`}{a.weight != null && ` · ${a.weight}% of course`}{a.class_avg != null && ` · class avg ${r1(a.class_avg)}%`}
                    </div>
                    {a.remark && <div className="text-[12px] text-slate-600 mt-0.5">“{a.remark}”</div>}
                  </div>
                  {p != null ? (
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-ink num">{a.mark}<span className="text-slate-400 font-normal text-[12px]">/{a.max}</span></div>
                      <Badge tone={gradeTone(gradeOf(p))}>{gradeOf(p)}</Badge>
                    </div>
                  ) : <Badge>Not marked</Badge>}
                </div>
              );
            })}
          </div>
        ) : <Empty text="No assessment marks released yet." />}
      </Section>
    </>
  );
}
