"use client";
import { safe } from "@/lib/safeAction";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { saveStudent } from "@/app/actions/admin";

const F = ({ n, l, d, ...p }: any) => (
  <label className="block"><span className="label">{l}</span><input name={n} defaultValue={d ?? ""} className="input" {...p} /></label>
);

export function StudentForm({ s, classes }: { s?: any; classes: string[] }) {
  const [state, action, pending] = useActionState(safe(saveStudent), null as any);
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid grid-cols-2 gap-3">
        <F n="matric" l="Matric no." d={s?.matric} required className="input uppercase" />
        <F n="nickname" l="Nickname" d={s?.nickname} className="input uppercase" />
      </div>
      <F n="full_name" l="Full name" d={s?.full_name} required className="input uppercase" />
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Class</span>
          <input name="class_code" list="classes" defaultValue={s?.class_code ?? ""} className="input uppercase" />
          <datalist id="classes">{classes.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="block"><span className="label">System</span>
          <select name="system" defaultValue={s?.system ?? "SDS"} className="input"><option>SDS</option><option>SES</option></select>
        </label>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <F n="spm_addmath" l="SPM AM" d={s?.spm_addmath} />
        <F n="spm_math" l="SPM Math" d={s?.spm_math} />
        <F n="dm015" l="DM015" d={s?.dm015} />
        <F n="dm025" l="DM025" d={s?.dm025} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F n="email" l="Email" d={s?.email} type="email" />
        <F n="phone" l="Phone" d={s?.phone} type="tel" />
      </div>
      <label className="block"><span className="label">Notes (private)</span><textarea name="notes" defaultValue={s?.notes ?? ""} className="input" rows={2} /></label>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok}</p>}
      <button disabled={pending} className="btn-primary">{s ? "Save changes" : "Add student"}</button>
    </form>
  );
}
