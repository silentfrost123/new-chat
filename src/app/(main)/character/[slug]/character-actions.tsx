"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CharacterActions({
  characterId,
  slug,
  isLiked,
  isFavorited,
  isLoggedIn,
}: {
  characterId: string;
  slug: string;
  isLiked?: boolean;
  isFavorited?: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(!!isLiked);
  const [favorited, setFavorited] = useState(!!isFavorited);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const requireAuth = () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/character/${slug}`);
      return false;
    }
    return true;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    setLiked(!liked);
    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      setLiked(data.liked);
    } catch {
      setLiked(liked);
      toast.error("Something went wrong.");
    }
  };

  const toggleFavorite = async () => {
    if (!requireAuth()) return;
    setFavorited(!favorited);
    try {
      const res = await fetch("/api/social/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      setFavorited(data.favorited);
      toast.success(data.favorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      setFavorited(favorited);
      toast.error("Something went wrong.");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/character/${slug}`;
    if (navigator.share) {
      await navigator.share({ url, title: "Check out this character on Vellum" });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const submitReport = async () => {
    if (!requireAuth()) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, reason, details }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Report submitted");
        setReportOpen(false);
        setReason("");
        setDetails("");
      } else {
        toast.error(data.error || "Failed to submit report");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={toggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={liked ? "text-rose-400 border-rose-500/30" : ""}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={toggleFavorite}
          aria-label={favorited ? "Unfavorite" : "Favorite"}
          className={favorited ? "text-amber-400 border-amber-500/30" : ""}
        >
          <Star className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
        </Button>
        <Button variant="outline" size="lg" onClick={share} aria-label="Share">
          <Share2 className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => (requireAuth() ? setReportOpen(true) : null)}
          aria-label="Report"
        >
          <Flag className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you reporting this character?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitReport}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
