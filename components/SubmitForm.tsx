"use client";
import { useActionState, useState } from "react";
import { Link2, Loader2, Paperclip, Upload } from "lucide-react";
import { submitTask } from "@/app/actions/student";

export function SubmitForm({ id, canUpload, resubmit }: { id: number; canUpload: boolean; resubmit: boolean }) {
  const [state, action, pending] = useActionState(submitTask, null as any);
  const [mode, setMode] = useState<"file" | "link">(canUpload ? "file" : "link");
  const [fname, setFname] = useState("");

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="assignment_id" value={id} />
      {canUpload && (
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 text-[12px]">
          {(["file", "link"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`px-3 h-7 rounded-md ${mode === m ? "bg-white shadow-sm text-brand-700 font-medium" : "text-slate-500"}`}>
              {m === "file" ? "Upload file" : "Paste link"}
            </button>
          ))}
        </div>
      )}
      {mode === "file" ? (
        <label className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-xl py-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 text-center">
          <Paperclip size={18} className="text-brand-600" />
          <span className="text-[13px] font-medium">{fname || "Choose PDF or image"}</span>
          <span className="text-[11px] text-slate-400">Max 4 MB · saved to Sir Aiman's Google Drive</span>
          <input name="file" type="file" accept=".pdf,image/*,.doc,.docx" className="hidden"
            onChange={(e) => setFname(e.target.files?.[0]?.name || "")} />
        </label>
      ) : (
        <div className="relative">
          <Link2 size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input name="link" type="url" placeholder="https://drive.google.com/…" className="input pl-9" />
          <p className="text-[11px] text-slate-400 mt-1">Set sharing to “Anyone with the link can view”.</p>
        </div>
      )}
      <textarea name="note" placeholder="Note to lecturer (optional)" className="input" rows={2} />
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {resubmit ? "Resubmit" : "Submit"}
      </button>
    </form>
  );
}
