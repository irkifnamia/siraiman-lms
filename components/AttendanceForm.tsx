"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveAttendance } from "@/app/actions/admin";

const OPTS = [
  ["P", "Present", "peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500"],
  ["L", "Late", "peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500"],
  ["A", "Absent", "peer-checked:bg-rose-500 peer-checked:text-white peer-checked:border-rose-500"],
  ["E", "Excused", "peer-checked:bg-slate-500 peer-checked:text-white peer-checked:border-slate-500"],
] as const;

export function AttendanceForm({ cls, date, students, existing }: { cls: string; date: string; students: any[]; existing: Record<number, string> }) {
  const [state, action, pending] = useActionState(saveAttendance, null as any);
  const [vals, setVals] = useState<Record<number, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, existing[s.id] || "P"])));
  const count = (k: string) => Object.values(vals).filter((v) => v === k).length;

  return (
    <form action={action}>
      <input type="hidden" name="class_code" value={cls} />
      <input type="hidden" name="date" value={date} />
      <div className="flex items-center gap-3 text-[12px] mb-2 text-slate-500">
        {OPTS.map(([k, l]) => <span key={k}>{l} <b className="text-slate-800">{count(k)}</b></span>)}
        <button type="button" onClick={() => setVals(Object.fromEntries(students.map((s) => [s.id, "P"])))} className="ml-auto text-brand-600 font-medium">All present</button>
      </div>
      <div className="card divide-y divide-slate-100 mb-3">
        {students.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 px-3.5 py-2">
            <span className="w-5 text-[11px] text-slate-400 tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1 text-[13px] font-medium truncate">{s.nickname}</div>
            <div className="flex gap-1">
              {OPTS.map(([k, l, cls]) => (
                <label key={k} title={l}>
                  <input type="radio" name={`s_${s.id}`} value={k} checked={vals[s.id] === k}
                    onChange={() => setVals({ ...vals, [s.id]: k })} className="peer sr-only" />
                  <span className={`size-8 grid place-items-center rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-500 cursor-pointer select-none ${cls}`}>{k}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-20 md:bottom-4">
        <button disabled={pending} className="btn-primary w-full h-10 shadow-lg shadow-brand-900/10">
          {pending && <Loader2 size={15} className="animate-spin" />} {existing && Object.keys(existing).length ? "Update attendance" : "Save attendance"}
        </button>
        {state?.ok && <p className="text-center text-[12px] text-emerald-600 mt-1.5">{state.ok} ✓</p>}
      </div>
    </form>
  );
}
