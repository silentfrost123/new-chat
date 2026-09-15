"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CharacterModActions({
  characterId,
  status,
  isFeatured,
}: {
  characterId: string;
  status: string;
  isFeatured: boolean;
}) {
  const router = useRouter();

  const act = async (action: string) => {
    const res = await fetch("/api/admin/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, action }),
    });
    if (res.ok) {
      toast.success("Updated");
      router.refresh();
    } else toast.error("Failed");
  };

  return (
    <div className="flex gap-1 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => act("toggle_feature")}>
        {isFeatured ? "Unfeature" : "Feature"}
      </Button>
      {status === "published" ? (
        <Button size="sm" variant="destructive" onClick={() => act("suspend")}>
          Suspend
        </Button>
      ) : status === "suspended" ? (
        <Button size="sm" variant="outline" onClick={() => act("restore")}>
          Restore
        </Button>
      ) : null}
    </div>
  );
}
