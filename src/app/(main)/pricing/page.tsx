import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "./upgrade-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose a Vellum plan — Free, Plus, or Pro. Configurable limits for messages, memory, and models.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getSession();
  const allPlans = db.select().from(plans).orderBy(asc(plans.sortOrder)).all();
  const activePlans = allPlans.filter((p) => p.isActive);
  const currentPlan = session?.user?.plan || "free";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold">Pricing</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Upgrade when you want more messages, better models, and deeper memory.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {activePlans.map((plan) => {
          const features: string[] = plan.features ? JSON.parse(plan.features) : [];
          const isPopular = plan.slug === "plus";
          const isCurrent = currentPlan === plan.slug;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-8 flex flex-col ${
                isPopular
                  ? "border-vellum-500/50 bg-gradient-to-b from-vellum-950/40 to-card shadow-glow"
                  : "border-border/60 bg-card/50"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-vellum-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-6 mb-2">
                <span className="text-5xl font-bold tracking-tight">
                  ${((plan.priceMonthly || 0) / 100).toFixed(0)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {plan.priceYearly > 0 && (
                <p className="text-xs text-muted-foreground mb-6">
                  or ${(plan.priceYearly / 100).toFixed(0)}/year
                </p>
              )}
              {plan.priceYearly === 0 && <div className="mb-6" />}

              <ul className="space-y-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-vellum-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : plan.slug === "free" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={session ? "/discover" : "/register"}>Get started</Link>
                  </Button>
                ) : (
                  <UpgradeButton
                    planSlug={plan.slug}
                    isLoggedIn={!!session}
                    isPopular={isPopular}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Limits are enforced server-side. Prices are configurable by admins.
        {process.env.STRIPE_SECRET_KEY
          ? " Payments processed securely via Stripe."
          : " Stripe keys not configured — demo upgrade available for testing."}
      </p>
    </div>
  );
}
