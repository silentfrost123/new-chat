"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Save,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  "Basics",
  "Avatar",
  "Description",
  "Personality",
  "Backstory",
  "Scenario",
  "Greeting",
  "Dialogue",
  "Tags",
  "Category",
  "Visibility",
  "Rating",
  "Publish",
];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function CreateCharacterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    personality: "",
    backstory: "",
    scenario: "",
    greeting: "",
    exampleDialogue: "",
    speakingStyle: "",
    goals: "",
    likes: "",
    dislikes: "",
    knowledge: "",
    avatarUrl: "",
    categoryId: "",
    tags: [] as string[],
    visibility: "public" as "public" | "unlisted" | "private",
    contentRating: "safe" as "safe" | "suggestive" | "mature",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/create");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.shortDescription.trim().length > 0;
      case 2:
        return form.description.trim().length > 0;
      case 3:
        return form.personality.trim().length > 0;
      case 6:
        return form.greeting.trim().length > 0;
      default:
        return true;
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.name || !form.shortDescription || !form.description || !form.personality || !form.greeting) {
      toast.error("Please fill in required fields: name, short description, description, personality, and greeting.");
      setStep(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(status === "published" ? "Character published!" : "Draft saved");
      router.push(`/character/${data.slug}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Create character</h1>
      <p className="mt-1 text-muted-foreground">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {/* Progress */}
      <div className="mt-6 flex gap-1">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      <div className="mt-8 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Character name *" htmlFor="name">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Luna Vale"
                maxLength={80}
              />
            </Field>
            <Field label="Short description *" htmlFor="short">
              <Input
                id="short"
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="One-line hook that appears on cards"
                maxLength={200}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Avatar URL" htmlFor="avatar">
              <Input
                id="avatar"
                value={form.avatarUrl}
                onChange={(e) => set("avatarUrl", e.target.value)}
                placeholder="https://... or leave blank for initials"
              />
            </Field>
            <p className="text-sm text-muted-foreground">
              Upload support uses signed URLs in production. For now, paste an image URL or leave blank.
            </p>
          </div>
        )}

        {step === 2 && (
          <Field label="Full description *" htmlFor="desc">
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A richer description of who this character is..."
              rows={8}
              maxLength={5000}
            />
          </Field>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Field label="Personality *" htmlFor="personality">
              <Textarea
                id="personality"
                value={form.personality}
                onChange={(e) => set("personality", e.target.value)}
                placeholder="How do they think, speak, and behave?"
                rows={6}
              />
            </Field>
            <Field label="Speaking style" htmlFor="style">
              <Input
                id="style"
                value={form.speakingStyle}
                onChange={(e) => set("speakingStyle", e.target.value)}
                placeholder="e.g. Soft-spoken, poetic, uses scientific metaphors"
              />
            </Field>
            <Field label="Goals" htmlFor="goals">
              <Input
                id="goals"
                value={form.goals}
                onChange={(e) => set("goals", e.target.value)}
                placeholder="What drives them?"
              />
            </Field>
          </div>
        )}

        {step === 4 && (
          <Field label="Backstory" htmlFor="backstory">
            <Textarea
              id="backstory"
              value={form.backstory}
              onChange={(e) => set("backstory", e.target.value)}
              placeholder="Their history and formative experiences..."
              rows={8}
            />
          </Field>
        )}

        {step === 5 && (
          <Field label="Scenario" htmlFor="scenario">
            <Textarea
              id="scenario"
              value={form.scenario}
              onChange={(e) => set("scenario", e.target.value)}
              placeholder="The setting where conversations begin..."
              rows={6}
            />
          </Field>
        )}

        {step === 6 && (
          <Field label="Greeting message *" htmlFor="greeting">
            <Textarea
              id="greeting"
              value={form.greeting}
              onChange={(e) => set("greeting", e.target.value)}
              placeholder="The first message users see when starting a chat..."
              rows={6}
            />
          </Field>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <Field label="Example dialogue" htmlFor="dialogue">
              <Textarea
                id="dialogue"
                value={form.exampleDialogue}
                onChange={(e) => set("exampleDialogue", e.target.value)}
                placeholder={"User: Hello\nCharacter: *smiles* Hi there..."}
                rows={8}
              />
            </Field>
            <Field label="Likes" htmlFor="likes">
              <Input
                id="likes"
                value={form.likes}
                onChange={(e) => set("likes", e.target.value)}
              />
            </Field>
            <Field label="Dislikes" htmlFor="dislikes">
              <Input
                id="dislikes"
                value={form.dislikes}
                onChange={(e) => set("dislikes", e.target.value)}
              />
            </Field>
            <Field label="Knowledge" htmlFor="knowledge">
              <Input
                id="knowledge"
                value={form.knowledge}
                onChange={(e) => set("knowledge", e.target.value)}
                placeholder="Topics they know well"
              />
            </Field>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <Field label="Tags" htmlFor="tags">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                  className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-destructive/20"
                >
                  #{t} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <Field label="Category" htmlFor="category">
            <Select
              value={form.categoryId}
              onValueChange={(v) => set("categoryId", v)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {step === 10 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Who can see this character?
            </p>
            {(
              [
                ["public", "Public", "Anyone can find and chat"],
                ["unlisted", "Unlisted", "Only people with the link"],
                ["private", "Private", "Only you"],
              ] as const
            ).map(([value, label, desc]) => (
              <button
                key={value}
                onClick={() => set("visibility", value)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-colors",
                  form.visibility === value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                )}
              >
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 11 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Content classification
            </p>
            {(
              [
                ["safe", "Safe", "Suitable for all audiences"],
                ["suggestive", "Suggestive (16+)", "Mild mature themes"],
                ["mature", "Mature (18+)", "Adult themes — age gate required"],
              ] as const
            ).map(([value, label, desc]) => (
              <button
                key={value}
                onClick={() => set("contentRating", value)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-colors",
                  form.contentRating === value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                )}
              >
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 12 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h3 className="font-semibold text-xl">{form.name || "Untitled"}</h3>
              <p className="text-muted-foreground">{form.shortDescription}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                  {form.visibility}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                  {form.contentRating}
                </span>
                {form.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
              {form.greeting && (
                <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Greeting preview</p>
                  {form.greeting}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading}
                onClick={() => save("draft")}
              >
                <Save className="h-4 w-4" /> Save draft
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                disabled={loading}
                onClick={() => save("published")}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Publish
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 12 && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            variant="gradient"
            onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            disabled={!canProceed()}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
