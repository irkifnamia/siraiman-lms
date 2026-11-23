import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Trash2 } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { describe, r1 } from "@/lib/stats";
import { fmtDate } from "@/lib/format";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { AssessmentForm } from "@/components/AssessmentForm";
import { MarkSheet } from "@/components/MarkSheet";
import { ConfirmButton } from "@/components/Confirm";
import { deleteAssessment, toggleAssessmentPublish } from "@/app/actions/admin";

export default async function Assessment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const classes = await getClasses();
  const back = <Link href="/admin/assessments" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Assessments</Link>;
  if (id === "new") return (<>{back}<PageHeader title="New assessment" /><Card className="p-4"><AssessmentForm classes={classes} /></Card></>);

  const a = (await db()`SELECT * FROM assessments WHERE id = ${Number(id)}`)[0];
  if (!a) notFound();
  const rows = await db()`
    SELECT s.id, s.nickname, s.matric, s.class_code, m.mark::float AS mark, m.grp, m.remark
    FROM students s LEFT JOIN assessment_marks m ON m.student_id = s.id AND m.assessment_id = ${a.id}
    WHERE s.active AND (${a.class_code}::text IS NULL OR s.class_code = ${a.class_code})
    ORDER BY s.class_code, s.nickname`;
  const max = Number(a.max_mark);
  const st = describe(rows.filter((r) => r.mark != null).map((r) => (r.mark / max) * 100));

  return (
    <>
      {back}
      <PageHeader title={a.title}
        sub={<>{a.kind} · {a.class_code || "All classes"} · full mark {max}{a.weight != null && ` · weight ${Number(a.weight)}%`}{a.held_on && ` · ${fmtDate(a.held_on)}`}</>}
        action={<Link href={edit ? `/admin/assessments/${a.id}` : "?edit=1"} className="btn-outline">{edit ? "Close" : "Edit"}</Link>} />
      {edit && (
        <Card className="p-4 mb-5">
          <AssessmentForm a={a} classes={classes} />
          <form action={deleteAssessment} className="mt-4 pt-3 border-t border-slate-100"><input type="hidden" name="id" value={a.id} />
            <ConfirmButton message="Delete this assessment and all its marks?"><Trash2 size={14} /> Delete assessment</ConfirmButton></form>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <Stat label="Entered" value={`${st?.n ?? 0}/${rows.length}`} />
        <Stat label="Mean" value={st ? `${r1(st.mean)}%` : "—"} hint={st ? `High ${r1(st.max)} · Low ${r1(st.min)}` : undefined} />
        <div className="card p-3.5">
          <div className="text-[11.5px] text-slate-500">Students see marks</div>
          <div className="mt-1">{a.published ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</div>
          <form action={toggleAssessmentPublish} className="mt-1.5"><input type="hidden" name="id" value={a.id} />
            <button className="text-[12px] text-brand-700 font-medium inline-flex items-center gap-1">{a.published ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show to students</>}</button></form>
        </div>
      </div>

      <MarkSheet aid={a.id} max={max} group={a.kind === "Group assignment"} rows={rows as any} />
    </>
  );
}
