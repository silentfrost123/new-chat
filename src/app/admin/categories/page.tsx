import { getCategories } from "@/lib/characters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Categories",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  const categories = getCategories();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Categories</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <span className="text-3xl">{c.icon}</span>
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.slug}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
