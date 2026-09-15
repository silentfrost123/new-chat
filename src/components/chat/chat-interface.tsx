"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Square,
  RotateCcw,
  Copy,
  Trash2,
  MoreHorizontal,
  Info,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials, formatRelativeTime, truncate } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date | number | null;
  isEdited?: boolean;
  generationIndex?: number;
  siblingGroupId?: string | null;
  rating?: number | null;
  streaming?: boolean;
}

interface ConversationListItem {
  id: string;
  title: string;
  lastMessageAt?: Date | number | null;
  lastMessagePreview?: string | null;
  characterName: string;
  characterAvatar?: string | null;
  characterSlug: string;
}

interface Props {
  conversation: {
    id: string;
    title: string;
    character: {
      id: string;
      name: string;
      slug: string;
      avatarUrl?: string | null;
      shortDescription?: string | null;
      personality?: string | null;
      scenario?: string | null;
      contentRating?: string;
      creatorUsername?: string | null;
    };
  };
  initialMessages: ChatMessage[];
  conversationList: ConversationListItem[];
  userName: string;
}

export function ChatInterface({
  conversation,
  initialMessages,
  conversationList,
  userName,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const char = conversation.character;

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    if (isStreaming) scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const sendMessage = async (content?: string, regenerate = false, messageId?: string) => {
    const text = (content ?? input).trim();
    if ((!text && !regenerate) || isStreaming) return;

    setInput("");
    setIsStreaming(true);

    if (!regenerate && text) {
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "user",
          content: text,
          createdAt: new Date(),
        },
      ]);
    }

    // Add streaming placeholder
    const streamId = `stream-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: streamId,
        role: "assistant",
        content: "",
        streaming: true,
        createdAt: new Date(),
      },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: text,
          regenerate,
          messageId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Something went wrong." }));
        toast.error(err.error || "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalId = streamId;
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (event === "start" && parsed.messageId) {
              finalId = parsed.messageId;
              setMessages((prev) =>
                prev.map((m) => (m.id === streamId ? { ...m, id: finalId } : m))
              );
            } else if (event === "token" && parsed.content) {
              full += parsed.content;
              const currentFull = full;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === finalId || m.id === streamId
                    ? { ...m, content: currentFull, streaming: true }
                    : m
                )
              );
            } else if (event === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === finalId || m.id === streamId
                    ? {
                        ...m,
                        id: parsed.messageId || finalId,
                        content: parsed.content || full,
                        streaming: false,
                      }
                    : m
                )
              );
            } else if (event === "error") {
              toast.error(parsed.error || "Generation interrupted");
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Your generation was interrupted. Please try again.");
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.streaming ? { ...m, streaming: false, content: m.content || "…" } : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const regenerate = (msg: ChatMessage) => {
    // Find last user message before this
    const idx = messages.findIndex((m) => m.id === msg.id);
    let userContent = "";
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userContent = messages[i].content;
        break;
      }
    }
    // Remove this assistant message from view (backend keeps siblings)
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    sendMessage(userContent, true, msg.id);
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied");
  };

  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    // Soft-delete on server would go here
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Conversation sidebar */}
      <aside
        className={cn(
          "w-72 shrink-0 border-r border-border bg-card/50 flex-col",
          showSidebar ? "flex absolute inset-y-0 left-0 z-50 lg:relative" : "hidden lg:flex"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setShowSidebar(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-3">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/discover">
              <MessageSquare className="h-4 w-4 mr-1" /> New chat
            </Link>
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-4">
            {conversationList.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                onClick={() => setShowSidebar(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  c.id === conversation.id
                    ? "bg-primary/15 text-foreground"
                    : "hover:bg-accent text-muted-foreground"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  {c.characterAvatar && (
                    <AvatarImage src={c.characterAvatar} alt="" />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(c.characterName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">
                    {c.characterName}
                  </p>
                  <p className="text-xs truncate">
                    {c.lastMessagePreview
                      ? truncate(c.lastMessagePreview, 40)
                      : "No messages"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-3 sm:px-4 shrink-0 bg-card/40 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setShowSidebar(true)}
            aria-label="Conversations"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/chats" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <Link
            href={`/character/${char.slug}`}
            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
          >
            <Avatar className="h-9 w-9">
              {char.avatarUrl && <AvatarImage src={char.avatarUrl} alt="" />}
              <AvatarFallback>{getInitials(char.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm sm:text-base">
                {char.name}
              </p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {char.shortDescription}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowInfo(!showInfo)}
              aria-label="Character info"
              className={showInfo ? "text-primary" : ""}
            >
              <Info className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/character/${char.slug}`}>View profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const title = prompt("Rename conversation", conversation.title);
                    if (title) {
                      await fetch(`/api/conversations/${conversation.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title }),
                      });
                      toast.success("Renamed");
                    }
                  }}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete this conversation?")) return;
                    await fetch(`/api/conversations/${conversation.id}`, {
                      method: "DELETE",
                    });
                    router.push("/chats");
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Messages */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    characterName={char.name}
                    characterAvatar={char.avatarUrl}
                    userName={userName}
                    isStreaming={!!msg.streaming}
                    onCopy={() => copyMessage(msg.content)}
                    onRegenerate={() => regenerate(msg)}
                    onDelete={() => deleteMessage(msg.id)}
                    canRegenerate={!isStreaming && msg.role === "assistant"}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-card/60 backdrop-blur-xl p-3 sm:p-4 pb-safe">
              <div className="mx-auto max-w-3xl">
                {isStreaming && (
                  <div className="flex justify-center mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopGeneration}
                      className="rounded-full"
                    >
                      <Square className="h-3 w-3 mr-1.5 fill-current" />
                      Stop generating
                    </Button>
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/50">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Message ${char.name}...`}
                    disabled={isStreaming}
                    rows={1}
                    className="min-h-[44px] max-h-40 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-3"
                  />
                  <Button
                    size="icon"
                    variant="gradient"
                    disabled={(!input.trim() && !isStreaming) || isStreaming}
                    onClick={() => sendMessage()}
                    className="shrink-0 h-10 w-10 rounded-xl"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>

          {/* Character info panel */}
          {showInfo && (
            <aside className="hidden md:flex w-80 shrink-0 border-l border-border bg-card/40 flex-col overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto">
                    {char.avatarUrl && (
                      <AvatarImage src={char.avatarUrl} alt="" />
                    )}
                    <AvatarFallback className="text-xl">
                      {getInitials(char.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-3 font-semibold text-lg">{char.name}</h3>
                  {char.creatorUsername && (
                    <p className="text-xs text-muted-foreground">
                      by @{char.creatorUsername}
                    </p>
                  )}
                </div>
                {char.shortDescription && (
                  <p className="text-sm text-muted-foreground">
                    {char.shortDescription}
                  </p>
                )}
                {char.personality && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Personality
                    </h4>
                    <p className="text-sm leading-relaxed line-clamp-6">
                      {char.personality}
                    </p>
                  </div>
                )}
                {char.scenario && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Scenario
                    </h4>
                    <p className="text-sm leading-relaxed line-clamp-6">
                      {char.scenario}
                    </p>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href={`/character/${char.slug}`}>Full profile</Link>
                </Button>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  characterName,
  characterAvatar,
  userName,
  isStreaming,
  onCopy,
  onRegenerate,
  onDelete,
  canRegenerate,
}: {
  message: ChatMessage;
  characterName: string;
  characterAvatar?: string | null;
  userName: string;
  isStreaming: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  canRegenerate: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        {!isUser && characterAvatar && (
          <AvatarImage src={characterAvatar} alt="" />
        )}
        <AvatarFallback className="text-xs">
          {getInitials(isUser ? userName : characterName)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted/80 text-foreground rounded-bl-md"
          )}
        >
          <div className="message-content">
            {formatMessageContent(message.content)}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-vellum-400 animate-pulse-soft align-middle rounded-sm" />
            )}
          </div>
        </div>

        {!isStreaming && message.content && (
          <div
            className={cn(
              "flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity",
              isUser && "flex-row-reverse"
            )}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              onClick={onCopy}
              aria-label="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {canRegenerate && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={onRegenerate}
                aria-label="Regenerate"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessageContent(content: string) {
  // Simple *action* formatting
  const parts = content.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="text-muted-foreground not-italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
