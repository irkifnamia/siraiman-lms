"use client";
import { useActionState } from "react";
import Link from "next/link";
import { keep } from "@/lib/keepForm";
import { saveSlot } from "@/app/actions/admin";

const t = (m?: number) => (m == null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SlotForm({ s, classes }: { s?: any; classes: string[] }) {
  const [state, action, pending] = useActionState(saveSlot, null as any);
  return (
    <form onSubmit={keep(action)} className="space-y-3" key={s?.id ?? "new"}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid grid-cols-3 gap-3">
        <label><span className="label">Day</span><select name="day" defaultValue={s?.day ?? 1} className="input">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
        <label><span className="label">Start</span><input name="start" type="time" required defaultValue={t(s?.start_min) || "08:00"} className="input" /></label>
        <label><span className="label">End</span><input name="end" type="time" required defaultValue={t(s?.end_min) || "09:00"} className="input" /></label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label><span className="label">Type</span><select name="kind" defaultValue={s?.kind ?? "Tutorial"} className="input"><option>Tutorial</option><option>Lecture</option><option>Other</option></select></label>
        <label><span className="label">Shown as</span><input name="label" required defaultValue={s?.label ?? ""} placeholder="F3T1 / J1 Lecture" className="input" /></label>
        <label><span className="label">Venue</span><input name="venue" defaultValue={s?.venue ?? ""} placeholder="BT37" className="input uppercase" /></label>
      </div>
      <div>
        <span className="label">Students who see it</span>
        <div className="flex gap-3 flex-wrap">
          {classes.map((c) => (
            <label key={c} className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" name="class_codes" value={c} defaultChecked={s ? s.class_codes.includes(c) : false} className="accent-brand-600 size-4" />{c}</label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary">{s ? "Save slot" : "Add slot"}</button>
        {s && <Link href="/admin/timetable" className="btn-ghost">Cancel</Link>}
      </div>
    </form>
  );
}
