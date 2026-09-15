"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StartChatButton({
  characterId,
  characterSlug,
  isLoggedIn,
  fullWidth,
}: {
  characterId: string;
  characterSlug: string;
  isLoggedIn: boolean;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/character/${characterSlug}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not start chat");
        return;
      }
      router.push(`/chat/${data.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={start}
      disabled={loading}
      size="lg"
      variant="gradient"
      className={fullWidth ? "w-full" : "flex-1 sm:flex-none sm:min-w-[200px]"}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
      Start Chat
    </Button>
  );
}
