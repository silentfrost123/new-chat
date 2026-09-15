"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Bell,
  Menu,
  X,
  PlusCircle,
  LogOut,
  Settings,
  User,
  Crown,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, cn } from "@/lib/utils";

export function Header({
  transparent = false,
  showSearch = true,
}: {
  transparent?: boolean;
  showSearch?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border/60 backdrop-blur-xl",
        transparent ? "bg-background/40" : "bg-background/80"
      )}
    >
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <div className="lg:hidden">
          <Logo showText={false} size="sm" />
        </div>

        {showSearch && (
          <form onSubmit={onSearch} className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search characters..."
                className="pl-9 bg-muted/50 border-transparent focus:border-border"
              />
            </div>
          </form>
        )}

        <div className="flex-1" />

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Pricing</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Button variant="ghost" size="icon-sm" asChild className="hidden sm:flex">
                <Link href="/create" aria-label="Create character">
                  <PlusCircle className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild className="hidden sm:flex">
                <Link href="/chats" aria-label="Chats">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="/notifications" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-8 w-8">
                      {session.user.image && (
                        <AvatarImage src={session.user.image} alt="" />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(session.user.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{session.user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {session.user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session.user.username && (
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${session.user.username}`}>
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">
                      <Crown className="mr-2 h-4 w-4" /> Upgrade
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-border p-4 space-y-3 bg-card animate-fade-in">
          <form onSubmit={onSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search characters..."
                className="pl-9"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <Link
              href="/discover"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Discover
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/create"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Create Character
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
