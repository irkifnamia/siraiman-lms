import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { planAll } from "@/lib/queries";
import { Card, PageHeader, Section } from "@/components/ui";
import { PlanList } from "@/components/PlanList";
import { ConfirmButton } from "@/components/Confirm";
import { deletePlan, savePlan, setPlanStatus } from "@/app/actions/admin";

export default async function AdminPlan({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const rows = await planAll();
  const e = edit ? rows.find((r) => r.id === Number(edit)) : null;
  const nextWeek = rows.length ? Math.max(...rows.map((r) => r.week)) + 1 : 1;

  return (
    <>
      <PageHeader title="Learning plan" sub="Weekly topics students can follow" />
      <Card className="p-4 mb-5">
        <form action={savePlan} className="space-y-3" key={e?.id ?? "new"}>
          {e && <input type="hidden" name="id" value={e.id} />}
          <div className="grid grid-cols-[72px_1fr_1fr] gap-3">
            <label><span className="label">Week</span><input name="week" type="number" min={1} required defaultValue={e?.week ?? nextWeek} className="input" /></label>
            <label><span className="label">Week starts</span><input name="start_date" type="date" defaultValue={e?.start_date ? new Date(e.start_date).toISOString().slice(0, 10) : ""} className="input" /></label>
            <label><span className="label">Status</span>
              <select name="status" defaultValue={e?.status ?? "planned"} className="input"><option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="done">Done</option></select>
            </label>
          </div>
          <input name="topic" required defaultValue={e?.topic ?? ""} placeholder="Topic (e.g. Chapter 2: Differentiation)" className="input font-medium" />
          <textarea name="subtopics" defaultValue={e?.subtopics ?? ""} placeholder="Subtopics" rows={2} className="input" />
          <div className="grid md:grid-cols-2 gap-3">
            <input name="objectives" defaultValue={e?.objectives ?? ""} placeholder="Learning outcomes" className="input" />
            <input name="activities" defaultValue={e?.activities ?? ""} placeholder="Activities (tutorial, quiz…)" className="input" />
          </div>
          <input name="resource_url" type="url" defaultValue={e?.resource_url ?? ""} placeholder="Material link (optional)" className="input" />
          <div className="flex justify-end gap-2">
            {e && <Link href="/admin/plan" className="btn-ghost">Cancel</Link>}
            <button className="btn-primary">{e ? "Update week" : "Add week"}</button>
          </div>
        </form>
      </Card>

      <Section title={`Plan · ${rows.length} weeks`}>
        <PlanList rows={rows} actions={(r) => (
          <div className="ml-auto flex items-center gap-1">
            {["planned", "ongoing", "done"].filter((x) => x !== r.status).map((x) => (
              <form key={x} action={setPlanStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={x} />
                <button className="btn-ghost h-7 px-2 text-[11.5px] capitalize">{x}</button></form>
            ))}
            <Link href={`?edit=${r.id}`} className="btn-ghost h-7 px-2"><Pencil size={13} /></Link>
            <form action={deletePlan}><input type="hidden" name="id" value={r.id} /><ConfirmButton message="Delete this week?" className="btn-danger h-7 px-2"><Trash2 size={13} /></ConfirmButton></form>
          </div>
        )} />
      </Section>
    </>
  );
}
