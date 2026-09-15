import Link from "next/link";
import {
  Sparkles,
  MessageCircle,
  Wand2,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Star,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/characters/character-card";
import { listCharacters, getCategories } from "@/lib/characters";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const faqs = [
  {
    q: "What is Vellum?",
    a: "Vellum is a web platform where you discover and chat with AI characters, or create your own. Every conversation happens in your browser — no app download required.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. The Free plan lets you chat with public characters and create a few of your own. Plus and Pro unlock higher limits, better models, and advanced memory.",
  },
  {
    q: "Can I create my own characters?",
    a: "Absolutely. Use the character creator to define personality, backstory, greeting, scenario, and more. Publish publicly or keep them private.",
  },
  {
    q: "Are my conversations private?",
    a: "Yes. Your chats are private to your account. We only access content when required for moderation under our documented policies.",
  },
  {
    q: "Does Vellum work on mobile?",
    a: "Yes. Vellum is a responsive website that works in desktop, tablet, and mobile browsers. Visit the same URL on any device.",
  },
];

export default function HomePage() {
  const featured = listCharacters({ featured: true, limit: 6, sort: "trending" });
  const trending = listCharacters({ sort: "trending", limit: 8 });
  const newest = listCharacters({ sort: "newest", limit: 6 });
  const popular = listCharacters({ sort: "popular", limit: 6 });
  const categories = getCategories();
  const allPlans = db.select().from(plans).orderBy(asc(plans.sortOrder)).all();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.08),transparent_60%)]" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-vellum-600/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-pink-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-vellum-500/30 bg-vellum-500/10 px-4 py-1.5 text-sm text-vellum-300 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            AI characters, crafted for real conversation
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance animate-fade-in">
            Meet characters{" "}
            <span className="gradient-text">worth talking to.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground text-balance animate-fade-in">
            Discover AI personalities, start conversations, and create characters
            of your own. All in your browser.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto">
              <Link href="/discover">
                Explore Characters
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
              <Link href="/create">Create Your Character</Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="w-full sm:w-auto">
              <Link href="/discover">Start Chatting</Link>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-vellum-400" />
              Streaming chat
            </div>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-pink-400" />
              Full creator tools
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Private by default
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <SectionHeader
            title="Featured characters"
            subtitle="Hand-picked personalities to get you started"
            href="/discover?sort=featured"
          />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <SectionHeader
            title="Trending now"
            subtitle="Characters everyone is talking to"
            href="/discover?sort=trending"
          />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {trending.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeader title="Browse by category" subtitle="Find the vibe you're looking for" />
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/discover?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/50 p-4 text-center transition-all hover:border-vellum-500/40 hover:bg-card hover:shadow-glow-sm"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium group-hover:text-vellum-300 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular + New */}
      <section className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-2 gap-12">
        <div>
          <SectionHeader title="Most popular" href="/discover?sort=popular" />
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {popular.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Newly added" href="/discover?sort=newest" />
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {newest.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps to your next great conversation</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Discover",
              desc: "Browse featured, trending, and categorized characters — or search by name, tag, or vibe.",
            },
            {
              icon: MessageCircle,
              title: "Chat",
              desc: "Open a character page, hit Start Chat, and watch responses stream into your browser in real time.",
            },
            {
              icon: Wand2,
              title: "Create",
              desc: "Build original characters with rich personality, memory, and scenarios. Share them with the world.",
            },
          ].map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-border/60 bg-card/50 p-8 text-center"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-vellum-600 to-pink-600 shadow-glow-sm">
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-4xl font-bold text-muted/30">
                {i + 1}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Creator CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-vellum-500/20 bg-gradient-to-br from-vellum-950/80 via-card to-pink-950/40 p-10 sm:p-16">
          <div className="absolute inset-0 bg-card-glow" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Build characters people remember
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Define personality, backstory, speaking style, and world. Publish
              publicly or keep them private. Your creations, your rules.
            </p>
            <Button asChild size="lg" variant="gradient" className="mt-8">
              <Link href="/create">
                Open the creator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-6xl px-4 py-16" id="pricing">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Simple plans</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {allPlans.map((plan) => {
            const features: string[] = plan.features
              ? JSON.parse(plan.features)
              : [];
            const isPopular = plan.slug === "plus";
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-8 ${
                  isPopular
                    ? "border-vellum-500/50 bg-vellum-950/30 shadow-glow"
                    : "border-border/60 bg-card/50"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-vellum-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold">
                    ${((plan.priceMonthly || 0) / 100).toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-vellum-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 w-full"
                  variant={isPopular ? "gradient" : "outline"}
                >
                  <Link href="/pricing">{plan.priceMonthly === 0 ? "Get started" : "Upgrade"}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-10">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border/60 bg-card/50 overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-5 text-left font-medium list-none">
                {faq.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <p className="font-display text-lg font-bold">Vellum</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Meet characters worth talking to.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/discover" className="hover:text-foreground">Discover</Link></li>
                <li><Link href="/create" className="hover:text-foreground">Create</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/community-guidelines" className="hover:text-foreground">Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Account</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Sign up</Link></li>
                <li><Link href="/settings" className="hover:text-foreground">Settings</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Vellum. All rights reserved.</p>
            <p className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Built for the browser
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="hidden sm:flex items-center gap-1 text-sm text-vellum-400 hover:text-vellum-300 transition-colors shrink-0"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
