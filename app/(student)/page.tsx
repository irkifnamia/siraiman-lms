import Link from "next/link";
import { ChevronRight, ClipboardCheck, Pin } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { announcementsFor, tasksForStudent } from "@/lib/queries";
import { requestsForStudent } from "@/lib/info";
import { currentSemester, db } from "@/lib/db";
import { QuickLinks } from "@/components/QuickLinks";
import { nowAndNext, slotsForClass } from "@/lib/timetable";
import { NextClass } from "@/components/Timetable";
import { fmtDate, pct, titleCase } from "@/lib/format";
import { DueChip, Empty, KindIcon, Ring, Section, greeting } from "@/components/ui";

export default async function StudentHome() {
  const s = await requireStudent();
  const [tasks, news, sem, infos, links] = await Promise.all([tasksForStudent(s.sid, s.cls!), announcementsFor(s.cls!, 3), currentSemester(), requestsForStudent(s.sid, s.cls!),
    db()`SELECT id, title, url FROM resources WHERE category = 'Websites' AND (class_code IS NULL OR class_code = ${s.cls}) ORDER BY id`]);
  const tt = nowAndNext(await slotsForClass(s.cls!));
  const infoTodo = infos.filter((r) => r.open && !r.answered_at);
  const pending = tasks.filter((t) => !t.sub_id);
  const returned = tasks.filter((t) => t.sub_status === "returned");
  const done = tasks.length - pending.length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : null;
  const avg = returned.length ? Math.round(returned.reduce((a, t) => a + (pct(t.mark, t.max_mark) || 0), 0) / returned.length) : null;
  const upcoming = pending.filter((t) => !t.due_at || new Date(t.due_at).getTime() > Date.now());
  const overdue = pending.filter((t) => t.due_at && new Date(t.due_at).getTime() <= Date.now());
  const next = overdue[0] || upcoming[0];
  const today = new Date().toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      {/* Hero: the one bold element — graph paper, progress, what's next */}
      <section className="graph-teal rounded-2xl text-white p-5 mb-5 shadow-[0_8px_24px_-12px_rgba(15,61,58,.6)]">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-brand-100">{today}</p>
            <h1 className="!text-white text-[22px] font-bold leading-tight mt-0.5">{greeting()}, {titleCase(s.name)}</h1>
            <p className="text-[12.5px] text-brand-100 mt-1">{s.cls} · {sem}</p>
          </div>
          <Ring value={progress} size={68} label={<span className="text-[15px] font-bold num">{progress ?? 0}<span className="text-[10px]">%</span></span>} />
        </div>
        <div className="flex gap-5 mt-4 text-[12px] text-brand-100">
          <span><b className="text-white text-[15px] num">{done}</b>/{tasks.length} submitted</span>
          <span><b className="text-white text-[15px] num">{pending.length}</b> to do</span>
          {avg !== null && <span><b className="text-white text-[15px] num">{avg}%</b> average</span>}
        </div>
        {next ? (
          <Link href={`/tasks/${next.id}`} className="mt-4 flex items-center gap-3 rounded-xl bg-white text-slate-800 p-3 active:scale-[.99] transition-transform">
            <KindIcon kind={next.kind} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">{overdue.length ? "Overdue — submit now" : "Next up"}</div>
              <div className="text-[14px] font-semibold truncate text-ink">{next.title}</div>
            </div>
            <DueChip due={next.due_at} />
          </Link>
        ) : (
          <div className="mt-4 rounded-xl bg-white/10 px-3 py-2.5 text-[12.5px]">Nothing due. Check the learning plan for what's coming next.</div>
        )}
      </section>

      {(tt.current || tt.next) && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2"><h2 className="text-[14px] font-semibold">My next class</h2><Link href="/plan" className="text-[12px] text-brand-700 font-medium">Timetable</Link></div>
          <NextClass now={tt.current} next={tt.next} today={tt.day} />
        </div>
      )}

      <QuickLinks links={links as any} />

      {infoTodo.length > 0 && (
        <Link href={infoTodo.length === 1 ? `/info/${infoTodo[0].id}` : "/info"} className="row card flex items-center gap-3 px-3.5 py-3 mb-5 border-marigold/60 bg-marigold/10">
          <div className="size-9 rounded-lg bg-marigold/30 text-amber-800 grid place-items-center shrink-0"><ClipboardCheck size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-ink truncate">{infoTodo.length === 1 ? infoTodo[0].title : `${infoTodo.length} info requests`}</div>
            <div className="text-[11.5px] text-amber-800">Sir Aiman needs some information from you</div>
          </div>
          <ChevronRight size={16} className="text-amber-700" />
        </Link>
      )}

      {upcoming.length > 1 && (
        <Section title="Coming up" action={<Link href="/tasks" className="text-[12px] text-brand-700 font-medium">All tasks</Link>}>
          <div className="card divide-y divide-slate-100">
            {upcoming.filter((t) => t !== next).slice(0, 3).map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="row flex items-center gap-3 px-3.5 py-3">
                <KindIcon kind={t.kind} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                  <div className="text-[11.5px] text-slate-500">{t.kind}</div>
                </div>
                <DueChip due={t.due_at} />
              </Link>
            ))}
          </div>
        </Section>
      )}

      {returned.length > 0 && (
        <Section title="Recently marked" action={<Link href="/marks" className="text-[12px] text-brand-700 font-medium">Performance</Link>}>
          <div className="card divide-y divide-slate-100">
            {[...returned].sort((a, b) => +new Date(b.returned_at) - +new Date(a.returned_at)).slice(0, 3).map((t) => {
              const p = pct(t.mark, t.max_mark) ?? 0;
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="row flex items-center gap-3 px-3.5 py-3">
                  <Ring value={p} size={34} stroke={4} track="#e2efec" color={p >= 50 ? "#0d8078" : "#e11d48"} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                    <div className="text-[11.5px] text-slate-500">Returned {fmtDate(t.returned_at)}</div>
                  </div>
                  <div className="text-[15px] font-bold text-ink num">{Number(t.mark)}<span className="text-slate-400 font-normal text-[12px]">/{Number(t.max_mark)}</span></div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Announcements" action={<Link href="/announcements" className="text-[12px] text-brand-700 font-medium">View all</Link>}>
        {news.length ? (
          <div className="space-y-2">
            {news.map((n) => (
              <article key={n.id} className={`card px-4 py-3 ${n.pinned ? "border-l-4 border-l-marigold" : ""}`}>
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                  {n.pinned && <Pin size={13} className="text-amber-600" />}{n.title}
                </div>
                <p className="text-[12.5px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">{n.body}</p>
                <div className="text-[11px] text-slate-400 mt-1.5">{fmtDate(n.created_at)}</div>
              </article>
            ))}
          </div>
        ) : <Empty text="No announcements yet." />}
      </Section>
    </>
  );
}
