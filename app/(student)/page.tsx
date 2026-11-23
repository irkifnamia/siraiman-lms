import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { announcementsFor, tasksForStudent } from "@/lib/queries";
import { currentSemester } from "@/lib/db";
import { fmtDate, pct, relDue } from "@/lib/format";
import { Badge, Empty, Section, Stat, statusOf } from "@/components/ui";

export default async function StudentHome() {
  const s = await requireStudent();
  const [tasks, news, sem] = await Promise.all([
    tasksForStudent(s.sid, s.cls!), announcementsFor(s.cls!, 3), currentSemester(),
  ]);
  const pending = tasks.filter((t) => !t.sub_id);
  const returned = tasks.filter((t) => t.sub_status === "returned");
  const avg = returned.length
    ? Math.round(returned.reduce((a, t) => a + (pct(t.mark, t.max_mark) || 0), 0) / returned.length)
    : null;
  const upcoming = pending.filter((t) => !t.due_at || new Date(t.due_at).getTime() > Date.now()).slice(0, 4);

  return (
    <>
      <div className="mb-5">
        <p className="text-[12.5px] text-slate-500">{sem} · {s.cls}</p>
        <h1 className="text-[21px] font-semibold tracking-tight text-slate-900">Hi, {s.name} 👋</h1>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <Stat label="To do" value={pending.length} href="/tasks" />
        <Stat label="Average" value={avg === null ? "—" : `${avg}%`} href="/marks" />
        <Stat label="Submitted" value={`${tasks.length - pending.length}/${tasks.length}`} href="/tasks" />
      </div>

      <Section title="Upcoming" action={<Link href="/tasks" className="text-[12px] text-brand-600">All tasks</Link>}>
        {upcoming.length ? (
          <div className="card divide-y divide-slate-100">
            {upcoming.map((t) => {
              const st = statusOf(t.sub_id ? t : null, t.due_at);
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                    <div className="text-[11.5px] text-slate-500">{t.kind} · {relDue(t.due_at)}</div>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <ChevronRight size={15} className="text-slate-300" />
                </Link>
              );
            })}
          </div>
        ) : <Empty text="You're all caught up." />}
      </Section>

      {returned.length > 0 && (
        <Section title="Recently returned">
          <div className="card divide-y divide-slate-100">
            {returned.sort((a, b) => +new Date(b.returned_at) - +new Date(a.returned_at)).slice(0, 3).map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                  <div className="text-[11.5px] text-slate-500">Returned {fmtDate(t.returned_at)}</div>
                </div>
                <div className="text-[14px] font-semibold text-brand-700">{Number(t.mark)}<span className="text-slate-400 font-normal text-[12px]">/{Number(t.max_mark)}</span></div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Announcements" action={<Link href="/announcements" className="text-[12px] text-brand-600">View all</Link>}>
        {news.length ? (
          <div className="space-y-2">
            {news.map((n) => (
              <div key={n.id} className="card px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                  {n.pinned && <Pin size={13} className="text-brand-600" />}{n.title}
                </div>
                <p className="text-[12.5px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">{n.body}</p>
                <div className="text-[11px] text-slate-400 mt-1.5">{fmtDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        ) : <Empty text="No announcements yet." />}
      </Section>
    </>
  );
}
