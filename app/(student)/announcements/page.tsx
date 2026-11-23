import { Pin } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { announcementsFor } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";

export default async function News() {
  const s = await requireStudent();
  const rows = await announcementsFor(s.cls!);
  return (
    <>
      <PageHeader title="Announcements" />
      {rows.length ? (
        <div className="space-y-2.5">
          {rows.map((n) => (
            <article key={n.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[14px] font-medium flex items-center gap-1.5">{n.pinned && <Pin size={13} className="text-brand-600" />}{n.title}</h2>
                {n.class_code && <Badge tone="teal">{n.class_code}</Badge>}
              </div>
              <p className="text-[13px] text-slate-600 mt-1.5 whitespace-pre-line">{n.body}</p>
              <div className="text-[11px] text-slate-400 mt-2">{fmtDate(n.created_at, true)}</div>
            </article>
          ))}
        </div>
      ) : <Empty text="No announcements yet." />}
    </>
  );
}
