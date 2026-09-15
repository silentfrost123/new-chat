import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { UserActions } from "./user-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Users",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const list = db.select().from(users).orderBy(desc(users.createdAt)).limit(100).all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Users</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Messages</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · @{u.username}
                      </p>
                    </div>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3 capitalize">{u.plan}</td>
                  <td className="p-3">{u.messageCount}</td>
                  <td className="p-3">
                    {u.isBanned ? (
                      <span className="text-rose-400">Banned</span>
                    ) : (
                      <span className="text-emerald-400">Active</span>
                    )}
                  </td>
                  <td className="p-3">
                    <UserActions
                      userId={u.id}
                      isBanned={!!u.isBanned}
                      role={u.role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
