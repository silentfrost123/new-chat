import { db } from "@/lib/db";
import { reports, users, characters } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ReportActions } from "./report-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Reports",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const list = db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterName: users.name,
      reporterEmail: users.email,
      characterName: characters.name,
      characterSlug: characters.slug,
      reportedUserId: reports.reportedUserId,
      characterId: reports.characterId,
    })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .leftJoin(characters, eq(reports.characterId, characters.id))
    .orderBy(desc(reports.createdAt))
    .limit(50)
    .all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Reports & Moderation</h1>
      {list.length === 0 ? (
        <p className="text-muted-foreground">No reports yet. Looking good.</p>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        r.status === "pending"
                          ? "text-amber-400"
                          : r.status === "resolved"
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.createdAt
                        ? new Date(
                            typeof r.createdAt === "number"
                              ? r.createdAt * 1000
                              : r.createdAt
                          ).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className="font-medium">{r.reason}</p>
                  {r.details && (
                    <p className="text-sm text-muted-foreground mt-1">{r.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Reporter: {r.reporterName} ({r.reporterEmail})
                    {r.characterName && ` · Character: ${r.characterName}`}
                  </p>
                </div>
                {r.status === "pending" && (
                  <ReportActions reportId={r.id} characterId={r.characterId} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
