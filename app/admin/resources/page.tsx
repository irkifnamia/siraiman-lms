import { Trash2 } from "lucide-react";
import { getClasses } from "@/lib/db";
import { driveConnected } from "@/lib/drive";
import { resourcesFor } from "@/lib/queries";
import { Card, PageHeader, Section } from "@/components/ui";
import { ResourceList } from "@/components/ResourceList";
import { ResourceForm } from "@/components/ResourceForm";
import { ConfirmButton } from "@/components/Confirm";
import { deleteResource } from "@/app/actions/admin";

export default async function AdminResources() {
  const [rows, classes, canUpload] = await Promise.all([resourcesFor(null), getClasses(), driveConnected()]);
  return (
    <>
      <PageHeader title="Resources" sub="Notes, slides, past papers, videos" />
      <Card className="p-4 mb-5"><ResourceForm classes={classes} canUpload={canUpload} /></Card>
      <Section title={`Shared · ${rows.length}`}>
        <ResourceList rows={rows} actions={(r) => (
          <form action={deleteResource}><input type="hidden" name="id" value={r.id} />
            <ConfirmButton message="Remove this resource?" className="btn-danger px-2 h-8"><Trash2 size={14} /></ConfirmButton></form>
        )} />
      </Section>
    </>
  );
}
