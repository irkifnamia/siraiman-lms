import Link from "next/link";
import { ChevronRight, Plus, EyeOff } from "lucide-react";
import { db } from "@/lib/db";
import { fmtDate, relDue } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";

export default async function Assignments() {
  const rows = await db()`
    SELECT a.*,
      (SELECT count(*) FROM submissions WHERE assignment_id=a.id AND file_url IS NOT NULL)::int subs,
      (SELECT count(*) FROM submissions WHERE assignment_id=a.id AND status='submitted')::int pending,
      (SELECT count(*) FROM submissions WHERE assignment_id=a.id AND status='returned')::int returned,
      (SELECT count(*) FROM students WHERE active AND (a.class_code IS NULL OR class_code=a.class_code))::int total
    FROM assignments a ORDER BY a.due_at DESC NULLS FIRST, a.id DESC`;

  return (
    <>
      <PageHeader title="Tasks" sub="Tutorials, quizzes, assignments"
        action={<Link href="/admin/assignments/new" className="btn-primary"><Plus size={15} /> New</Link>} />
      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((a) => (
            <Link key={a.id} href={`/admin/assignments/${a.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                  {!a.published && <EyeOff size={13} className="text-slate-400" />}<span className="truncate">{a.title}</span>
                </div>
                <div className="text-[11.5px] text-slate-500">
                  {a.kind} · {a.class_code || "All classes"} · {a.due_at ? `${fmtDate(a.due_at, true)} (${relDue(a.due_at)})` : "No due date"}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12.5px] font-medium tabular-nums">{a.subs}/{a.total}</div>
                {a.pending > 0 ? <Badge tone="amber">{a.pending} to mark</Badge> : a.returned > 0 ? <Badge tone="green">{a.returned} returned</Badge> : null}
              </div>
              <ChevronRight size={15} className="text-slate-300" />
            </Link>
          ))}
        </div>
      ) : <Empty text="No tasks yet."><Link href="/admin/assignments/new" className="btn-primary">Create the first task</Link></Empty>}
    </>
  );
}
