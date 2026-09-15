import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Bell } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { MarkReadButton } from "./mark-read";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/notifications");

  const list = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">Stay up to date</p>
        </div>
        {list.some((n) => !n.isRead) && <MarkReadButton />}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">All caught up</p>
          <p className="text-sm text-muted-foreground mt-1">
            Notifications will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const content = (
              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  n.isRead
                    ? "border-border/40 bg-card/30"
                    : "border-vellum-500/20 bg-vellum-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.body && (
                      <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
