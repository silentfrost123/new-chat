import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  Users,
  Bot,
  Flag,
  Tags,
  CreditCard,
  BarChart3,
  Settings,
  Megaphone,
  ArrowLeft,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/characters", label: "Characters", icon: Bot },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <Logo size="sm" />
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin
          </p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="md:hidden border-b border-border p-3 flex gap-2 overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
