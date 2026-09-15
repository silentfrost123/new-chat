import { db } from "@/lib/db";
import { siteSettings, aiProviders, aiModels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = db.select().from(siteSettings).all();
  const providers = db.select().from(aiProviders).all();
  const models = db.select().from(aiModels).all();

  return (
    <div className="p-6 lg:p-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold mb-6">Site settings</h1>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {settings.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-4 text-sm">
              <span className="font-mono text-muted-foreground">{s.key}</span>
              <span className="font-medium">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">AI providers</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span
                  className={`text-xs ${p.isActive ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.slug}</p>
              <ul className="mt-3 space-y-1">
                {models
                  .filter((m) => m.providerId === p.id)
                  .map((m) => (
                    <li key={m.id} className="text-sm flex justify-between">
                      <span>{m.displayName}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {m.minPlan}+
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          MOCK_AI={process.env.MOCK_AI || "false"} · Keys are never exposed to the browser.
        </p>
      </div>
    </div>
  );
}
