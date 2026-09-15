import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/discover",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.toLowerCase().trim();
        const user = db.select().from(users).where(eq(users.email, email)).get();

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (user.isBanned) {
          throw new Error(user.banReason || "Your account has been suspended");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error("Invalid email or password");
        }

        // Update last active
        db.update(users)
          .set({ lastActiveAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .run();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
        token.plan = (user as { plan?: string }).plan;
      }
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.image = session.image ?? token.image;
        token.username = session.username ?? token.username;
        token.plan = session.plan ?? token.plan;
      }
      // Refresh role/plan from DB periodically
      if (token.id && (!token._refreshed || Date.now() - (token._refreshed as number) > 300000)) {
        const dbUser = db
          .select({
            role: users.role,
            plan: users.plan,
            name: users.name,
            image: users.image,
            username: users.username,
            isBanned: users.isBanned,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .get();
        if (dbUser) {
          if (dbUser.isBanned) {
            token.error = "banned";
          }
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.username = dbUser.username;
          token._refreshed = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

export function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (session.error === "banned") {
    throw new Error("Account suspended");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "moderator") {
    throw new Error("Forbidden");
  }
  return user;
}
