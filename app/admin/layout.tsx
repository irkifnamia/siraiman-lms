import { Shell } from "@/components/Shell";
import { requireAdmin } from "@/lib/auth";
import { currentSemester } from "@/lib/db";
import { logout } from "../actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const sem = await currentSemester();
  return (
    <Shell role="admin" name="Sir Aiman" sub={sem} logout={logout}>
      {children}
    </Shell>
  );
}
