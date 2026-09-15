"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ConversationActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();

  const rename = async () => {
    const next = prompt("Rename conversation", title);
    if (!next || next === title) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next }),
    });
    toast.success("Renamed");
    router.refresh();
  };

  const archive = async () => {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    toast.success("Archived");
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Delete this conversation permanently?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Conversation options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={rename}>
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={archive}>
          <Archive className="mr-2 h-4 w-4" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem onClick={remove} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
