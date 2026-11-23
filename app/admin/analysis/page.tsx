import Link from "next/link";
import { Suspense } from "react";
import { Download, Trophy, TriangleAlert } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { leaderboard, markedRows } from "@/lib/analysis";
import { BANDS, describe, gradeOf, r1 } from "@/lib/stats";
import { titleCase } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Section, Stat, gradeTone } from "@/components/ui";
import { AutoSelect } from "@/components/AutoSelect";

const PASS = 50;

export default async function Analysis({ searchParams }: { searchParams: Promise<{ class?: string; task?: string; ret?: string }> }) {
  const { class: cls = "", task: taskQ = "", ret = "" } = await searchParams;
  const taskId = taskQ ? Number(taskQ) : null;
  const returnedOnly = ret === "1";
  const [classes, tasks, rows] = await Promise.all([
    getClasses(),
    db()`SELECT id, title, kind, class_code, max_mark::float AS max_mark FROM assignments ORDER BY due_at NULLS LAST, id`,
    markedRows(returnedOnly),
  ]);
  const visibleTasks = tasks.filter((t) => !cls || !t.class_code || t.class_code === cls);
  const task = taskId ? tasks.find((t) => t.id === taskId) : null;
  const board = leaderboard(rows, { cls, task: taskId });
  const st = describe(board.map((b) => b.score));
  const passRate = board.length ? Math.round((board.filter((b) => b.score >= PASS).length / board.length) * 100) : null;
  const dist = BANDS.map((b) => ({ ...b, n: board.filter((x) => gradeOf(x.score) === b.g).length }));
  const maxBin = Math.max(1, ...dist.map((d) => d.n));

  const classCmp = !cls ? classes.map((c) => {
    const lb = leaderboard(rows, { cls: c, task: taskId });
    const d = describe(lb.map((x) => x.score));
    return { c, d, top: lb[0], pass: lb.length ? Math.round((lb.filter((x) => x.score >= PASS).length / lb.length) * 100) : null };
  }) : [];

  const taskCmp = !taskId ? visibleTasks.map((t) => {
    const pcts = rows.filter((x) => x.assignment_id === t.id && (!cls || x.class_code === cls)).map((x) => Number(x.pct));
    const d = describe(pcts);
    return { t, d, pass: pcts.length ? Math.round((pcts.filter((p) => p >= PASS).length / pcts.length) * 100) : null };
  }).filter((x) => x.d) : [];

  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ class: cls, task: taskQ, ret, ...o }).toString();
  const chip = (on: boolean) => `px-3 h-7 rounded-full text-[12px] border inline-flex items-center whitespace-nowrap ${on ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`;
  const medal = ["🥇", "🥈", "🥉"];
  const scopeLabel = `${task ? task.title : "All tasks (average %)"} · ${cls || "All classes"}`;

  return (
    <>
      <PageHeader title="Analysis" sub={scopeLabel}
        action={<a href={`/api/export?type=leaderboard&class=${cls}&task=${taskQ}&ret=${ret}`} className="btn-outline px-2.5" title="Export leaderboard CSV"><Download size={15} /></a>} />

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 -mx-1 px-1">
        <Link href={qs({ class: "" })} className={chip(!cls)}>All classes</Link>
        {classes.map((c) => <Link key={c} href={qs({ class: c })} className={chip(cls === c)}>{c}</Link>)}
      </div>
      <div className="flex gap-2 mb-5">
        <Suspense>
          <AutoSelect name="task" value={taskQ} className="input flex-1 min-w-0"
            options={[["", "All tasks · overall average"], ...visibleTasks.map((t) => [String(t.id), `${t.title} (${t.kind}${t.class_code ? " · " + t.class_code : ""})`] as [string, string])]} />
        </Suspense>
        <Link href={qs({ ret: returnedOnly ? "" : "1" })} className={`btn-outline shrink-0 ${returnedOnly ? "!border-brand-400 !text-brand-700" : ""}`} title="Only count marks already returned to students">
          {returnedOnly ? "Returned only" : "All marks"}
        </Link>
      </div>

      {!st ? <Empty text="No marks yet for this selection. Enter marks under Tasks → Mark & return." /> : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
            <Stat label="Students" value={st.n} />
            <Stat label="Mean" value={`${r1(st.mean)}%`} hint={`SD ${r1(st.sd)}`} />
            <Stat label="Median" value={`${r1(st.median)}%`} hint={`IQR ${r1(st.q1)}–${r1(st.q3)}`} />
            <Stat label="Highest" value={`${r1(st.max)}%`} />
            <Stat label="Lowest" value={`${r1(st.min)}%`} />
            <Stat label={`Pass (≥${PASS}%)`} value={`${passRate}%`} />
          </div>

          <div className="grid md:grid-cols-2 gap-x-5">
            <Section title="Grade distribution">
              <Card className="p-4 space-y-1.5">
                {dist.map((d) => (
                  <div key={d.g} className="flex items-center gap-2 text-[12px]">
                    <span className="w-7 font-semibold text-slate-600">{d.g}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded">
                      <div className={`h-full rounded ${d.min >= 65 ? "bg-brand-500" : d.min >= PASS ? "bg-brand-300" : d.min >= 40 ? "bg-amber-400" : "bg-rose-400"}`}
                        style={{ width: `${(d.n / maxBin) * 100}%` }} />
                    </div>
                    <span className="w-14 text-right tabular-nums text-slate-500">{d.n} <span className="text-slate-300">· {Math.round((d.n / st.n) * 100)}%</span></span>
                  </div>
                ))}
                <p className="text-[10.5px] text-slate-400 pt-1">Bands: A ≥80 · A- 75 · B+ 70 · B 65 · B- 60 · C+ 55 · C 50 · C- 45 · D+ 40 · D 35 · F &lt;35</p>
              </Card>
            </Section>

            {!cls ? (
              <Section title="Class comparison">
                <Card className="overflow-hidden">
                  <table className="w-full text-[12.5px]">
                    <thead className="bg-slate-50"><tr><th className="th">Class</th><th className="th text-right">n</th><th className="th text-right">Mean</th><th className="th text-right">Median</th><th className="th text-right">Pass</th><th className="th">Top</th></tr></thead>
                    <tbody>
                      {classCmp.map(({ c, d, top, pass }) => (
                        <tr key={c}>
                          <td className="td font-semibold text-brand-700"><Link href={qs({ class: c })}>{c}</Link></td>
                          <td className="td text-right tabular-nums">{d?.n ?? 0}</td>
                          <td className="td text-right tabular-nums font-medium">{d ? r1(d.mean) : "—"}</td>
                          <td className="td text-right tabular-nums">{d ? r1(d.median) : "—"}</td>
                          <td className="td text-right tabular-nums">{pass ?? "—"}{pass != null && "%"}</td>
                          <td className="td truncate max-w-24">{top ? titleCase(top.nickname) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </Section>
            ) : (
              <Section title="Top 3">
                <div className="grid grid-cols-3 gap-2.5">
                  {board.slice(0, 3).map((b, i) => (
                    <Link key={b.student_id} href={`/admin/students/${b.student_id}`} className="card p-3 text-center hover:border-brand-300">
                      <div className="text-[22px]">{medal[b.rank - 1] || "🏅"}</div>
                      <div className="text-[13px] font-semibold truncate mt-1">{titleCase(b.nickname)}</div>
                      <div className="text-[15px] font-semibold text-brand-700 tabular-nums">{r1(b.score)}%</div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {taskCmp.length > 0 && (
            <Section title="Task performance · hardest first">
              <Card className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-slate-50"><tr><th className="th">Task</th><th className="th text-right">n</th><th className="th text-right">Mean %</th><th className="th text-right">High</th><th className="th text-right">Low</th><th className="th text-right">Pass</th></tr></thead>
                  <tbody>
                    {[...taskCmp].sort((a, b) => a.d!.mean - b.d!.mean).map(({ t, d, pass }) => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="td"><Link href={qs({ task: String(t.id) })} className="font-medium hover:text-brand-700">{t.title}</Link><div className="text-[11px] text-slate-400">{t.kind} · {t.class_code || "All classes"}</div></td>
                        <td className="td text-right tabular-nums">{d!.n}</td>
                        <td className={`td text-right tabular-nums font-semibold ${d!.mean < PASS ? "text-rose-600" : "text-brand-700"}`}>{r1(d!.mean)}</td>
                        <td className="td text-right tabular-nums">{r1(d!.max)}</td>
                        <td className="td text-right tabular-nums">{r1(d!.min)}</td>
                        <td className="td text-right tabular-nums">{pass}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>
          )}

          <Section title={`Leaderboard · ${board.length}`} action={<span className="text-[11px] text-slate-400 flex items-center gap-1"><Trophy size={12} /> ties share a rank</span>}>
            <Card className="overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50"><tr>
                  <th className="th w-12">Rank</th><th className="th">Student</th>
                  {task ? <th className="th text-right">Mark</th> : <th className="th text-right">Tasks</th>}
                  <th className="th text-right">%</th><th className="th text-center">Grade</th>
                </tr></thead>
                <tbody>
                  {board.map((b) => (
                    <tr key={b.student_id} className={b.rank <= 3 ? "bg-brand-50/50" : "hover:bg-slate-50/60"}>
                      <td className="td font-semibold tabular-nums">{b.rank <= 3 ? <span className="text-[16px]">{medal[b.rank - 1]}</span> : b.rank}</td>
                      <td className="td">
                        <Link href={`/admin/students/${b.student_id}`} className="font-medium hover:text-brand-700">{titleCase(b.nickname)}</Link>
                        <div className="text-[11px] text-slate-400">{b.class_code} · {b.matric}</div>
                      </td>
                      <td className="td text-right tabular-nums text-slate-500">{task ? `${b.mark}/${b.max}` : b.n}</td>
                      <td className="td text-right tabular-nums font-semibold text-brand-700">{r1(b.score)}</td>
                      <td className="td text-center"><Badge tone={gradeTone(gradeOf(b.score))}>{gradeOf(b.score)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {board.some((b) => b.score < PASS) && (
            <Section title="Needs attention">
              <Card className="p-3.5">
                <div className="flex items-center gap-1.5 text-[12px] text-amber-700 mb-2"><TriangleAlert size={14} /> Below {PASS}% in this selection</div>
                <div className="flex flex-wrap gap-1.5">
                  {board.filter((b) => b.score < PASS).sort((a, b) => a.score - b.score).map((b) => (
                    <Link key={b.student_id} href={`/admin/students/${b.student_id}`} className="chip bg-rose-50 text-rose-700 hover:bg-rose-100">
                      {titleCase(b.nickname)} · {b.class_code} · {r1(b.score)}%
                    </Link>
                  ))}
                </div>
              </Card>
            </Section>
          )}
        </>
      )}
    </>
  );
}
