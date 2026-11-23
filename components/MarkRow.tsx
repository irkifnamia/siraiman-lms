"use client";
import { useActionState, useState } from "react";
import { Check, ExternalLink, Loader2, MessageSquare, Undo2 } from "lucide-react";
import { markSubmission, unreturn } from "@/app/actions/admin";

export function MarkRow({ aid, max, st, due }: { aid: number; max: number; st: any; due: string | null }) {
  const [state, action, pending] = useActionState(markSubmission, null as any);
  const [open, setOpen] = useState(false);
  const returned = st.status === "returned";
  const late = st.submitted_at && st.file_url && due && new Date(st.submitted_at) > new Date(due);
  const href = st.file_url?.startsWith("drive:") ? `/api/files/${st.file_url.slice(6)}` : st.file_url;

  return (
    <div className={`px-3.5 py-2.5 ${returned ? "bg-emerald-50/40" : ""}`}>
      <form action={action} className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <input type="hidden" name="assignment_id" value={aid} />
        <input type="hidden" name="student_id" value={st.id} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium truncate">{st.nickname} <span className="text-slate-400 font-normal text-[11.5px]">{st.matric}</span></div>
          <div className="text-[11px] flex items-center gap-1.5 min-w-0">
            {st.file_url ? (
              <a href={href} target="_blank" className="inline-flex items-center gap-1 text-brand-600 font-medium shrink-0"><ExternalLink size={11} />{st.file_name || "Open"}</a>
            ) : st.sub_pk ? <span className="text-slate-500 shrink-0">{st.file_name || "Marked"}</span> : <span className="text-rose-500 shrink-0">Not submitted</span>}
            {late && <span className="text-amber-600 shrink-0">· late</span>}
            {returned && <span className="text-emerald-600 shrink-0">· returned</span>}
            {st.note && <span className="text-slate-400 truncate">· “{st.note}”</span>}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(!open)} title="Feedback"
          className={`size-8 grid place-items-center rounded-lg ${st.feedback || open ? "text-brand-600 bg-brand-50" : "text-slate-400 hover:bg-slate-100"}`}>
          <MessageSquare size={15} />
        </button>
        <div className="flex items-center">
          <input name="mark" type="number" step="0.5" min={0} max={max} defaultValue={st.mark === null ? "" : Number(st.mark)} placeholder="–"
            className="input w-16 h-8 text-right tabular-nums rounded-r-none" />
          <span className="h-8 px-1.5 grid place-items-center border border-l-0 border-slate-200 rounded-r-lg text-[11px] text-slate-400 bg-slate-50">/{max}</span>
        </div>
        <button name="intent" value="return" disabled={pending} title={returned ? "Update" : "Save & return"} className="btn-primary h-8 px-2.5">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}<span className="hidden sm:inline">{returned ? "Update" : "Return"}</span>
        </button>
        <div className={`basis-full ${open ? "" : "hidden"}`}>
          <textarea name="feedback" defaultValue={st.feedback ?? ""} placeholder="Feedback for the student…" rows={2} className="input" />
          <div className="flex gap-2 mt-1.5">
            <button name="intent" value="save" disabled={pending} className="btn-outline h-7 text-[12px]">Save without returning</button>
          </div>
        </div>
      </form>
      {open && returned && st.sub_pk && (
        <form action={unreturn} className="mt-1.5"><input type="hidden" name="id" value={st.sub_pk} /><input type="hidden" name="assignment_id" value={aid} />
          <button className="btn-ghost h-7 text-[12px]"><Undo2 size={13} /> Un-return (hide mark)</button></form>
      )}
      {state?.error && <p className="text-[11.5px] text-rose-600 mt-1">{state.error}</p>}
      {state?.ok && <p className="text-[11.5px] text-emerald-600 mt-1">{state.ok} ✓</p>}
    </div>
  );
}
