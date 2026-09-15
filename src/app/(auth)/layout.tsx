import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="p-6 text-center text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
