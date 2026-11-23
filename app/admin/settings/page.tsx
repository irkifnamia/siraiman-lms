import { CheckCircle2, CircleAlert, HardDrive } from "lucide-react";
import { db } from "@/lib/db";
import { driveConfigured, driveConnected, redirectUri } from "@/lib/drive";
import { Card, PageHeader, Section } from "@/components/ui";
import { ImportForm } from "@/components/ImportForm";
import { disconnectDrive, saveSemester } from "@/app/actions/admin";

export default async function Settings({ searchParams }: { searchParams: Promise<{ drive?: string; err?: string }> }) {
  const { drive, err } = await searchParams;
  const [configured, connected, sem] = await Promise.all([
    driveConfigured(), driveConnected(), db()`SELECT * FROM semesters WHERE is_current LIMIT 1`,
  ]);
  const s = sem[0];
  const d = (v: any) => (v ? new Date(v).toISOString().slice(0, 10) : "");

  return (
    <>
      <PageHeader title="Settings" />

      <Section title="Google Drive">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0"><HardDrive size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                {connected ? <><CheckCircle2 size={15} className="text-emerald-600" /> Connected</> : <><CircleAlert size={15} className="text-amber-500" /> Not connected</>}
              </div>
              <p className="text-[12.5px] text-slate-500 mt-1">
                When connected, student submissions and your attachments are saved privately to a folder named
                <b className="font-medium text-slate-700"> “SIR AIMAN LMS – Uploads”</b> in your Drive (one subfolder per task).
                Without it, students submit by pasting a Google Drive link.
              </p>
              {drive === "ok" && <p className="text-[12.5px] text-emerald-600 mt-2">Google Drive connected.</p>}
              {err && <p className="text-[12.5px] text-rose-600 mt-2">{err}</p>}
              <div className="mt-3">
                {!configured ? (
                  <div className="text-[12px] text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1">
                    <p className="font-medium">One-time setup (≈5 min):</p>
                    <ol className="list-decimal ml-4 space-y-0.5">
                      <li>Google Cloud Console → new project → enable <b>Google Drive API</b>.</li>
                      <li>OAuth consent screen → External → add scope <code>drive.file</code> → Publish app.</li>
                      <li>Credentials → OAuth client ID (Web) → redirect URI: <code className="break-all">{redirectUri()}</code></li>
                      <li>Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in Vercel → Settings → Environment Variables, then redeploy.</li>
                    </ol>
                  </div>
                ) : connected ? (
                  <form action={disconnectDrive}><button className="btn-outline">Disconnect</button></form>
                ) : (
                  <a href="/api/google/connect" className="btn-primary">Connect Google Drive</a>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Semester">
        <Card className="p-4">
          <form action={saveSemester} className="space-y-3">
            <div className="text-[13.5px] font-medium">{s?.code}</div>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="label">Start</span><input type="date" name="start_date" defaultValue={d(s?.start_date)} className="input" /></label>
              <label><span className="label">End</span><input type="date" name="end_date" defaultValue={d(s?.end_date)} className="input" /></label>
            </div>
            <button className="btn-outline">Save</button>
          </form>
        </Card>
      </Section>

      <Section title="Import students">
        <Card className="p-4"><ImportForm /></Card>
      </Section>

      <Section title="Student login">
        <Card className="p-4 text-[12.5px] text-slate-600">
          Students sign in with their matric number. The default PIN is the <b>last 4 digits</b> of the matric number; they can change it in Profile.
          Reset a forgotten PIN from the student's page.
        </Card>
      </Section>
    </>
  );
}
