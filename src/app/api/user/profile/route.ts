import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.name === "string") {
    updates.name = body.name.trim().slice(0, 80);
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim().slice(0, 300);
  }
  if (typeof body.image === "string") {
    updates.image = body.image;
  }
  if (typeof body.memoryEnabled === "boolean") {
    updates.memoryEnabled = body.memoryEnabled;
  }
  if (typeof body.theme === "string" && ["dark", "light", "system"].includes(body.theme)) {
    updates.theme = body.theme;
  }
  if (typeof body.contentPreference === "string") {
    updates.contentPreference = body.contentPreference;
  }
  if (typeof body.username === "string") {
    const username = body.username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);
    if (username.length >= 3) {
      const taken = db
        .select()
        .from(users)
        .where(and(eq(users.username, username), ne(users.id, session.user.id)))
        .get();
      if (taken) {
        return NextResponse.json({ error: "Username taken" }, { status: 409 });
      }
      updates.username = username;
    }
  }

  db.update(users).set(updates).where(eq(users.id, session.user.id)).run();

  return NextResponse.json({ success: true });
}
