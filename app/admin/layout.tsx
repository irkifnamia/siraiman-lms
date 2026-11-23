import { Shell } from "@/components/Shell";
import { adminProfile, requireAdmin } from "@/lib/auth";
import { currentSemester } from "@/lib/db";
import { logout } from "../actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [sem, prof] = await Promise.all([currentSemester(), adminProfile()]);
  return (
    <Shell role="admin" name={prof.name} sub={sem} logout={logout}>
      {children}
    </Shell>
  );
}
