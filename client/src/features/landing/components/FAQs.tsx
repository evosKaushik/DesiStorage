import { FAQAccordion } from "./FAQAccordion";

const FAQS = [
  {
    q: "Is my data actually stored in India?",
    a: "Yes. Every byte lives in ap-south-1 (Mumbai) by default, with optional replication to Delhi and Bengaluru on Business plans.",
  },
  {
    q: "How is DesiStorage different from Dropbox or Google Drive?",
    a: "We are priced in rupees, host data in India, and ship features (like AI search and password-protected links) that are usually reserved for the highest tiers elsewhere.",
  },
  {
    q: "Can I invite people who don’t have an account?",
    a: "Absolutely. Share a link with an optional password and expiry — recipients can preview and download without signing up.",
  },
  {
    q: "What happens to my files if I cancel?",
    a: "You keep read-only access for 30 days to export everything. We never hold your data hostage.",
  },
  {
    q: "Do you offer discounts for startups or non-profits?",
    a: "Yes — 50% off for eligible early-stage startups and 100% off Pro for registered non-profits. Reach out to sales.",
  },
  {
    q: "Which file types can I preview?",
    a: "200+ formats — from PDFs, DOCX and PSD to RAW photos, Figma exports, 3D models and video up to 4K.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Questions, answered
          </h2>
        </div>

        <FAQAccordion items={FAQS} />
      </div>
    </section>
  );
}
