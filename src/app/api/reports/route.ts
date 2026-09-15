import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

const schema = z.object({
  reason: z.string().min(1).max(200),
  details: z.string().max(2000).optional(),
  characterId: z.string().optional(),
  messageId: z.string().optional(),
  conversationId: z.string().optional(),
  reportedUserId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  db.insert(reports)
    .values({
      id: randomUUID(),
      reporterId: session.user.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
      characterId: parsed.data.characterId,
      messageId: parsed.data.messageId,
      conversationId: parsed.data.conversationId,
      reportedUserId: parsed.data.reportedUserId,
      status: "pending",
    })
    .run();

  return NextResponse.json({ success: true, message: "Report submitted. Thank you." });
}
