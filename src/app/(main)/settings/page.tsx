"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Brain, User, Palette, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "plan", label: "Plan", icon: CreditCard },
  { id: "account", label: "Account", icon: Shield },
];

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memories, setMemories] = useState<
    { id: string; content: string; type: string; key: string | null }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/settings");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setUsername(session.user.username || "");
    }
  }, [session]);

  useEffect(() => {
    if (tab === "memory" && session) {
      fetch("/api/memories")
        .then((r) => r.json())
        .then((d) => setMemories(d.memories || []))
        .catch(() => {});
    }
  }, [tab, session]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, username, memoryEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      await update({ name, username });
      toast.success("Profile updated");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Permanently delete your account and all data? This cannot be undone."
      )
    )
      return;
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      toast.error("Could not delete account");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:w-48 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors text-left",
                  tab === t.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          {tab === "profile" && (
            <div className="space-y-5 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>
              <Button onClick={saveProfile} disabled={saving} variant="gradient">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-4 max-w-md">
              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred theme. Dark is the default Vellum experience.
              </p>
              {(["dark", "light", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 capitalize transition-colors",
                    theme === t
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {tab === "memory" && (
            <div className="space-y-6 max-w-lg">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium">Enable memory</p>
                  <p className="text-sm text-muted-foreground">
                    Characters remember details across conversations
                  </p>
                </div>
                <Switch
                  checked={memoryEnabled}
                  onCheckedChange={(v) => {
                    setMemoryEnabled(v);
                    fetch("/api/user/profile", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ memoryEnabled: v }),
                    });
                  }}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Your memories</h3>
                {memories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No memories stored yet. They appear as you chat.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memories.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                      >
                        <div>
                          {m.key && (
                            <p className="text-xs text-muted-foreground">{m.key}</p>
                          )}
                          <p className="text-sm">{m.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive shrink-0"
                          onClick={async () => {
                            await fetch(`/api/memories?id=${m.id}`, {
                              method: "DELETE",
                            });
                            setMemories((prev) => prev.filter((x) => x.id !== m.id));
                            toast.success("Memory deleted");
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Full memory settings also available at{" "}
                <Link href="/settings/memory" className="underline">
                  /settings/memory
                </Link>
              </p>
            </div>
          )}

          {tab === "plan" && (
            <div className="space-y-4 max-w-md">
              <div className="rounded-2xl border border-border p-6">
                <p className="text-sm text-muted-foreground">Current plan</p>
                <p className="text-2xl font-bold capitalize mt-1">
                  {session?.user?.plan || "free"}
                </p>
              </div>
              <Button asChild variant="gradient">
                <Link href="/pricing">View plans & upgrade</Link>
              </Button>
            </div>
          )}

          {tab === "account" && (
            <div className="space-y-6 max-w-md">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                <h3 className="font-semibold text-destructive">Danger zone</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account, conversations, and characters.
                </p>
                <Button
                  variant="destructive"
                  className="mt-4"
                  onClick={deleteAccount}
                >
                  Delete account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
