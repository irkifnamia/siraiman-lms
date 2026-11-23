import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { getClasses } from "@/lib/db";
import { allSlots } from "@/lib/timetable";
import { Card, PageHeader, Section } from "@/components/ui";
import { Legend, Timetable } from "@/components/Timetable";
import { SlotForm } from "@/components/SlotForm";
import { ConfirmButton } from "@/components/Confirm";
import { deleteSlot } from "@/app/actions/admin";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [slots, classes] = await Promise.all([allSlots(), getClasses()]);
  const e = edit ? slots.find((s) => s.id === Number(edit)) : undefined;
  const hours = slots.reduce((a, s) => a + (s.end_min - s.start_min) / 60, 0);
  return (
    <>
      <PageHeader title="Timetable" sub={`${slots.length} sessions · ${hours} hours a week`} />
      <Legend slots={slots} />
      <Timetable slots={slots} editable actions={(s) => (
        <div className="flex">
          <Link href={`?edit=${s.id}`} className="btn-ghost h-8 px-2" title="Edit"><Pencil size={14} /></Link>
          <form action={deleteSlot}><input type="hidden" name="id" value={s.id} /><ConfirmButton message={`Remove ${s.label} from the timetable?`} className="btn-danger h-8 px-2"><Trash2 size={14} /></ConfirmButton></form>
        </div>
      )} />
      <Section title={e ? `Edit ${e.label}` : "Add a session"}>
        <Card className="p-4 mt-4">
          <SlotForm s={e} classes={classes} />
          {e && (
            <form action={deleteSlot} className="mt-3 pt-3 border-t border-slate-100"><input type="hidden" name="id" value={e.id} />
              <ConfirmButton message={`Remove ${e.label} from the timetable?`}><Trash2 size={14} /> Remove this session</ConfirmButton></form>
          )}
        </Card>
      </Section>
      <p className="text-[11.5px] text-slate-500">Tap a session to edit or remove it. Students see only the sessions ticked for their class.</p>
    </>
  );
}
