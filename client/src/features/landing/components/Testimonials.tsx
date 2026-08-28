const QUOTES = [
  {
    quote:
      "A simple storage experience that makes uploading, organizing, and sharing files feel effortless.",
    name: "Early User",
    role: "Placeholder testimonial",
  },
  {
    quote:
      "The interface feels clean and familiar. Finding and managing files is exactly what cloud storage should feel like.",
    name: "Beta User",
    role: "Placeholder testimonial",
  },
  {
    quote:
      "Having a storage service designed with Indian users and rupee-based pricing in mind is a welcome idea.",
    name: "Beta Tester",
    role: "Placeholder testimonial",
  },
  {
    quote:
      "Fast uploads, straightforward file management, and sharing without unnecessary complexity.",
    name: "Early Tester",
    role: "Placeholder testimonial",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Early feedback
          </p>

          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Built with users in mind
          </h2>

          <p className="mt-4 text-muted-foreground">
            A few examples of the kind of feedback we're looking for during
            the early access phase.
          </p>
        </div>

        <div className="mt-14 columns-1 gap-6 md:columns-2 lg:columns-4 [column-fill:_balance]">
          {QUOTES.map((q, i) => (
            <figure
              key={i}
              className="mb-6 break-inside-avoid rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <blockquote className="text-[15px] leading-relaxed text-foreground">
                “{q.quote}”
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {q.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {q.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {q.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

