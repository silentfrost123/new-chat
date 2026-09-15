import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Vellum community guidelines",
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-6">Community Guidelines</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          Vellum is built for creative, respectful conversation. These guidelines keep the
          community safe.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Strictly prohibited</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Any sexual or exploitative content involving minors (fictional or real)</li>
            <li>Real-world harm, terrorism, or violent crime instructions</li>
            <li>Non-consensual intimate imagery</li>
            <li>Scams, phishing, or malware distribution</li>
            <li>Harassment, doxxing, or targeted abuse of real people</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Content ratings</h2>
          <p>
            Label characters accurately (Safe, Suggestive, Mature). Mature content requires
            appropriate age verification where required by law. Mislabeling may result in
            removal.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Reporting</h2>
          <p>
            Use the report button on characters or contact moderation. We review reports and
            may warn, remove content, suspend, or ban accounts. Audit logs are retained.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Blocking</h2>
          <p>
            You can block users who bother you. Blocked users cannot interact with your
            public profile activity in ways we can enforce on-platform.
          </p>
        </section>
      </div>
    </div>
  );
}
