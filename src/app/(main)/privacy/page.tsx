import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Vellum privacy policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Last updated: September 15, 2026</p>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">What we collect</h2>
          <p>
            Account information (email, name, username), conversation history, characters you
            create, usage metrics, and technical logs needed to operate the service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How we use data</h2>
          <p>
            To provide chat and character features, enforce usage limits, improve the product,
            process payments, and moderate content according to our policies.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Private conversations</h2>
          <p>
            Your chats are private to your account. We access conversation content only when
            required for legitimate moderation, safety, legal compliance, or with your consent.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Third parties</h2>
          <p>
            We use AI providers to generate responses (message content is sent to the configured
            provider), payment processors for subscriptions, and hosting infrastructure. We do
            not sell personal data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Your rights</h2>
          <p>
            You may export or delete your account from Settings. You can view, edit, and delete
            memories at any time. Contact privacy@vellum.app for data requests.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Security</h2>
          <p>
            Passwords are hashed. API keys and secrets never ship to the browser. Sessions use
            secure cookies. We apply rate limiting and input validation.
          </p>
        </section>
      </div>
    </div>
  );
}
