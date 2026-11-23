"use client";
import { useActionState, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";

export function LoginForm({ hasUsername }: { hasUsername: boolean }) {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [state, action, pending] = useActionState(login, null as any);

  return (
    <div className="min-h-dvh grid place-items-center px-5 py-10 graph-teal">
      <div className="w-full max-w-[360px]">
        <div className="text-center text-white mb-6">
          <div className="mx-auto size-12 rounded-2xl bg-white/15 grid place-items-center mb-3 ring-1 ring-white/20">
            <GraduationCap size={24} />
          </div>
          <h1 className="!text-white text-[24px] font-bold">Sir Aiman LMS</h1>
          <p className="text-[12.5px] text-brand-100 mt-1">Mathematics · Kolej Matrikulasi Kedah</p>
        </div>

        <div className="card p-5 shadow-xl shadow-brand-900/10">
          <div className="grid grid-cols-2 bg-slate-100 rounded-lg p-1 mb-4 text-[12.5px] font-medium">
            {(["student", "admin"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`h-8 rounded-md transition ${role === r ? "bg-white shadow-sm text-brand-700" : "text-slate-500"}`}>
                {r === "student" ? "Student" : "Lecturer"}
              </button>
            ))}
          </div>

          <form action={action} className="space-y-3">
            <input type="hidden" name="role" value={role} />
            {role === "student" ? (
              <>
                <label className="block">
                  <span className="label">Matric number</span>
                  <input name="matric" required autoCapitalize="characters" autoComplete="username"
                    placeholder="MS2618204783" className="input uppercase" />
                </label>
                <label className="block">
                  <span className="label">PIN</span>
                  <input name="pin" type="password" inputMode="numeric" required autoComplete="current-password"
                    placeholder="••••" className="input" />
                </label>
                <p className="text-[11.5px] text-slate-400">First time? Your PIN is the last 4 digits of your matric number.</p>
              </>
            ) : (
              <>
                {hasUsername && (
                  <label className="block">
                    <span className="label">Username</span>
                    <input name="username" required autoCapitalize="none" autoComplete="username" className="input" />
                  </label>
                )}
                <label className="block">
                  <span className="label">Password</span>
                  <input name="password" type="password" required autoComplete="current-password" className="input" />
                </label>
              </>
            )}
            {state?.error && <p className="text-[12.5px] text-rose-600">{state.error}</p>}
            <button disabled={pending} className="btn-primary w-full h-10">
              {pending && <Loader2 size={15} className="animate-spin" />} Sign in
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-brand-100 mt-6">Semester 2 · 2026/2027 · <a href="/privacy" className="underline text-brand-100">Privacy</a></p>
      </div>
    </div>
  );
}
