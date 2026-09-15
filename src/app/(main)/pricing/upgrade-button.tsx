"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UpgradeButton({
  planSlug,
  isLoggedIn,
  isPopular,
}: {
  planSlug: string;
  isLoggedIn: boolean;
  isPopular?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planSlug }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.success) {
        toast.success(`Upgraded to ${planSlug}!`);
        router.refresh();
        return;
      }

      toast.error(data.error || "Could not start checkout");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={upgrade}
      disabled={loading}
      variant={isPopular ? "gradient" : "default"}
      className="w-full"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Upgrade to {planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}
    </Button>
  );
}
