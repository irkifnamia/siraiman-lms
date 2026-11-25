"use client";
import { safe } from "@/lib/safeAction";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { saveAssignment } from "@/app/actions/admin";
import { toLocalInput } from "@/lib/format";

export function AssignmentForm({ a, classes, canUpload }: { a?: any; classes: string[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState(safe(saveAssignment), null as any);
  const existing = a?.attachment_url ?? "";
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      {a && <input type="hidden" name="id" value={a.id} />}
      <label className="block"><span className="label">Title</span><input name="title" required defaultValue={a?.title ?? ""} placeholder="Tutorial 3 – Limits & Continuity" className="input" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Type</span>
          <select name="kind" defaultValue={a?.kind ?? "Tutorial"} className="input">
            {["Tutorial", "Quiz", "Assignment", "Project", "Test"].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">Class</span>
          <select name="class_code" defaultValue={a?.class_code ?? ""} className="input">
            <option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">Due (MYT)</span><input name="due_at" type="datetime-local" defaultValue={toLocalInput(a?.due_at)} className="input" /></label>
        <label className="block"><span className="label">Full mark</span><input name="max_mark" type="number" step="0.5" min="1" defaultValue={a ? Number(a.max_mark) : 100} className="input" /></label>
      </div>
      <label className="block"><span className="label">Instructions</span><textarea name="description" defaultValue={a?.description ?? ""} rows={4} className="input" /></label>
      <div>
        <span className="label">Question paper / attachment</span>
        <input type="hidden" name="attachment_keep" value={existing} />
        <input name="attachment_url" type="url" defaultValue={existing.startsWith("drive:") ? "" : existing} placeholder="Paste Google Drive link…" className="input" />
        {canUpload && <input name="attachment_file" type="file" className="mt-2 block text-[12px] file:mr-3 file:h-8 file:px-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:text-[12px] file:font-medium" />}
        {existing.startsWith("drive:") && <p className="text-[11px] text-slate-400 mt-1">An uploaded file is attached. Choose a new one to replace it.</p>}
      </div>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="published" defaultChecked={a ? a.published : true} className="accent-brand-600 size-4" /> Visible to students</label>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      <button disabled={pending} className="btn-primary">{a ? "Save task" : "Create task"}</button>
    </form>
  );
}
