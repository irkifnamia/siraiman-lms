export type Icon = "Home" | "ClipboardList" | "CalendarRange" | "Award" | "Menu" | "Users" | "Megaphone" | "BarChart3" | "BookOpen" | "Settings" | "Table2" | "FolderOpen" | "User";
export type Item = { href: string; label: string; icon: Icon };

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
  { href: "/admin/analysis", label: "Analysis", icon: "BarChart3" },
  { href: "/admin/gradebook", label: "Gradebook", icon: "Table2" },
  { href: "/admin/announcements", label: "Announcements", icon: "Megaphone" },
  { href: "/admin/plan", label: "Learning plan", icon: "CalendarRange" },
  { href: "/admin/resources", label: "Resources", icon: "FolderOpen" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
];

