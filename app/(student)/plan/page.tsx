import { planAll } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { PlanList } from "@/components/PlanList";

export default async function Plan() {
  const rows = await planAll();
  return (
    <>
      <PageHeader title="Learning plan" sub="Weekly topics for this semester" />
      <PlanList rows={rows} />
    </>
  );
}
