import { Shell } from "@/components/Shell";
import { requireStudent } from "@/lib/auth";
import { logout } from "../actions/auth";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStudent();
  return (
    <Shell role="student" name={s.name} sub={s.cls} logout={logout}>
      {children}
    </Shell>
  );
}
