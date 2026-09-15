import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "default",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg" },
    default: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-10 w-10", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 group", className)}
      aria-label="Vellum home"
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-vellum-500 via-vellum-600 to-pink-600 shadow-glow-sm transition-transform group-hover:scale-105",
          s.icon
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[55%] w-[55%] text-white"
          aria-hidden
        >
          <path
            d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v6c0 1.38-1.12 2.5-2.5 2.5H13l-3.5 3v-3H6.5C5.12 16 4 14.88 4 13.5v-6z"
            fill="currentColor"
            opacity="0.95"
          />
          <circle cx="9" cy="10.5" r="1" fill="#5b21b6" />
          <circle cx="12" cy="10.5" r="1" fill="#5b21b6" />
          <circle cx="15" cy="10.5" r="1" fill="#5b21b6" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            "font-display font-bold tracking-tight text-foreground",
            s.text
          )}
        >
          Vellum
        </span>
      )}
    </Link>
  );
}
