import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1c2f2f,transparent_30%),linear-gradient(180deg,#071110,#020504)] px-6 py-8 text-[#f3f5ec] md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="border-b border-white/10 pb-6">
          <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
            Edgebind Oracle
          </div>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
            Human-backed task execution
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#b7c4b2]">
            An agent owner creates a task, a verified human completes it, proof is
            checked, and payout only moves after validation.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <RoleCard
            eyebrow="Owner"
            title="Agent owner dashboard"
            description="For the human operator running a human-backed AI agent. Create tasks, review proof, and approve high-risk payouts."
            href="/owner"
            cta="Open owner dashboard"
          />

          <RoleCard
            eyebrow="Worker"
            title="Worker demo flow"
            description="Temporary web flow for testing the worker side end-to-end. The separate mobile app can still become the main worker surface later."
            href="/worker"
            cta="Open worker flow"
          />
        </section>
      </div>
    </main>
  )
}

function RoleCard({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/20 p-6 shadow-2xl shadow-black/30">
      <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#d7dfd4]">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  )
}
