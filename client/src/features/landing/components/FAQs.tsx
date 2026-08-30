import { FAQAccordion } from "./FAQAccordion";

const FAQS = [
  {
    q: "Is my data stored in India?",
    a: "Yes. DesiStorage is designed with India-based data storage in mind, helping keep your files closer to home.",
  },
  {
    q: "How is DesiStorage different from other cloud storage services?",
    a: "DesiStorage is built with Indian users in mind, with pricing in rupees, a simple file experience, secure sharing, and infrastructure designed for users in India.",
  },
  {
    q: "Can I share files with someone who doesn't have an account?",
    a: "Yes. Supported sharing links can be accessed by recipients without creating a DesiStorage account.",
  },
  {
    q: "What happens to my files if I cancel my plan?",
    a: "Your files remain subject to our storage and retention policies. We recommend downloading files that exceed your new plan's storage limit before the plan changes.",
  },
  {
    q: "Do you offer discounts for startups or non-profits?",
    a: "Special pricing programs may become available as DesiStorage grows. Check our pricing page for current offers.",
  },
  {
    q: "Which file types can I preview?",
    a: "DesiStorage supports previews for selected common file types, with support expanding as we add new capabilities.",
  },
  {
    q: "Are my files encrypted?",
    a: "Yes. DesiStorage protects stored data with encryption and uses secure connections when your files move between your device and our services.",
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
