"use client";
import { safe } from "@/lib/safeAction";
import { keep } from "@/lib/keepForm";
import { useActionState, useState } from "react";
import { ClipboardPaste, Loader2, Save } from "lucide-react";
import { pasteAssessmentMarks, saveAssessmentMarks } from "@/app/actions/admin";

type Row = { id: number; nickname: string; matric: string; class_code: string; mark: number | null; grp: string | null; remark: string | null };

export function MarkSheet({ aid, max, group, rows }: { aid: number; max: number; group: boolean; rows: Row[] }) {
  const [state, action, pending] = useActionState(safe(saveAssessmentMarks), null as any);
  const [pState, pAction, pPending] = useActionState(safe(pasteAssessmentMarks), null as any);
  const [showPaste, setShowPaste] = useState(false);
  const [showRemarks, setShowRemarks] = useState(rows.some((r) => r.remark));
  const next = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const all = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-mark]"));
    all[all.indexOf(e.currentTarget) + 1]?.focus();
  };
  let lastCls = "";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button type="button" onClick={() => setShowPaste(!showPaste)} className="btn-outline h-8 text-[12px]"><ClipboardPaste size={14} /> Paste from spreadsheet</button>
        <label className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><input type="checkbox" checked={showRemarks} onChange={(e) => setShowRemarks(e.target.checked)} className="accent-brand-600 size-4" /> Remarks</label>
      </div>
      {showPaste && (
        <form onSubmit={keep(pAction)} className="card p-3 mb-3 space-y-2">
          <input type="hidden" name="assessment_id" value={aid} />
          <p className="text-[12px] text-slate-500">Copy two columns from Excel or Google Sheets — <b>matric number</b> and <b>mark</b> — and paste below. Existing marks for those students are replaced.</p>
          <textarea name="paste" rows={5} placeholder={"MS2618204783\t17\nMS2518174482\t15.5"} className="input font-mono text-[12px]" />
          {pState?.error && <p className="text-[12.5px] text-rose-600">{pState.error}</p>}
          {pState?.ok && <p className="text-[12.5px] text-emerald-700">{pState.ok}</p>}
          <button disabled={pPending} className="btn-primary h-8 text-[12px]">{pPending && <Loader2 size={13} className="animate-spin" />} Import marks</button>
        </form>
      )}

      <form onSubmit={keep(action)}>
        <input type="hidden" name="assessment_id" value={aid} />
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50"><tr>
              <th className="th">Student</th>
              {group && <th className="th w-24">Group</th>}
              <th className="th w-28 text-right">Mark /{max}</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const head = r.class_code !== lastCls; lastCls = r.class_code;
                return [
                  head && <tr key={`h${r.class_code}`}><td colSpan={3} className="px-3 pt-3 pb-1 text-[12px] font-bold text-brand-700 bg-white">{r.class_code}</td></tr>,
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5"><input type="hidden" name="sid" value={r.id} />
                      <div className="font-medium truncate max-w-44">{r.nickname}</div><div className="text-[11px] text-slate-400">{r.matric}</div>
                      {showRemarks ? <input name={`r_${r.id}`} defaultValue={r.remark ?? ""} placeholder="Remark" className="input h-7 mt-1 text-[12px] max-w-64" />
                        : <input type="hidden" name={`r_${r.id}`} value={r.remark ?? ""} />}
                    </td>
                    {group && <td className="px-2 py-1.5"><input name={`g_${r.id}`} defaultValue={r.grp ?? ""} placeholder="G1" className="input h-9 uppercase text-[12.5px]" /></td>}
                    <td className="px-3 py-1.5 text-right">
                      <input data-mark name={`m_${r.id}`} defaultValue={r.mark ?? ""} inputMode="decimal" onKeyDown={next} placeholder="–"
                        className="input h-9 w-20 text-right text-[14px] font-semibold num ml-auto" />
                    </td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
        {group && <p className="text-[11.5px] text-slate-500 mt-2">Tip: give members the same group name and enter the mark once — blank members get their group's mark when you save.</p>}
        <div className="sticky bottom-20 md:bottom-4 mt-3">
          <button disabled={pending} className="btn-primary w-full h-11 shadow-lg shadow-brand-900/15">{pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save marks</button>
          {state?.error && <p className="text-center text-[12.5px] text-rose-600 mt-1.5 bg-white rounded">{state.error}</p>}
          {state?.ok && <p className="text-center text-[12.5px] text-emerald-700 mt-1.5">{state.ok}</p>}
        </div>
      </form>
    </div>
  );
}
