"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home, ClipboardList, CalendarRange, Award, Menu, Users, Megaphone, BarChart3, ClipboardCheck,
  BookOpen, Settings, Table2, FolderOpen, User, LogOut, GraduationCap,
} from "lucide-react";

import { ADMIN_NAV, STUDENT_NAV, type Icon, type Item } from "./nav";

const ICONS = { ClipboardCheck, Home, ClipboardList, CalendarRange, Award, Menu, Users, Megaphone, BarChart3, BookOpen, Settings, Table2, FolderOpen, User };

export function Shell({
  role, name, sub, children, logout,
}: { role: "admin" | "student"; name: string; sub?: string; children: ReactNode; logout: () => Promise<void> }) {
  const path = usePathname();
  const nav = role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const root = role === "admin" ? "/admin" : "/";
  const active = (h: string) => (h === root ? path === h : path === h || path.startsWith(h + "/"));
  const mobile = [...nav.slice(0, 4), { href: role === "admin" ? "/admin/more" : "/more", label: "More", icon: "Menu" as Icon }];
  const moreActive = !nav.slice(0, 4).some((n) => active(n.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200/70 bg-white h-dvh sticky top-0">
        <Brand sub={role === "admin" ? "Lecturer" : "Student"} />
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((n) => {
            const I = ICONS[n.icon];
            return (
              <Link key={n.href} href={n.href}
                className={`relative flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] transition-colors ${active(n.href) ? "bg-brand-50 text-brand-800 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                {active(n.href) && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-brand-600" />}
                <I size={16} strokeWidth={active(n.href) ? 2.2 : 1.8} />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3 flex items-center gap-2.5">
          <Avatar name={name} />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-medium truncate">{name}</div>
            {sub && <div className="text-[11px] text-slate-400 truncate">{sub}</div>}
          </div>
          <form action={logout}><button className="btn-ghost px-2" title="Log out"><LogOut size={15} /></button></form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-slate-200/70">
        <div className="flex items-center justify-between px-4 h-13">
          <div className="flex items-center gap-2">
            <img src="/logo-128.png" alt="" className="size-8 rounded-full" />
            <span className="font-bold text-[14px] text-ink tracking-tight">Sir Aiman LMS</span>
          </div>
          <Link href={role === "admin" ? "/admin/settings" : "/profile"} className="flex items-center gap-2" aria-label="Profile">
            <span className="text-[11.5px] text-slate-500 truncate max-w-32">{sub}</span>
            <Avatar name={name} size={30} />
          </Link>
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 md:px-8 pt-4 md:pt-7 pb-24 md:pb-10 max-w-5xl w-full mx-auto">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200/70 pb-safe">
        <div className="grid grid-cols-5">
          {mobile.map((n) => {
            const I = ICONS[n.icon];
            const on = n.label === "More" ? moreActive : active(n.href);
            return (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center pt-1.5 pb-1 text-[10.5px] ${on ? "text-brand-800 font-semibold" : "text-slate-500"}`}>
                <span className={`h-7 w-12 grid place-items-center rounded-full transition-colors ${on ? "bg-brand-100" : ""}`}>
                  <I size={19} strokeWidth={on ? 2.3 : 1.8} />
                </span>
                <span className="mt-0.5">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Brand({ sub }: { sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 h-16 border-b border-slate-100">
      <img src="/logo-128.png" alt="" className="size-9 rounded-full" />
      <div>
        <div className="text-[14px] font-bold text-ink tracking-tight leading-none">Sir Aiman LMS</div>
        {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const init = (name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-brand-100 text-brand-700 grid place-items-center text-[11px] font-semibold shrink-0">
      {init}
    </div>
  );
}

export function MoreList({ role }: { role: "admin" | "student" }) {
  return (
    <div className="card divide-y divide-slate-100">
      {(role === "admin" ? ADMIN_NAV : STUDENT_NAV).slice(4).map((n) => {
        const I = ICONS[n.icon];
        return (
          <Link key={n.href} href={n.href} className="flex items-center gap-3 px-4 h-12 text-[13.5px] hover:bg-slate-50">
            <I size={17} className="text-brand-600" strokeWidth={1.8} /> {n.label}
          </Link>
        );
      })}
    </div>
  );
}
