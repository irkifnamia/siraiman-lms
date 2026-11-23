import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { requestsForStudent } from "@/lib/info";
import { Card, DueChip, Badge } from "@/components/ui";
import { InfoAnswerForm } from "@/components/InfoAnswerForm";

export default async function FillInfo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireStudent();
  const r = (await requestsForStudent(s.sid, s.cls!)).find((x) => x.id === Number(id));
  if (!r) notFound();
  return (
    <>
      <Link href="/info" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 mb-3"><ArrowLeft size={14} /> My info</Link>
      <Card className="p-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[18px] font-bold leading-snug">{r.title}</h1>
          {r.open ? <DueChip due={r.due_at} done={!!r.answered_at} /> : <Badge>Closed</Badge>}
        </div>
        {r.description && <p className="text-[13px] text-slate-600 mt-1.5 whitespace-pre-line">{r.description}</p>}
      </Card>
      <Card className="p-4"><InfoAnswerForm id={r.id} fields={r.fields} answers={r.answers} open={r.open} /></Card>
    </>
  );
}
