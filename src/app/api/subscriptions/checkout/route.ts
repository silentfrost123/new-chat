import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, plans, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan: planSlug } = await req.json();
  const plan = db.select().from(plans).where(eq(plans.slug, planSlug)).get();

  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // If Stripe is configured, redirect to checkout (placeholder structure)
  if (process.env.STRIPE_SECRET_KEY && plan.stripePriceIdMonthly) {
    // Production: create Stripe Checkout Session
    // Never expose secret key to client — this stays server-side
    return NextResponse.json({
      error: "Stripe checkout is configured but price IDs need setup. Use demo upgrade for now.",
    });
  }

  // Demo mode: instantly upgrade
  db.update(users)
    .set({
      plan: planSlug as "free" | "plus" | "pro",
      planExpiresAt: new Date(Date.now() + 30 * 86400000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .run();

  db.insert(subscriptions)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      planId: plan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    })
    .run();

  return NextResponse.json({
    success: true,
    plan: planSlug,
    message: "Demo upgrade applied. Configure Stripe for real payments.",
  });
}
