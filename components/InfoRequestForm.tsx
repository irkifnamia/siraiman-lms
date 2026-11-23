"use client";
import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { saveInfoRequest } from "@/app/actions/admin";
import { FIELD_TYPES, type Field, type FieldType } from "@/lib/infoTypes";
import { toLocalInput } from "@/lib/format";

const uid = () => Math.random().toString(36).slice(2, 8);
const TEMPLATES: { name: string; fields: Omit<Field, "id">[] }[] = [
  { name: "Contact details", fields: [
    { label: "Phone number", type: "phone", required: true },
    { label: "Personal email", type: "email", required: true },
    { label: "Parent / guardian name", type: "text", required: true },
    { label: "Parent / guardian phone", type: "phone", required: true },
  ] },
  { name: "Home address", fields: [
    { label: "Home address", type: "long", required: true },
    { label: "Postcode", type: "number", required: true },
    { label: "State", type: "text", required: true },
  ] },
  { name: "Programme check", fields: [
    { label: "Are you taking Mathematics (DM025) this semester?", type: "yesno", required: true },
    { label: "Preferred tutorial slot", type: "choice", required: false, options: ["Morning", "Afternoon", "Evening"] },
  ] },
];

export function InfoRequestForm({ r, classes, students }: {
  r?: any; classes: string[]; students: { id: number; nickname: string; matric: string; class_code: string }[];
}) {
  const [state, action, pending] = useActionState(saveInfoRequest, null as any);
  const [fields, setFields] = useState<Field[]>(r?.fields?.length ? r.fields : [{ id: uid(), label: "", type: "text", required: true }]);
  const [cls, setCls] = useState<string[]>(r?.target_classes || []);
  const [studs, setStuds] = useState<number[]>(r?.target_students || []);
  const [mode, setMode] = useState<"all" | "classes" | "students">(
    r?.target_students?.length ? "students" : r?.target_classes?.length ? "classes" : "all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => students.filter((s) => !q || `${s.nickname} ${s.matric} ${s.class_code}`.toLowerCase().includes(q.toLowerCase())), [q, students]);

  const set = (i: number, patch: Partial<Field>) => setFields(fields.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= fields.length) return;
    const n = [...fields]; [n[i], n[j]] = [n[j], n[i]]; setFields(n);
  };
  const seg = (on: boolean) => `flex-1 h-8 rounded-md text-[12.5px] ${on ? "bg-white shadow-sm text-brand-800 font-semibold" : "text-slate-500"}`;

  return (
    <form action={action} className="space-y-5">
      {r && <input type="hidden" name="id" value={r.id} />}
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      {mode === "classes" && cls.map((c) => <input key={c} type="hidden" name="target_classes" value={c} />)}
      {mode === "students" && studs.map((s) => <input key={s} type="hidden" name="target_students" value={s} />)}

      <div className="space-y-3">
        <input name="title" required defaultValue={r?.title ?? ""} placeholder="Title, e.g. Emergency contact details" className="input h-10 text-[14px] font-semibold" />
        <textarea name="description" defaultValue={r?.description ?? ""} rows={2} placeholder="Why you need it (optional)" className="input" />
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Due (optional)</span><input name="due_at" type="datetime-local" defaultValue={toLocalInput(r?.due_at)} className="input" /></label>
          <label><span className="label">Status</span>
            <select name="open" defaultValue={r && !r.open ? "off" : "on"} className="input"><option value="on">Open for answers</option><option value="off">Closed</option></select>
          </label>
        </div>
      </div>

      <div>
        <div className="text-[14px] font-semibold text-ink mb-2">Who should answer?</div>
        <div className="flex bg-slate-100 rounded-lg p-1 mb-3">
          <button type="button" onClick={() => setMode("all")} className={seg(mode === "all")}>All students</button>
          <button type="button" onClick={() => setMode("classes")} className={seg(mode === "classes")}>Classes</button>
          <button type="button" onClick={() => setMode("students")} className={seg(mode === "students")}>Specific students</button>
        </div>
        {mode === "classes" && (
          <div className="flex gap-2 flex-wrap">
            {classes.map((c) => (
              <button type="button" key={c} onClick={() => setCls(cls.includes(c) ? cls.filter((x) => x !== c) : [...cls, c])}
                className={`px-3.5 h-9 rounded-full border text-[13px] font-semibold ${cls.includes(c) ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600"}`}>{c}</button>
            ))}
          </div>
        )}
        {mode === "students" && (
          <div className="card">
            <div className="relative border-b border-slate-100">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, matric or class" className="w-full h-10 pl-8 pr-3 text-[13px] outline-none rounded-t-xl" />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {shown.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={studs.includes(s.id)} onChange={() => setStuds(studs.includes(s.id) ? studs.filter((x) => x !== s.id) : [...studs, s.id])} className="accent-brand-600 size-4" />
                  <span className="font-medium">{s.nickname}</span><span className="text-slate-400 text-[11.5px]">{s.matric} · {s.class_code}</span>
                </label>
              ))}
            </div>
            <div className="px-3 py-2 text-[12px] text-slate-500 border-t border-slate-100">{studs.length} selected</div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[14px] font-semibold text-ink">Questions</div>
          <select value="" onChange={(e) => { const t = TEMPLATES.find((x) => x.name === e.target.value); if (t) setFields([...fields.filter((f) => f.label), ...t.fields.map((f) => ({ ...f, id: uid() }))]); }}
            className="input w-auto h-8 text-[12px]">
            <option value="">Add from template…</option>{TEMPLATES.map((t) => <option key={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="card p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={f.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={`Question ${i + 1}`} className="input font-medium" />
                <select value={f.type} onChange={(e) => set(i, { type: e.target.value as FieldType, options: e.target.value === "choice" ? f.options || ["", ""] : undefined })} className="input sm:w-44 shrink-0">
                  {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {f.type === "choice" && (
                <textarea value={(f.options || []).join("\n")} onChange={(e) => set(i, { options: e.target.value.split("\n") })} rows={3}
                  placeholder={"One option per line"} className="input mt-2 text-[12.5px]" />
              )}
              <div className="flex items-center gap-1 mt-2">
                <label className="flex items-center gap-1.5 text-[12.5px] text-slate-600 mr-auto">
                  <input type="checkbox" checked={f.required} onChange={(e) => set(i, { required: e.target.checked })} className="accent-brand-600 size-4" /> Required
                </label>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost h-7 px-1.5 disabled:opacity-30" title="Move up"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === fields.length - 1} className="btn-ghost h-7 px-1.5 disabled:opacity-30" title="Move down"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => setFields(fields.filter((_, k) => k !== i))} disabled={fields.length === 1} className="btn-danger h-7 px-1.5 disabled:opacity-30" title="Remove"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setFields([...fields, { id: uid(), label: "", type: "text", required: true }])} className="btn-outline mt-2 w-full border-dashed"><Plus size={15} /> Add question</button>
      </div>

      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      <button disabled={pending} className="btn-primary h-10 w-full sm:w-auto px-5">{pending && <Loader2 size={15} className="animate-spin" />}{r ? "Save changes" : "Send request"}</button>
    </form>
  );
}
