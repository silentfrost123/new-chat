import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters, adminActions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { characterId, action } = await req.json();

    const char = db.select().from(characters).where(eq(characters.id, characterId)).get();
    if (!char) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "toggle_feature") {
      db.update(characters)
        .set({ isFeatured: !char.isFeatured, updatedAt: new Date() })
        .where(eq(characters.id, characterId))
        .run();
    } else if (action === "suspend") {
      db.update(characters)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(characters.id, characterId))
        .run();
    } else if (action === "restore") {
      db.update(characters)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(characters.id, characterId))
        .run();
    } else if (action === "delete") {
      db.update(characters)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(characters.id, characterId))
        .run();
    }

    db.insert(adminActions)
      .values({
        id: randomUUID(),
        adminId: admin.id,
        action,
        targetType: "character",
        targetId: characterId,
      })
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
