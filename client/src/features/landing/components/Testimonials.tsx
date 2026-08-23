const QUOTES = [
  {
    quote:
      "We moved 3 TB from Dropbox in an afternoon. The AI search alone paid for the year.",
    name: "Ananya Rao",
    role: "Head of Ops, Fintech Studio",
  },
  {
    quote:
      "It’s the first storage tool my designers and finance team both love. That never happens.",
    name: "Rohan Mehta",
    role: "COO, Kettle & Co.",
  },
  {
    quote:
      "Data in Mumbai, invoices in rupees, support in Hindi. Finally, a serious cloud built for us.",
    name: "Priya Iyer",
    role: "CTO, Bharat Labs",
  },
  {
    quote:
      "The previews are magic. I haven’t downloaded a file in three months.",
    name: "Kabir Shah",
    role: "Creative Director",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Loved by teams
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Words from people who ship
          </h2>
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
                  <p className="text-sm font-semibold text-foreground">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
