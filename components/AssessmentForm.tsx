"use client";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { saveAssessment } from "@/app/actions/admin";

export const ASSESSMENT_KINDS = ["Individual assignment", "Group assignment", "Test", "Quiz", "Presentation", "Lab / practical", "Project", "Other"];

export function AssessmentForm({ a, classes }: { a?: any; classes: string[] }) {
  const [state, action, pending] = useActionState(saveAssessment, null as any);
  const d = (v: any) => (v ? new Date(v).toISOString().slice(0, 10) : "");
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      {a && <input type="hidden" name="id" value={a.id} />}
      <input name="title" required defaultValue={a?.title ?? ""} placeholder="Name, e.g. Individual Assignment 1" className="input h-10 text-[14px] font-semibold" />
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Type</span>
          <select name="kind" defaultValue={a?.kind ?? "Individual assignment"} className="input">{ASSESSMENT_KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label><span className="label">Class</span>
          <select name="class_code" defaultValue={a?.class_code ?? ""} className="input"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label><span className="label">Full mark</span><input name="max_mark" type="number" step="0.5" min="1" required defaultValue={a ? Number(a.max_mark) : 100} className="input" /></label>
        <label><span className="label">Weight % (optional)</span><input name="weight" type="number" step="0.5" min="0" max="100" defaultValue={a?.weight != null ? Number(a.weight) : ""} placeholder="e.g. 10" className="input" /></label>
        <label className="col-span-2 sm:col-span-1"><span className="label">Date (optional)</span><input name="held_on" type="date" defaultValue={d(a?.held_on)} className="input" /></label>
      </div>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="published" defaultChecked={a?.published ?? false} className="accent-brand-600 size-4" /> Show marks to students</label>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      <button disabled={pending} className="btn-primary">{pending && <Loader2 size={14} className="animate-spin" />}{a ? "Save" : "Create & enter marks"}</button>
    </form>
  );
}
