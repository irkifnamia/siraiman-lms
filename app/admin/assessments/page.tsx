import Link from "next/link";
import { ChevronRight, EyeOff, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";

export default async function Assessments() {
  const rows = await db()`
    SELECT a.*, (SELECT count(*) FROM assessment_marks m WHERE m.assessment_id = a.id AND m.mark IS NOT NULL)::int entered,
      (SELECT count(*) FROM students s WHERE s.active AND (a.class_code IS NULL OR s.class_code = a.class_code))::int total
    FROM assessments a ORDER BY a.held_on DESC NULLS FIRST, a.id DESC`;
  return (
    <>
      <PageHeader title="Assessments" sub="Marks for work outside Tasks — assignments, group work, presentations"
        action={<Link href="/admin/assessments/new" className="btn-primary"><Plus size={15} /> New</Link>} />
      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((a) => (
            <Link key={a.id} href={`/admin/assessments/${a.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">{!a.published && <EyeOff size={13} className="text-slate-400" />}<span className="truncate">{a.title}</span></div>
                <div className="text-[11.5px] text-slate-500">{a.kind} · {a.class_code || "All classes"} · /{Number(a.max_mark)}{a.weight != null && ` · ${Number(a.weight)}%`}{a.held_on && ` · ${fmtDate(a.held_on)}`}</div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="text-[13px] font-bold num text-ink">{a.entered}/{a.total}</div>
                {a.published ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}
              </div>
              <ChevronRight size={15} className="text-slate-300" />
            </Link>
          ))}
        </div>
      ) : <Empty text="No assessments yet. Add one to record marks for assignments done outside the app."><Link href="/admin/assessments/new" className="btn-primary">New assessment</Link></Empty>}
    </>
  );
}
