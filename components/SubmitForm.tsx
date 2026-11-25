"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Link2, Loader2, Paperclip, Upload, X } from "lucide-react";
import { prepareUpload } from "@/lib/prepareUpload";

export function SubmitForm({ id, canUpload, resubmit }: { id: number; canUpload: boolean; resubmit: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"file" | "link">(canUpload ? "file" : "link");
  const [files, setFiles] = useState<File[]>([]);
  const [prep, setPrep] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    setLocalErr(null);
    setFiles((cur) => [...cur, ...Array.from(list)].slice(0, 15));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalErr(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("file");
    if (mode === "file") {
      if (!files.length) { setLocalErr("Choose a file or take photos first."); return; }
      try {
        setPrep("Preparing your upload…");
        const f = await prepareUpload(files, setPrep);
        fd.set("file", f, f.name);
      } catch (err: any) {
        setPrep(null); setLocalErr(err.message || "Couldn't prepare the file."); return;
      }
      setPrep(null);
    } else fd.delete("file");
    setState(null); setPending(true);
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 120000);
      const res = await fetch("/api/submit", { method: "POST", body: fd, signal: ctl.signal });
      clearTimeout(timer);
      let j: any = {};
      try { j = await res.json(); } catch {}
      if (res.ok && j.ok) { setState({ ok: j.ok }); setFiles([]); router.refresh(); }
      else if (res.status === 413) setState({ error: "That file is too large for the server (max 4 MB). Try fewer photos per upload." });
      else if (res.status === 401) setState({ error: j.error || "Your session has expired. Please log in again." });
      else setState({ error: j.error || `Upload failed (error ${res.status}). Please try again.` });
    } catch (err: any) {
      setState({ error: err?.name === "AbortError" ? "The upload took too long. Check your connection and try again." : "Couldn't reach the server. Check your internet connection and try again." });
    } finally { setPending(false); }
  };

  const busy = pending || !!prep;
  const total = files.reduce((a, f) => a + f.size, 0);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="assignment_id" value={id} />
      {canUpload && (
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 text-[12px]">
          {(["file", "link"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`px-3 h-7 rounded-md ${mode === m ? "bg-white shadow-sm text-brand-700 font-medium" : "text-slate-500"}`}>
              {m === "file" ? "Upload" : "Paste link"}
            </button>
          ))}
        </div>
      )}
      {mode === "file" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => cam.current?.click()} className="card h-20 flex flex-col items-center justify-center gap-1 text-[12.5px] font-medium hover:border-brand-400">
              <Camera size={20} className="text-brand-600" /> Take photos
            </button>
            <button type="button" onClick={() => pick.current?.click()} className="card h-20 flex flex-col items-center justify-center gap-1 text-[12.5px] font-medium hover:border-brand-400">
              <Paperclip size={20} className="text-brand-600" /> Choose PDF / photos
            </button>
          </div>
          <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <input ref={pick} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          {files.length > 0 && (
            <div className="card divide-y divide-slate-100">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-[12.5px]">
                  <span className="text-slate-400 num w-5">{i + 1}.</span>
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-slate-400 num">{(f.size / 1048576).toFixed(1)} MB</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, k) => k !== i))} className="text-slate-400 hover:text-rose-600" aria-label="Remove"><X size={15} /></button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Photos are compressed and joined into one PDF automatically (in the order shown).
            {files.length > 0 && ` ${files.length} file${files.length > 1 ? "s" : ""}, ${(total / 1048576).toFixed(1)} MB before compression.`}
          </p>
        </div>
      ) : (
        <div className="relative">
          <Link2 size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input name="link" type="url" placeholder="https://drive.google.com/…" className="input pl-9" />
          <p className="text-[11px] text-slate-400 mt-1">Set sharing to “Anyone with the link can view”.</p>
        </div>
      )}
      <textarea name="note" placeholder="Note to lecturer (optional)" className="input" rows={2} />
      {(localErr || state?.error) && <p className="text-[12.5px] text-rose-600">{localErr || state.error}</p>}
      {state?.ok && !busy && <p className="text-[12.5px] text-emerald-700">{state.ok}</p>}
      <button disabled={busy} className="btn-primary w-full h-11">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {prep || (pending ? "Uploading…" : resubmit ? "Resubmit" : "Submit")}
      </button>
    </form>
  );
}
