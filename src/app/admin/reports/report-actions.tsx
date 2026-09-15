"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReportActions({
  reportId,
  characterId,
}: {
  reportId: string;
  characterId?: string | null;
}) {
  const router = useRouter();

  const resolve = async (action: string) => {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, characterId }),
    });
    if (res.ok) {
      toast.success("Report updated");
      router.refresh();
    } else toast.error("Failed");
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => resolve("dismiss")}>
        Dismiss
      </Button>
      <Button size="sm" variant="outline" onClick={() => resolve("warn")}>
        Warn
      </Button>
      {characterId && (
        <Button size="sm" variant="destructive" onClick={() => resolve("remove_character")}>
          Remove character
        </Button>
      )}
      <Button size="sm" variant="destructive" onClick={() => resolve("resolve")}>
        Resolve
      </Button>
    </div>
  );
}
