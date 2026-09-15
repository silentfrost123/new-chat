import { db } from "@/lib/db";
import { plans, users } from "@/lib/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Subscriptions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const allPlans = db.select().from(plans).orderBy(asc(plans.sortOrder)).all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Plans & Subscriptions</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {allPlans.map((p) => {
          const count = Number(
            db
              .select({ c: sql<number>`count(*)` })
              .from(users)
              .where(eq(users.plan, p.slug as "free" | "plus" | "pro"))
              .get()?.c || 0
          );
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-3xl font-bold">
                ${(p.priceMonthly / 100).toFixed(0)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subscribers</dt>
                  <dd>{count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Message limit</dt>
                  <dd>{p.messageLimit}/day</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Characters</dt>
                  <dd>{p.characterLimit}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Memory</dt>
                  <dd>{p.memoryLimit}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
