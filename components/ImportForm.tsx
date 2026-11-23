"use client";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import { importStudents } from "@/app/actions/admin";

export function ImportForm() {
  const [state, action, pending] = useActionState(importStudents, null as any);
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      <p className="text-[12.5px] text-slate-500">
        Export your student sheet as CSV (File → Download → CSV) and upload it. Columns (as in your sheet): KELAS (class), NAMA PENUH (full name), NO MATRIK (matric no.), NICKNAME, SISTEM (system),
        SPM ADDMATH, SPM MATH, DM015, DM025. Existing matric numbers are updated; PINs are kept.
      </p>
      <input name="csv" type="file" accept=".csv,text/csv" className="block text-[12px] file:mr-3 file:h-8 file:px-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:text-[12px] file:font-medium" />
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok}</p>}
      <button disabled={pending} className="btn-outline">{pending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import CSV</button>
    </form>
  );
}
