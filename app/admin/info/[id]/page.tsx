import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock, Trash2, Unlock } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { targetsOf } from "@/lib/info";
import { fmtDate, titleCase } from "@/lib/format";
import { Badge, Card, DueChip, PageHeader, Section, Stat } from "@/components/ui";
import { InfoRequestForm } from "@/components/InfoRequestForm";
import { ConfirmButton } from "@/components/Confirm";
import { deleteInfoRequest, toggleInfoOpen } from "@/app/actions/admin";

export default async function InfoRequest({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; f?: string }> }) {
  const { id } = await params;
  const { edit, f = "all" } = await searchParams;
  const [classes, students] = await Promise.all([
    getClasses(),
    db()`SELECT id, nickname, matric, class_code FROM students WHERE active ORDER BY class_code, nickname`,
  ]);
  const back = <Link href="/admin/info" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> Info requests</Link>;
  if (id === "new") return (<>{back}<PageHeader title="New info request" /><Card className="p-4"><InfoRequestForm classes={classes} students={students as any} /></Card></>);

  const r = (await db()`SELECT * FROM info_requests WHERE id = ${Number(id)}`)[0];
  if (!r) notFound();
  const [targets, resps] = await Promise.all([targetsOf(r), db()`SELECT * FROM info_responses WHERE request_id = ${r.id}`]);
  const byStudent = new Map(resps.map((x) => [x.student_id, x]));
  const answered = targets.filter((t) => byStudent.has(t.id));
  const list = targets.filter((t) => f === "all" || (f === "answered" ? byStudent.has(t.id) : !byStudent.has(t.id)))
    .sort((x, y) => Number(byStudent.has(y.id)) - Number(byStudent.has(x.id)));
  const chip = (on: boolean) => `px-3 h-7 rounded-full text-[12px] border inline-flex items-center ${on ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`;

  return (
    <>
      {back}
      <PageHeader title={r.title} sub={<>{r.description}</>}
        action={<Link href={edit ? `/admin/info/${r.id}` : "?edit=1"} className="btn-outline">{edit ? "Close" : "Edit"}</Link>} />
      {edit && (
        <Card className="p-4 mb-5">
          <InfoRequestForm r={r} classes={classes} students={students as any} />
          <form action={deleteInfoRequest} className="mt-4 pt-3 border-t border-slate-100"><input type="hidden" name="id" value={r.id} />
            <ConfirmButton message="Delete this request and all answers?"><Trash2 size={14} /> Delete request</ConfirmButton></form>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Answered" value={`${answered.length}/${targets.length}`} />
        <Stat label="Waiting" value={targets.length - answered.length} />
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="text-[11.5px] text-slate-500">Status</div>
          <div className="flex items-center gap-2 mt-1">{r.open ? <DueChip due={r.due_at} /> : <Badge>Closed</Badge>}</div>
          <form action={toggleInfoOpen} className="mt-1.5"><input type="hidden" name="id" value={r.id} />
            <button className="text-[12px] text-brand-700 font-medium inline-flex items-center gap-1">{r.open ? <><Lock size={12} /> Close</> : <><Unlock size={12} /> Reopen</>}</button></form>
        </div>
      </div>

      <Section title="Answers" action={<a href={`/api/export?type=info&id=${r.id}`} className="btn-ghost h-7 px-2 text-[12px]"><Download size={13} /> CSV</a>}>
        <div className="flex gap-1.5 mb-3">
          {[["all", "All"], ["answered", "Answered"], ["missing", "Not yet"]].map(([k, l]) => <Link key={k} href={`?f=${k}`} className={chip(f === k)}>{l}</Link>)}
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-slate-50"><tr>
              <th className="th sticky left-0 bg-slate-50 min-w-32">Student</th>
              {r.fields.map((fl: any) => <th key={fl.id} className="th normal-case tracking-normal font-medium min-w-32">{fl.label}</th>)}
              <th className="th">Updated</th>
            </tr></thead>
            <tbody>
              {list.map((t) => {
                const a = byStudent.get(t.id);
                return (
                  <tr key={t.id} className={a ? "" : "bg-rose-50/30"}>
                    <td className="td sticky left-0 bg-white"><Link href={`/admin/students/${t.id}`} className="font-medium hover:text-brand-700">{titleCase(t.nickname)}</Link><div className="text-[11px] text-slate-400">{t.class_code} · {t.matric}</div></td>
                    {r.fields.map((fl: any) => <td key={fl.id} className="td whitespace-pre-line">{a?.answers?.[fl.id] ?? <span className="text-slate-300">—</span>}</td>)}
                    <td className="td text-slate-400 whitespace-nowrap">{a ? fmtDate(a.updated_at, true) : "Waiting"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
