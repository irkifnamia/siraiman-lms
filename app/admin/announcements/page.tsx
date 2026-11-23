import Link from "next/link";
import { Pin, PinOff, Trash2, Pencil } from "lucide-react";
import { db, getClasses } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Section } from "@/components/ui";
import { ConfirmButton } from "@/components/Confirm";
import { deleteAnnouncement, saveAnnouncement, togglePin } from "@/app/actions/admin";

export default async function AdminAnnouncements({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [rows, classes] = await Promise.all([db()`SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC`, getClasses()]);
  const e = edit ? rows.find((r) => r.id === Number(edit)) : null;

  return (
    <>
      <PageHeader title="Announcements" sub="Shown on students' home screen" />
      <Card className="p-4 mb-5">
        <form action={saveAnnouncement} className="space-y-3" key={e?.id ?? "new"}>
          {e && <input type="hidden" name="id" value={e.id} />}
          <input name="title" required defaultValue={e?.title ?? ""} placeholder="Title" className="input font-medium" />
          <textarea name="body" required defaultValue={e?.body ?? ""} placeholder="Write your announcement…" rows={3} className="input" />
          <div className="flex flex-wrap items-center gap-3">
            <select name="class_code" defaultValue={e?.class_code ?? ""} className="input w-36">
              <option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="pinned" defaultChecked={e?.pinned} className="accent-brand-600 size-4" /> Pin</label>
            <div className="ml-auto flex gap-2">
              {e && <Link href="/admin/announcements" className="btn-ghost">Cancel</Link>}
              <button className="btn-primary">{e ? "Update" : "Post"}</button>
            </div>
          </div>
        </form>
      </Card>

      <Section title={`Posted · ${rows.length}`}>
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((n) => (
              <div key={n.id} className="card p-3.5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium flex items-center gap-1.5">{n.pinned && <Pin size={13} className="text-brand-600" />}{n.title}</div>
                    <p className="text-[12.5px] text-slate-600 mt-1 whitespace-pre-line line-clamp-4">{n.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">{fmtDate(n.created_at, true)} <Badge tone="teal">{n.class_code || "All"}</Badge></div>
                  </div>
                  <div className="flex shrink-0">
                    <Link href={`?edit=${n.id}`} className="btn-ghost px-2"><Pencil size={14} /></Link>
                    <form action={togglePin}><input type="hidden" name="id" value={n.id} /><button className="btn-ghost px-2" title="Pin">{n.pinned ? <PinOff size={14} /> : <Pin size={14} />}</button></form>
                    <form action={deleteAnnouncement}><input type="hidden" name="id" value={n.id} /><ConfirmButton message="Delete this announcement?" className="btn-danger px-2"><Trash2 size={14} /></ConfirmButton></form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="Nothing posted yet." />}
      </Section>
    </>
  );
}
