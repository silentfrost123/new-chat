"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FollowButton({
  userId,
  isFollowing: initial,
  isLoggedIn,
}: {
  userId: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setFollowing(!following);
    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setFollowing(data.following);
      router.refresh();
    } catch {
      setFollowing(following);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      variant={following ? "outline" : "gradient"}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
