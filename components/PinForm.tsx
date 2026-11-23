"use client";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { changePin } from "@/app/actions/auth";

export function PinForm() {
  const [state, action, pending] = useActionState(changePin, null as any);
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Current PIN</span><input name="current" type="password" inputMode="numeric" required className="input" /></label>
        <label><span className="label">New PIN (4–8 digits)</span><input name="next" type="password" inputMode="numeric" required className="input" /></label>
      </div>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok}</p>}
      <button disabled={pending} className="btn-primary">Update PIN</button>
    </form>
  );
}
