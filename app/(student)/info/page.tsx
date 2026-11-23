import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { requestsForStudent } from "@/lib/info";
import { fmtDate } from "@/lib/format";
import { Badge, DueChip, Empty, PageHeader } from "@/components/ui";

export default async function MyInfo() {
  const s = await requireStudent();
  const rows = await requestsForStudent(s.sid, s.cls!);
  return (
    <>
      <PageHeader title="My info" sub="Information Sir Aiman has asked you for" />
      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((r) => (
            <Link key={r.id} href={`/info/${r.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
              {r.answered_at ? <CheckCircle2 size={22} className="text-emerald-600 shrink-0" /> : <CircleDashed size={22} className="text-amber-500 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold truncate text-ink">{r.title}</div>
                <div className="text-[11.5px] text-slate-500">{r.answered_at ? `Answered ${fmtDate(r.answered_at)}` : `${r.fields.length} questions`}</div>
              </div>
              {!r.open ? <Badge>Closed</Badge> : r.answered_at ? <Badge tone="green">Done</Badge> : <DueChip due={r.due_at} />}
              <ChevronRight size={15} className="text-slate-300" />
            </Link>
          ))}
        </div>
      ) : <Empty text="Nothing to fill in right now." />}
    </>
  );
}
