import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, MessageSquare } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { driveConnected, fileHref } from "@/lib/drive";
import { fmtDate, pct, relDue } from "@/lib/format";
import { Badge, Card, statusOf } from "@/components/ui";
import { SubmitForm } from "@/components/SubmitForm";

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireStudent();
  const [ar, sr, canUpload] = await Promise.all([
    db()`SELECT * FROM assignments WHERE id = ${Number(id)} AND published AND (class_code IS NULL OR class_code = ${s.cls})`,
    db()`SELECT * FROM submissions WHERE assignment_id = ${Number(id)} AND student_id = ${s.sid} AND (file_url IS NOT NULL OR status = 'returned')`,
    driveConnected(),
  ]);
  const a = ar[0];
  if (!a) notFound();
  const sub = sr[0];
  const st = statusOf(sub, a.due_at);

  return (
    <>
      <Link href="/tasks" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Tasks</Link>
      <Card className="p-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11.5px] text-brand-600 font-medium">{a.kind}</div>
            <h1 className="text-[17px] font-semibold leading-snug mt-0.5">{a.title}</h1>
          </div>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-[12px]">
          <div><div className="text-slate-400">Due</div><div className="font-medium">{a.due_at ? fmtDate(a.due_at, true) : "—"}</div><div className="text-slate-400 text-[11px]">{relDue(a.due_at)}</div></div>
          <div><div className="text-slate-400">Full mark</div><div className="font-medium">{Number(a.max_mark)}</div></div>
        </div>
        {a.description && <p className="text-[13px] text-slate-600 mt-3 whitespace-pre-line">{a.description}</p>}
        {a.attachment_url && (
          <a href={fileHref(a.attachment_url)!} target="_blank" className="btn-outline mt-3"><FileText size={15} /> Question / attachment</a>
        )}
      </Card>

      {sub?.status === "returned" && (
        <Card className="p-4 mb-3 border-brand-200 bg-brand-50/50">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-brand-700">Marked & returned</div>
            <div className="text-[11.5px] text-slate-500">{fmtDate(sub.returned_at)}</div>
          </div>
          <div className="mt-2 text-[28px] font-semibold text-brand-700">
            {Number(sub.mark)}<span className="text-[15px] text-slate-400 font-normal"> / {Number(a.max_mark)}</span>
            <span className="text-[13px] text-slate-500 font-normal ml-2">{pct(sub.mark, a.max_mark)}%</span>
          </div>
          {sub.feedback && (
            <div className="mt-2 flex gap-2 text-[13px] text-slate-700"><MessageSquare size={15} className="mt-0.5 text-brand-600 shrink-0" /><p className="whitespace-pre-line">{sub.feedback}</p></div>
          )}
        </Card>
      )}

      {sub && (
        <Card className="p-4 mb-3">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Your submission</div>
          {sub.file_url ? (
            <a href={fileHref(sub.file_url)!} target="_blank" className="flex items-center gap-2 text-[13px] text-brand-700 font-medium">
              <ExternalLink size={14} /> {sub.file_name || "Open"}
            </a>
          ) : <div className="text-[13px] text-slate-600">{sub.file_name || "Submitted in class"}</div>}
          <div className="text-[11.5px] text-slate-400 mt-1">Submitted {fmtDate(sub.submitted_at, true)}</div>
          {sub.note && <p className="text-[12.5px] text-slate-600 mt-2">“{sub.note}”</p>}
        </Card>
      )}

      {sub?.status !== "returned" && (
        <Card className="p-4">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-3">{sub ? "Resubmit" : "Submit your work"}</div>
          <SubmitForm id={a.id} canUpload={canUpload} resubmit={!!sub} />
        </Card>
      )}
    </>
  );
}
