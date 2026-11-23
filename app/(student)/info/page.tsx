import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { requestsForStudent } from "@/lib/info";
import { studentById } from "@/lib/queries";
import { fmtDate, titleCase } from "@/lib/format";
import { Badge, Card, DueChip, PageHeader, Section, gradeTone } from "@/components/ui";

export default async function MyInfo() {
  const s = await requireStudent();
  const [me, rows] = await Promise.all([studentById(s.sid), requestsForStudent(s.sid, s.cls!)]);
  const todo = rows.filter((r) => r.open && !r.answered_at).length;

  const basic: [string, string | null][] = [
    ["Full name", titleCase(me.full_name)],
    ["Matric number", me.matric],
    ["Nickname", me.nickname],
    ["Class", me.class_code],
    ["System", me.system === "SDS" ? "SDS (1-year programme)" : me.system === "SES" ? "SES (2-year programme)" : me.system],
    ...(me.email ? [["Email", me.email] as [string, string]] : []),
    ...(me.phone ? [["Phone", me.phone] as [string, string]] : []),
  ];
  const grades: [string, string | null][] = [["SPM Add Math", me.spm_addmath], ["SPM Math", me.spm_math], ["DM015", me.dm015], ["DM025", me.dm025]];

  return (
    <>
      <PageHeader title="My info" sub="Your record with Sir Aiman, plus anything he asks you to fill in" />

      <Section title="Basic info">
        <Card className="divide-y divide-slate-100">
          {basic.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 px-4 py-2.5">
              <div className="w-32 shrink-0 text-[12.5px] text-slate-500">{k}</div>
              <div className="min-w-0 flex-1 text-[13.5px] font-medium text-ink break-words">{v || <span className="text-slate-300">—</span>}</div>
            </div>
          ))}
          <div className="px-4 py-3">
            <div className="text-[12.5px] text-slate-500 mb-2">Grades</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {grades.map(([k, g]) => (
                <div key={k}><div className="text-[10.5px] text-slate-500 leading-tight min-h-7">{k}</div><div className="mt-1"><Badge tone={gradeTone(g)}>{g || "—"}</Badge></div></div>
              ))}
            </div>
          </div>
        </Card>
        <p className="text-[11.5px] text-slate-500 mt-2">Something wrong? Tell Sir Aiman so he can correct your record.</p>
      </Section>

      <Section title={`Requested info${todo ? ` · ${todo} to fill in` : ""}`}>
        {rows.length ? (
          <div className="card divide-y divide-slate-100">
            {rows.map((r) => (
              <Link key={r.id} href={`/info/${r.id}`} className="row flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50">
                {r.answered_at ? <CheckCircle2 size={22} className="text-emerald-600 shrink-0" /> : <CircleDashed size={22} className="text-amber-500 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold truncate text-ink">{r.title}</div>
                  <div className="text-[11.5px] text-slate-500">{r.answered_at ? `Answered ${fmtDate(r.answered_at)}` : `${r.fields.length} question${r.fields.length === 1 ? "" : "s"}`}</div>
                </div>
                {!r.open ? <Badge>Closed</Badge> : r.answered_at ? <Badge tone="green">Done</Badge> : <DueChip due={r.due_at} />}
                <ChevronRight size={15} className="text-slate-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="card border-dashed px-4 py-6 text-center">
            <CircleDashed size={20} className="mx-auto mb-2 text-brand-300" strokeWidth={1.6} />
            <div className="text-[13px] text-slate-600">No requests yet.</div>
            <div className="text-[12px] text-slate-500 mt-0.5">When Sir Aiman asks for information, the form will appear here and on your home screen.</div>
          </div>
        )}
      </Section>
    </>
  );
}
