import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Send, Trash2 } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { driveConnected, fileHref } from "@/lib/drive";
import { fmtDate, relDue } from "@/lib/format";
import { Badge, Card, PageHeader, Section, Stat } from "@/components/ui";
import { AssignmentForm } from "@/components/AssignmentForm";
import { MarkRow } from "@/components/MarkRow";
import { ConfirmButton } from "@/components/Confirm";
import { deleteAssignment, returnAllMarked } from "@/app/actions/admin";

export default async function AssignmentDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; f?: string; class?: string }>;
}) {
  const { id } = await params;
  const { edit, f = "all", class: cf = "" } = await searchParams;
  const [classes, canUpload] = await Promise.all([getClasses(), driveConnected()]);

  if (id === "new") {
    return (
      <>
        <Link href="/admin/assignments" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Tasks</Link>
        <PageHeader title="New task" />
        <Card className="p-4"><AssignmentForm classes={classes} canUpload={canUpload} /></Card>
      </>
    );
  }

  const aid = Number(id);
  const [ar, rows] = await Promise.all([
    db()`SELECT * FROM assignments WHERE id = ${aid}`,
    db()`
      SELECT st.id, st.nickname, st.matric, st.class_code, sb.id AS sub_pk, sb.file_url, sb.file_name, sb.note,
             sb.submitted_at, sb.status, sb.mark, sb.feedback
      FROM students st
      JOIN assignments a ON a.id = ${aid}
      LEFT JOIN submissions sb ON sb.student_id = st.id AND sb.assignment_id = a.id
      WHERE st.active AND (a.class_code IS NULL OR st.class_code = a.class_code)
      ORDER BY st.class_code, st.nickname`,
  ]);
  const a = ar[0];
  if (!a) notFound();

  const subs = rows.filter((r) => r.file_url);
  const toMark = rows.filter((r) => r.sub_pk && r.status === "submitted");
  const returned = rows.filter((r) => r.status === "returned");
  const markedNotReturned = rows.filter((r) => r.mark !== null && r.status !== "returned").length;
  const filtered = rows.filter((r) =>
    (!cf || r.class_code === cf) &&
    (f === "all" || (f === "submitted" && r.file_url) || (f === "missing" && !r.file_url && !r.sub_pk) ||
      (f === "tomark" && r.sub_pk && r.status === "submitted") || (f === "returned" && r.status === "returned")));
  const byClass = filtered.reduce((m: Record<string, any[]>, r) => ((m[r.class_code] ||= []).push(r), m), {});
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ f, class: cf, ...o }).toString();
  const chip = (on: boolean) => `px-3 h-7 rounded-full text-[12px] border inline-flex items-center whitespace-nowrap ${on ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`;
  const taskClasses = a.class_code ? [a.class_code] : classes;

  return (
    <>
      <Link href="/admin/assignments" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Tasks</Link>
      <PageHeader title={a.title}
        sub={<>{a.kind} · {a.class_code || "All classes"} · {a.due_at ? `${fmtDate(a.due_at, true)} · ${relDue(a.due_at)}` : "No due date"} {!a.published && <Badge>hidden</Badge>}</>}
        action={<Link href={edit ? `/admin/assignments/${a.id}` : `?edit=1`} className="btn-outline">{edit ? "Close" : "Edit"}</Link>} />

      {edit ? (
        <Card className="p-4 mb-5">
          <AssignmentForm a={a} classes={classes} canUpload={canUpload} />
          <form action={deleteAssignment} className="mt-3 pt-3 border-t border-slate-100">
            <input type="hidden" name="id" value={a.id} />
            <ConfirmButton message="Delete this task and all its submissions?"><Trash2 size={14} /> Delete task</ConfirmButton>
          </form>
        </Card>
      ) : (a.description || a.attachment_url) && (
        <Card className="p-4 mb-5">
          {a.description && <p className="text-[13px] text-slate-600 whitespace-pre-line">{a.description}</p>}
          {a.attachment_url && <a href={fileHref(a.attachment_url)!} target="_blank" className="btn-outline mt-3"><FileText size={15} /> Attachment</a>}
        </Card>
      )}

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <Stat label="Submitted" value={`${subs.length}/${rows.length}`} />
        <Stat label="To mark" value={toMark.length} />
        <Stat label="Returned" value={returned.length} />
        <Stat label="Average" value={returned.length ? `${Math.round(returned.reduce((x, r) => x + Number(r.mark), 0) / returned.length * 10) / 10}` : "—"} hint={`out of ${Number(a.max_mark)}`} />
      </div>

      <Section title="Mark & return" action={
        <div className="flex gap-2">
          <a href={`/api/export?type=task&id=${a.id}`} className="btn-ghost h-7 px-2 text-[12px]"><Download size={13} /> CSV</a>
          {markedNotReturned > 0 && (
            <form action={returnAllMarked}><input type="hidden" name="id" value={a.id} />
              <button className="btn-primary h-7 px-2.5 text-[12px]"><Send size={13} /> Return {markedNotReturned} marked</button></form>
          )}
        </div>}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          {[["all", "All"], ["submitted", "Submitted"], ["tomark", "To mark"], ["missing", "Missing"], ["returned", "Returned"]].map(([k, l]) => (
            <Link key={k} href={qs({ f: k })} className={chip(f === k)}>{l}</Link>
          ))}
          {taskClasses.length > 1 && <span className="w-px bg-slate-200 mx-1 shrink-0" />}
          {taskClasses.length > 1 && taskClasses.map((c) => <Link key={c} href={qs({ class: cf === c ? "" : c })} className={chip(cf === c)}>{c}</Link>)}
        </div>
        {Object.keys(byClass).length ? Object.entries(byClass).map(([cls, list]) => (
          <div key={cls} className="mb-4">
            <div className="text-[11.5px] font-semibold text-brand-700 mb-1.5">{cls} <span className="text-slate-400 font-normal">· {(list as any[]).length}</span></div>
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {(list as any[]).map((st) => <MarkRow key={st.id} aid={a.id} max={Number(a.max_mark)} st={st} due={a.due_at} />)}
            </div>
          </div>
        )) : <div className="card py-8 text-center text-[13px] text-slate-400">No students in this filter.</div>}
        <p className="text-[11.5px] text-slate-400">Tip: you can enter marks for paper submissions too — students see the mark only after you press Return.</p>
      </Section>
    </>
  );
}
