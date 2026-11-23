import { requireStudent } from "@/lib/auth";
import { studentById } from "@/lib/queries";
import { titleCase } from "@/lib/format";
import { Card, PageHeader, Section } from "@/components/ui";
import { Avatar } from "@/components/Shell";
import { PinForm } from "@/components/PinForm";
import { logout } from "@/app/actions/auth";

export default async function Profile() {
  const s = await requireStudent();
  const me = await studentById(s.sid);
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="p-4 flex items-center gap-3 mb-5">
        <Avatar name={me.nickname || me.full_name} size={44} />
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold truncate">{titleCase(me.full_name)}</div>
          <div className="text-[12px] text-slate-500">{me.matric} · {me.class_code} · {me.system}</div>
        </div>
      </Card>
      <Section title="Change PIN">
        <Card className="p-4">
          {!me.pin_hash && <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">You're still using the default PIN. Please set your own.</p>}
          <PinForm />
        </Card>
      </Section>
      <form action={logout}><button className="btn-outline w-full text-rose-600">Log out</button></form>
    </>
  );
}
