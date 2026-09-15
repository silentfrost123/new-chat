"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UserActions({
  userId,
  isBanned,
  role,
}: {
  userId: string;
  isBanned: boolean;
  role: string;
}) {
  const router = useRouter();

  const moderate = async (action: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      toast.success("Updated");
      router.refresh();
    } else {
      toast.error("Failed");
    }
  };

  if (role === "admin") return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex gap-1">
      {isBanned ? (
        <Button size="sm" variant="outline" onClick={() => moderate("unban")}>
          Unban
        </Button>
      ) : (
        <Button size="sm" variant="destructive" onClick={() => moderate("ban")}>
          Ban
        </Button>
      )}
    </div>
  );
}
