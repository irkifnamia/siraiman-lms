import { requireStudent } from "@/lib/auth";
import { planAll } from "@/lib/queries";
import { slotsForClass } from "@/lib/timetable";
import { PageHeader, Section } from "@/components/ui";
import { PlanList } from "@/components/PlanList";
import { Timetable } from "@/components/Timetable";

export default async function Plan() {
  const s = await requireStudent();
  const [rows, slots] = await Promise.all([planAll(), slotsForClass(s.cls!)]);
  return (
    <>
      <PageHeader title="Plan" sub={`Your ${s.cls} timetable and the weekly learning plan`} />
      {slots.length > 0 && <Section title="My timetable"><Timetable slots={slots} /></Section>}
      <Section title="Learning plan"><PlanList rows={rows} /></Section>
    </>
  );
}
