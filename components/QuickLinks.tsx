import { ArrowUpRight, Gamepad2, Globe } from "lucide-react";

/** Big tap targets for the lecturer's own sites (Resources → category "Websites"). */
export function QuickLinks({ links }: { links: { id: number; title: string; url: string }[] }) {
  if (!links.length) return null;
  const icon = (t: string) => (/arena|game|quiz/i.test(t) ? Gamepad2 : Globe);
  return (
    <div className={`grid gap-2.5 mb-5 ${links.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {links.slice(0, 4).map((l) => {
        const I = icon(l.title);
        let host = l.url;
        try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch {}
        return (
          <a key={l.id} href={l.url} target="_blank" rel="noopener"
            className="card group flex items-center gap-2.5 px-3 py-3 hover:border-brand-300 active:scale-[.99] transition">
            <div className="size-9 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0 group-hover:bg-brand-100"><I size={18} strokeWidth={1.9} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-ink leading-tight line-clamp-2">{l.title}</div>
              <div className="text-[11px] text-slate-500 truncate hidden sm:block">{host}</div>
            </div>
            <ArrowUpRight size={16} className="text-slate-400 shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
