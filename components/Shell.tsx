"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home, ClipboardList, CalendarRange, Award, Menu, Users, Megaphone, CheckSquare,
  BookOpen, Settings, Table2, FolderOpen, User, LogOut, GraduationCap,
} from "lucide-react";

const ICONS = { Home, ClipboardList, CalendarRange, Award, Menu, Users, Megaphone, CheckSquare, BookOpen, Settings, Table2, FolderOpen, User };
type Icon = keyof typeof ICONS;
type Item = { href: string; label: string; icon: Icon };

export const STUDENT_NAV: Item[] = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/tasks", label: "Tasks", icon: "ClipboardList" },
  { href: "/plan", label: "Plan", icon: "CalendarRange" },
  { href: "/marks", label: "Marks", icon: "Award" },
  { href: "/announcements", label: "News", icon: "Megaphone" },
  { href: "/resources", label: "Resources", icon: "FolderOpen" },
  { href: "/profile", label: "Profile", icon: "User" },
];

export const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Dashboard", icon: "Home" },
  { href: "/admin/students", label: "Students", icon: "Users" },
  { href: "/admin/assignments", label: "Tasks", icon: "ClipboardList" },
  { href: "/admin/attendance", label: "Attendance", icon: "CheckSquare" },
  { href: "/admin/gradebook", label: "Gradebook", icon: "Table2" },
  { href: "/admin/announcements", label: "Announcements", icon: "Megaphone" },
  { href: "/admin/plan", label: "Learning plan", icon: "CalendarRange" },
  { href: "/admin/resources", label: "Resources", icon: "FolderOpen" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
];

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
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white h-dvh sticky top-0">
        <Brand sub={role === "admin" ? "Lecturer" : "Student"} />
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((n) => {
            const I = ICONS[n.icon];
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] ${active(n.href) ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                <I size={16} strokeWidth={1.8} />{n.label}
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
      <header className="md:hidden sticky top-0 z-20 bg-brand-700 text-white">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2 font-semibold text-[14px] tracking-tight">
            <GraduationCap size={18} /> SIR AIMAN LMS
          </div>
          <div className="text-[11.5px] text-brand-100 truncate max-w-[45%]">{sub || name}</div>
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 md:px-8 pt-4 md:pt-7 pb-24 md:pb-10 max-w-5xl w-full mx-auto">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 pb-safe">
        <div className="grid grid-cols-5">
          {mobile.map((n) => {
            const I = ICONS[n.icon];
            const on = n.label === "More" ? moreActive : active(n.href);
            return (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center pt-2 pb-1 text-[10.5px] ${on ? "text-brand-600" : "text-slate-400"}`}>
                <I size={20} strokeWidth={on ? 2.2 : 1.8} />
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
      <div className="size-8 rounded-lg bg-brand-600 text-white grid place-items-center"><GraduationCap size={17} /></div>
      <div>
        <div className="text-[13.5px] font-semibold tracking-tight leading-none">SIR AIMAN LMS</div>
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

export function MoreList({ items }: { items: Item[] }) {
  return (
    <div className="card divide-y divide-slate-100">
      {items.map((n) => {
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
