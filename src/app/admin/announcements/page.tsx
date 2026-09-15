import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Announcements",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const list = db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Announcements</h1>
      {list.length === 0 ? (
        <p className="text-muted-foreground">
          No announcements. Create them via the API or seed data.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase text-muted-foreground">{a.type}</span>
                {a.isActive && (
                  <span className="text-xs text-emerald-400">Active</span>
                )}
              </div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
