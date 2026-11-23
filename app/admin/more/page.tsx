import { ADMIN_NAV, MoreList } from "@/components/Shell";
import { PageHeader } from "@/components/ui";
import { logout } from "@/app/actions/auth";

export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <MoreList items={ADMIN_NAV.slice(4)} />
      <form action={logout} className="mt-4"><button className="btn-outline w-full text-rose-600">Log out</button></form>
    </>
  );
}
