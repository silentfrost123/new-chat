"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchForm({
  initialQuery,
  initialSort,
}: {
  initialQuery: string;
  initialSort: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}&sort=${initialSort}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search characters, creators, tags..."
          className="pl-9 h-12 text-base"
          autoFocus
        />
      </div>
      <Button type="submit" variant="gradient" className="h-12 px-6">
        Search
      </Button>
    </form>
  );
}
