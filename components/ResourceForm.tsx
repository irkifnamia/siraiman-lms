"use client";
import { useActionState, useRef, useEffect } from "react";
import { saveResource } from "@/app/actions/admin";

export function ResourceForm({ classes, canUpload }: { classes: string[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState(saveResource, null as any);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input name="title" required placeholder="Title (e.g. Chapter 1 Notes – Functions)" className="input font-medium" />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" className="input">{["Notes", "Slides", "Past paper", "Video", "Other"].map((c) => <option key={c}>{c}</option>)}</select>
        <select name="class_code" className="input"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <input name="res_url" type="url" placeholder="Link (Google Drive, YouTube…)" className="input" />
      {canUpload && <input name="res_file" type="file" className="block text-[12px] file:mr-3 file:h-8 file:px-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:text-[12px] file:font-medium" />}
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok} ✓</p>}
      <div className="flex justify-end"><button disabled={pending} className="btn-primary">Add resource</button></div>
    </form>
  );
}
