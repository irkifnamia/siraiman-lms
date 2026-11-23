import { ExternalLink } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Badge, Empty } from "./ui";

const TONE: Record<string, string> = { done: "green", ongoing: "teal", planned: "slate" };

export function PlanList({ rows, actions }: { rows: any[]; actions?: (r: any) => React.ReactNode }) {
  if (!rows.length) return <Empty text="The learning plan hasn't been published yet." />;
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="ml-4">
          <span className={`absolute -left-[5px] mt-4 size-2.5 rounded-full ring-4 ring-slate-50 ${r.status === "done" ? "bg-emerald-500" : r.status === "ongoing" ? "bg-brand-500" : "bg-slate-300"}`} />
          <div className={`card p-3.5 ${r.status === "ongoing" ? "border-brand-300 ring-1 ring-brand-100" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11.5px] font-semibold text-brand-700">
                Week {r.week}{r.start_date && <span className="text-slate-400 font-normal"> · {fmtDate(r.start_date)}</span>}
              </div>
              <Badge tone={TONE[r.status]}>{r.status}</Badge>
            </div>
            <div className="text-[14px] font-medium mt-1">{r.topic}</div>
            {r.subtopics && <p className="text-[12.5px] text-slate-600 mt-1 whitespace-pre-line">{r.subtopics}</p>}
            {r.objectives && <p className="text-[12px] text-slate-500 mt-1.5"><b className="font-medium text-slate-600">Outcomes:</b> {r.objectives}</p>}
            {r.activities && <p className="text-[12px] text-slate-500 mt-0.5"><b className="font-medium text-slate-600">Activities:</b> {r.activities}</p>}
            <div className="flex items-center gap-3 mt-2">
              {r.resource_url && <a href={r.resource_url} target="_blank" className="inline-flex items-center gap-1 text-[12px] text-brand-600"><ExternalLink size={13} /> Material</a>}
              {actions?.(r)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
