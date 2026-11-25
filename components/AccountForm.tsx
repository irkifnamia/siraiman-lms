"use client";
import { safe } from "@/lib/safeAction";
import { keep } from "@/lib/keepForm";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateAccount } from "@/app/actions/auth";

export function AccountForm({ name, username }: { name: string; username: string }) {
  const [state, action, pending] = useActionState(safe(updateAccount), null as any);
  return (
    <form onSubmit={keep(action)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Display name</span>
          <input name="name" defaultValue={name} maxLength={40} className="input" /></label>
        <label className="block"><span className="label">Username (optional)</span>
          <input name="username" defaultValue={username} autoCapitalize="none" placeholder="e.g. siraiman" className="input" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">New password</span>
          <input name="next" type="password" autoComplete="new-password" placeholder="Leave blank to keep" className="input" /></label>
        <label className="block"><span className="label">Confirm new password</span>
          <input name="confirm" type="password" autoComplete="new-password" className="input" /></label>
      </div>
      <label className="block"><span className="label">Current password (required to save)</span>
        <input name="current" type="password" required autoComplete="current-password" className="input" /></label>
      {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-[12.5px] text-emerald-600">{state.ok}</p>}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-primary">{pending && <Loader2 size={14} className="animate-spin" />} Save account</button>
        <p className="text-[11px] text-slate-400">Changing the password signs out your other devices. The password set in Vercel (ADMIN_PASSWORD) still works as a backup.</p>
      </div>
    </form>
  );
}
