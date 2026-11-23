import { requireStudent } from "@/lib/auth";
import { resourcesFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { ResourceList } from "@/components/ResourceList";

export default async function Resources() {
  const s = await requireStudent();
  const rows = await resourcesFor(s.cls!);
  return (
    <>
      <PageHeader title="Resources" sub="Notes, slides, past papers and videos" />
      <ResourceList rows={rows} />
    </>
  );
}
