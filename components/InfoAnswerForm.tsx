"use client";
import { safe } from "@/lib/safeAction";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { submitInfo } from "@/app/actions/student";
import type { Field } from "@/lib/infoTypes";

export function InfoAnswerForm({ id, fields, answers, open }: { id: number; fields: Field[]; answers: Record<string, string> | null; open: boolean }) {
  const [state, action, pending] = useActionState(safe(submitInfo), null as any);
  const a = answers || {};
  return (
    <form onSubmit={keep(action)} className="space-y-4">
      <input type="hidden" name="request_id" value={id} />
      <fieldset disabled={!open} className="space-y-4">
        {fields.map((f) => {
          const name = `f_${f.id}`, d = a[f.id] ?? "";
          return (
            <div key={f.id}>
              <label className="block text-[13.5px] font-semibold text-ink mb-1.5" htmlFor={name}>
                {f.label}{f.required && <span className="text-rose-500"> *</span>}
              </label>
              {f.type === "long" ? <textarea id={name} name={name} defaultValue={d} rows={3} required={f.required} className="input" />
                : f.type === "choice" ? (
                  <div className="space-y-1.5">
                    {f.options!.map((o) => (
                      <label key={o} className="flex items-center gap-2.5 card px-3 h-11 text-[13.5px] cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                        <input type="radio" name={name} value={o} defaultChecked={d === o} required={f.required} className="accent-brand-600 size-4" />{o}
                      </label>
                    ))}
                  </div>
                ) : f.type === "yesno" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className="flex items-center justify-center gap-2 card h-11 text-[13.5px] font-medium cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800">
                        <input type="radio" name={name} value={o} defaultChecked={d === o} required={f.required} className="sr-only" />{o}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input id={name} name={name} defaultValue={d} required={f.required} className="input h-11 text-[14px]"
                    type={f.type === "number" ? "text" : f.type === "date" ? "date" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                    inputMode={f.type === "number" ? "decimal" : f.type === "phone" ? "tel" : undefined} />
                )}
            </div>
          );
        })}
      </fieldset>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-700">{state.ok}</p>}
      {open ? (
        <button disabled={pending} className="btn-primary h-11 w-full text-[14px]">{pending && <Loader2 size={15} className="animate-spin" />}{answers ? "Update answers" : "Submit"}</button>
      ) : <p className="text-[12.5px] text-slate-500">This request is closed. Contact Sir Aiman to change an answer.</p>}
    </form>
  );
}
