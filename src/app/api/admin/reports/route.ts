import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, characters, moderationEvents, adminActions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { reportId, action, characterId } = await req.json();

    if (action === "dismiss") {
      db.update(reports)
        .set({
          status: "dismissed",
          resolution: "Dismissed by moderator",
          resolvedBy: admin.id,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reports.id, reportId))
        .run();
    } else if (action === "resolve" || action === "warn") {
      db.update(reports)
        .set({
          status: "resolved",
          resolution: action === "warn" ? "Warning issued" : "Resolved",
          resolvedBy: admin.id,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reports.id, reportId))
        .run();
    } else if (action === "remove_character" && characterId) {
      db.update(characters)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(characters.id, characterId))
        .run();
      db.update(reports)
        .set({
          status: "resolved",
          resolution: "Character suspended",
          resolvedBy: admin.id,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reports.id, reportId))
        .run();
    }

    db.insert(moderationEvents)
      .values({
        id: randomUUID(),
        reportId,
        characterId: characterId || null,
        action,
        moderatorId: admin.id,
      })
      .run();

    db.insert(adminActions)
      .values({
        id: randomUUID(),
        adminId: admin.id,
        action: `report_${action}`,
        targetType: "report",
        targetId: reportId,
      })
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
