export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1c2f2f,transparent_30%),linear-gradient(180deg,#071110,#020504)] px-6 py-8 text-[#f3f5ec] md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
              Edgebind Oracle
            </div>
            <div className="mt-2 text-lg font-semibold">Pure Next.js Control Plane</div>
          </div>
          <a
            href="/app"
            className="rounded-full bg-[#d9ff66] px-5 py-2 text-sm font-semibold text-[#071110] transition hover:opacity-90"
          >
            Open App
          </a>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[#8ea38d]">
              One deployment surface
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight md:text-7xl">
              Human-backed microtasks, now running as a single Next.js app.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#b7c4b2]">
              The owner dashboard, API routes, lifecycle engine, approval flow, and
              demo data all live inside one App Router codebase. No separate Express
              service.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/app"
                className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
              >
                Launch owner console
              </a>
              <a
                href="/api/health"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#f3f5ec] transition hover:border-white/40"
              >
                Check API health
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6 shadow-2xl shadow-black/30">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
              Included in the rewrite
            </div>
            <div className="mt-6 grid gap-4">
              {[
                "App Router UI and route handlers in one deployment target",
                "Server-side task lifecycle and approval logic",
                "Demo-ready owner workflow under /app",
                "JSON APIs for future mobile integration",
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
