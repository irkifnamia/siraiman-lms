import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { DueChip, Empty, PageHeader, Badge } from "@/components/ui";

export default async function InfoRequests() {
  const rows = await db()`
    SELECT r.*, (SELECT count(*) FROM info_responses WHERE request_id = r.id)::int answered,
      (SELECT count(*) FROM students s WHERE s.active AND (
        (coalesce(cardinality(r.target_classes),0)=0 AND coalesce(cardinality(r.target_students),0)=0)
        OR s.class_code = ANY(r.target_classes) OR s.id = ANY(r.target_students)))::int total
    FROM info_requests r ORDER BY r.open DESC, r.created_at DESC`;
  const who = (r: any) => r.target_students?.length ? `${r.target_students.length} students` : r.target_classes?.length ? r.target_classes.join(", ") : "All students";
  return (
    <>
      <PageHeader title="Info requests" sub="Ask students for information"
        action={<Link href="/admin/info/new" className="btn-primary"><Plus size={15} /> New</Link>} />
      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/info/${r.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold truncate text-ink">{r.title}</div>
                <div className="text-[11.5px] text-slate-500">{who(r)} · {r.fields.length} questions</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-56">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${r.total ? (r.answered / r.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="text-[13px] font-bold num text-ink">{r.answered}/{r.total}</div>
                {r.open ? <DueChip due={r.due_at} /> : <Badge>Closed</Badge>}
              </div>
              <ChevronRight size={15} className="text-slate-300" />
            </Link>
          ))}
        </div>
      ) : <Empty text="No requests yet. Create one to collect details like phone numbers or addresses."><Link href="/admin/info/new" className="btn-primary">New request</Link></Empty>}
    </>
  );
}
