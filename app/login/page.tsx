import { getSetting } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const username = await getSetting("admin_username").catch(() => null);
  return <LoginForm hasUsername={!!username} />;
}
