import { MoreList } from "@/components/Shell";
import { PageHeader } from "@/components/ui";
import { logout } from "@/app/actions/auth";

export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <MoreList role="student" />
      <form action={logout} className="mt-4"><button className="btn-outline w-full text-rose-600">Log out</button></form>
    </>
  );
}
