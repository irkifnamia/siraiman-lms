import { ExternalLink, FileText, PlayCircle, Link2, BookOpen } from "lucide-react";
import { fileHref } from "@/lib/drive";
import { Badge, Empty } from "./ui";

const ICON: Record<string, any> = { Notes: BookOpen, Slides: FileText, "Past paper": FileText, Video: PlayCircle };

function host(u: string) { try { return new URL(u).hostname; } catch { return u; } }

export function ResourceList({ rows, actions }: { rows: any[]; actions?: (r: any) => React.ReactNode }) {
  if (!rows.length) return <Empty text="No resources shared yet." />;
  const groups = rows.reduce((m: Record<string, any[]>, r) => ((m[r.category || "Other"] ||= []).push(r), m), {});
  return (
    <div className="space-y-5">
      {(Object.entries(groups) as [string, any[]][]).map(([cat, list]) => (
        <section key={cat}>
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{cat}</h2>
          <div className="card divide-y divide-slate-100">
            {list.map((r) => {
              const I = ICON[cat] || Link2;
              return (
                <div key={r.id} className="flex items-center gap-3 px-3.5 py-3">
                  <div className="size-8 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0"><I size={16} /></div>
                  <a href={fileHref(r.url)!} target="_blank" className="min-w-0 flex-1 group">
                    <div className="text-[13.5px] font-medium truncate group-hover:text-brand-700">{r.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{r.url.startsWith("drive:") ? "Google Drive" : host(r.url)}</div>
                  </a>
                  {r.class_code && <Badge tone="teal">{r.class_code}</Badge>}
                  {actions ? actions(r) : <ExternalLink size={14} className="text-slate-300" />}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
