"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Compass,
  MessageSquare,
  Heart,
  Users,
  PlusCircle,
  Bell,
  Settings,
  Crown,
  Shield,
  LogOut,
  User,
  History,
  Search,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/history", label: "History", icon: History },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/following", label: "Following", icon: Users },
  { href: "/create", label: "Create", icon: PlusCircle },
];

const bottomNav = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/pricing", label: "Upgrade", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0",
        className
      )}
    >
      <div className="p-5 border-b border-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-border" />

        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive("/admin")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Shield className="h-5 w-5" />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        {user ? (
          <div className="space-y-2">
            <Link
              href={user.username ? `/profile/${user.username}` : "/settings"}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent transition-colors"
            >
              <Avatar className="h-9 w-9">
                {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                <AvatarFallback>
                  {getInitials(user.name || user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user.plan || "free"} plan
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="space-y-2 p-1">
            <Button asChild className="w-full" variant="gradient">
              <Link href="/register">Sign up</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/chats", label: "Chats", icon: MessageSquare },
    { href: "/create", label: "Create", icon: PlusCircle },
    {
      href: session?.user?.username
        ? `/profile/${session.user.username}`
        : session
          ? "/settings"
          : "/login",
      label: "Profile",
      icon: User,
    },
  ];

  // Hide on chat pages (full-screen chat)
  if (pathname.startsWith("/chat/")) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
