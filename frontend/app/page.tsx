import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1c2f2f,transparent_30%),linear-gradient(180deg,#071110,#020504)] px-6 py-8 text-[#f3f5ec] md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
              Edgebind Oracle
            </div>
            <div className="mt-2 text-lg font-semibold">Human-backed AI microtasks</div>
          </div>
          <Link
            href="/app"
            className="rounded-full bg-[#d9ff66] px-5 py-2 text-sm font-semibold text-[#071110] transition hover:opacity-90"
          >
            Open dashboard
          </Link>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[#8ea38d]">
              Verified workers. Conditional payouts. Manual approval for high-risk tasks.
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight md:text-7xl">
              Agents create tasks. Verified humans complete them. The system routes payout.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#b7c4b2]">
              Owners dispatch proof-based microtasks, workers submit evidence, the
              backend validates it, and the agent decides whether to auto-pay or send
              the payout to manual approval.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
              >
                Open owner dashboard
              </Link>
              <Link
                href="/work"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#f3f5ec] transition hover:border-white/40"
              >
                Open worker console
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6 shadow-2xl shadow-black/30">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
              Core flow
            </div>
            <div className="mt-6 grid gap-4">
              {[
                "Owner creates a proof-based microtask",
                "World-verified worker accepts and submits proof",
                "Validation runs and the agent chooses payout path",
                "Low-risk pays automatically, high-risk waits for approval",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-[#d7dfd4]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
