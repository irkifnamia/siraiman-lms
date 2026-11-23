import { DAYS, DAY_SHORT, colorOf, hm, nowMYT, range, type Slot } from "@/lib/timetable";
import { MapPin } from "lucide-react";
import Link from "next/link";

/** Responsive week view: day-by-day list on phones, time grid on wider screens. */
export function Timetable({ slots, actions, editable }: { slots: Slot[]; actions?: (s: Slot) => React.ReactNode; editable?: boolean }) {
  const { day: today, min: nowMin } = nowMYT();
  const days = [0, 1, 2, 3, 4].filter((d) => d !== 0 || slots.some((s) => s.day === 0)); // Sun only if used
  const extra = [5, 6].filter((d) => slots.some((s) => s.day === d));
  const showDays = [...days, ...extra];
  const start = Math.min(480, ...slots.map((s) => s.start_min)), end = Math.max(1080, ...slots.map((s) => s.end_min));
  const hours: number[] = []; for (let m = Math.floor(start / 60) * 60; m < end; m += 60) hours.push(m);
  const ROW = 52; // px per hour

  return (
    <>
      {/* phone: list by day */}
      <div className="md:hidden space-y-4">
        {showDays.map((d) => {
          const list = slots.filter((s) => s.day === d);
          return (
            <section key={d}>
              <h3 className={`text-[13px] font-semibold mb-1.5 flex items-center gap-2 ${d === today ? "text-brand-700" : ""}`}>
                {DAYS[d]}{d === today && <span className="chip bg-brand-600 text-white">Today</span>}
              </h3>
              {list.length ? (
                <div className="space-y-1.5">
                  {list.map((s) => {
                    const c = colorOf(s), live = d === today && s.start_min <= nowMin && nowMin < s.end_min;
                    return (
                      <div key={s.id} className={`card flex items-stretch overflow-hidden ${live ? "ring-2 ring-brand-400" : ""}`}>
                        <div className={`w-1.5 ${c.bar}`} />
                        <div className="w-20 shrink-0 px-2.5 py-2 text-[11.5px] text-slate-500 num leading-tight">{hm(s.start_min)}<br /><span className="text-slate-400">{hm(s.end_min)}</span></div>
                        <div className="flex-1 min-w-0 py-2 pr-3">
                          <div className={`text-[14px] font-bold ${c.text}`}>{s.label}{live && <span className="ml-2 chip bg-brand-600 text-white">Now</span>}</div>
                          <div className="text-[12px] text-slate-500 flex items-center gap-1"><span>{s.kind}</span>{s.venue && <><span>·</span><MapPin size={11} /><b className="text-slate-700 font-semibold">{s.venue}</b></>}</div>
                        </div>
                        {actions && <div className="flex items-center pr-2">{actions(s)}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-[12px] text-slate-400 pl-1">No classes</div>}
            </section>
          );
        })}
      </div>

      {/* tablet / desktop: time grid */}
      <div className="hidden md:block card overflow-x-auto">
        <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `56px repeat(${showDays.length}, minmax(0,1fr))` }}>
          <div />
          {showDays.map((d) => (
            <div key={d} className={`px-2 py-2 text-center text-[12.5px] font-semibold border-b border-slate-100 ${d === today ? "text-brand-700 bg-brand-50/60" : "text-ink"}`}>{DAY_SHORT[d]}</div>
          ))}
          <div className="relative" style={{ height: hours.length * ROW }}>
            {hours.map((m, i) => <div key={m} className="absolute right-2 text-[10.5px] text-slate-400 num" style={{ top: i * ROW - 6 }}>{hm(m).replace(":00", "")}</div>)}
          </div>
          {showDays.map((d) => (
            <div key={d} className={`relative border-l border-slate-100 ${d === today ? "bg-brand-50/30" : ""}`} style={{ height: hours.length * ROW }}>
              {hours.map((m, i) => <div key={m} className="absolute inset-x-0 border-t border-slate-100" style={{ top: i * ROW }} />)}
              {d === today && nowMin >= hours[0] && nowMin <= hours[0] + hours.length * 60 && (
                <div className="absolute inset-x-0 z-10 border-t-2 border-rose-400" style={{ top: ((nowMin - hours[0]) / 60) * ROW }} />
              )}
              {slots.filter((s) => s.day === d).map((s) => {
                const c = colorOf(s);
                const cls = `absolute inset-x-1 rounded-lg ${c.bg} ${c.text} border-l-4 px-2 py-1 overflow-hidden ${editable ? "hover:brightness-95 hover:ring-2 hover:ring-brand-300" : ""}`;
                const style = { top: ((s.start_min - hours[0]) / 60) * ROW + 2, height: ((s.end_min - s.start_min) / 60) * ROW - 4, borderLeftColor: c.dot };
                const body = (<><div className="text-[12.5px] font-bold leading-tight">{s.label}</div><div className="text-[10.5px] opacity-80 leading-tight">{s.kind}{s.venue && ` · ${s.venue}`}</div></>);
                return editable
                  ? <Link key={s.id} href={`?edit=${s.id}`} className={cls} style={style} title="Edit">{body}</Link>
                  : <div key={s.id} className={cls} style={style}>{body}</div>;
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Legend({ slots }: { slots: Slot[] }) {
  const seen = new Map<string, Slot>();
  slots.forEach((s) => { const k = s.kind === "Lecture" ? s.label : s.label; if (!seen.has(k)) seen.set(k, s); });
  return (
    <div className="flex flex-wrap gap-3 text-[12px] text-slate-600 mb-3">
      {[...seen.values()].map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: colorOf(s).dot }} />{s.label}</span>
      ))}
    </div>
  );
}

/** Compact "now / next" card for home screens. */
export function NextClass({ now, next, today }: { now: Slot | null; next: Slot | null; today: number }) {
  const s = now || next;
  if (!s) return null;
  const c = colorOf(s);
  const when = now ? "Now" : s.day === today ? "Next today" : s.day === (today + 1) % 7 ? "Tomorrow" : DAYS[s.day];
  return (
    <div className={`card flex items-stretch overflow-hidden ${now ? "ring-2 ring-brand-400" : ""}`}>
      <div className={`w-1.5 ${c.bar}`} />
      <div className="flex-1 min-w-0 px-3.5 py-2.5">
        <div className="text-[11px] text-slate-500">{when} · {range(s)}</div>
        <div className={`text-[14px] font-bold ${c.text}`}>{s.label} <span className="text-slate-500 font-normal text-[12px]">{s.kind}</span></div>
      </div>
      {s.venue && <div className="px-3.5 grid place-items-center text-center"><MapPin size={14} className="text-slate-400 mx-auto" /><div className="text-[13px] font-bold text-ink">{s.venue}</div></div>}
    </div>
  );
}
