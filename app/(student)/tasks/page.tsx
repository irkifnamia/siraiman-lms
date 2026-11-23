import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { tasksForStudent } from "@/lib/queries";
import { fmtDate, relDue } from "@/lib/format";
import { Badge, Empty, PageHeader, Section, statusOf } from "@/components/ui";

export default async function Tasks() {
  const s = await requireStudent();
  const tasks = await tasksForStudent(s.sid, s.cls!);
  const todo = tasks.filter((t) => !t.sub_id);
  const done = tasks.filter((t) => t.sub_id);

  const Row = ({ t }: { t: any }) => {
    const st = statusOf(t.sub_id ? { status: t.sub_status, submitted_at: t.submitted_at } : null, t.due_at);
    return (
      <Link href={`/tasks/${t.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium truncate">{t.title}</div>
          <div className="text-[11.5px] text-slate-500">
            {t.kind} · {t.sub_id ? `Submitted ${fmtDate(t.submitted_at)}` : relDue(t.due_at)}
          </div>
        </div>
        {t.sub_status === "returned"
          ? <span className="text-[13px] font-semibold text-brand-700">{Number(t.mark)}/{Number(t.max_mark)}</span>
          : <Badge tone={st.tone}>{st.label}</Badge>}
        <ChevronRight size={15} className="text-slate-300" />
      </Link>
    );
  };

  return (
    <>
      <PageHeader title="Tasks" sub="Tutorials, quizzes and assignments" />
      <Section title={`To do · ${todo.length}`}>
        {todo.length ? <div className="card divide-y divide-slate-100">{todo.map((t) => <Row key={t.id} t={t} />)}</div>
          : <Empty text="Nothing to submit right now." />}
      </Section>
      <Section title={`Submitted · ${done.length}`}>
        {done.length ? <div className="card divide-y divide-slate-100">{done.map((t) => <Row key={t.id} t={t} />)}</div>
          : <Empty text="No submissions yet." />}
      </Section>
    </>
  );
}
