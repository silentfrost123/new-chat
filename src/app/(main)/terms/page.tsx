import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Vellum terms of service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-invert">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Last updated: September 15, 2026</p>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance</h2>
          <p>
            By accessing Vellum, you agree to these Terms. If you do not agree, do not use the service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Service description</h2>
          <p>
            Vellum is a web platform for discovering, creating, and chatting with AI characters.
            The service is provided through your browser at our website URL.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Accounts</h2>
          <p>
            You are responsible for your account credentials and activity. You must be of legal age
            in your jurisdiction to use mature content features.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Acceptable use</h2>
          <p>
            You may not use Vellum to generate or distribute illegal content, exploit minors,
            harass others, attempt to breach security, or abuse the AI systems. We reserve the
            right to suspend accounts that violate these rules.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Content</h2>
          <p>
            You retain rights to characters you create. By publishing publicly, you grant Vellum
            a license to display and distribute that content on the platform. AI-generated
            conversation content is provided as-is.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Subscriptions</h2>
          <p>
            Paid plans renew according to the billing cycle selected. Limits are enforced
            server-side. Refunds are handled per our billing policy and applicable law.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Disclaimers</h2>
          <p>
            AI responses may be inaccurate or unexpected. Vellum is not liable for decisions
            made based on character conversations. The service is provided &ldquo;as is.&rdquo;
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>Questions about these terms: legal@vellum.app</p>
        </section>
      </div>
    </div>
  );
}
