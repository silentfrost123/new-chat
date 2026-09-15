import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(80),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let username =
      parsed.data.username?.toLowerCase() ||
      slugify(name).replace(/-/g, "_").slice(0, 20) ||
      `user_${randomUUID().slice(0, 8)}`;

    // Ensure unique username
    let attempt = 0;
    while (
      db.select().from(users).where(eq(users.username, username)).get() &&
      attempt < 10
    ) {
      username = `${username.slice(0, 20)}_${Math.floor(Math.random() * 9999)}`;
      attempt++;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();

    db.insert(users)
      .values({
        id,
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        username,
        role: "user",
        plan: "free",
        emailVerified: new Date(), // auto-verify for demo
        ageVerified: false,
      })
      .run();

    return NextResponse.json({
      success: true,
      user: { id, email: normalizedEmail, name, username },
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
