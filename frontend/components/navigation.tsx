import Link from "next/link"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-5 md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Wordmark */}
        <Link 
          href="/" 
          className="text-xl font-bold tracking-tight text-white transition-all duration-300 ease-in-out hover:opacity-80"
        >
          EdgeBind
        </Link>

        {/* Right side links */}
        <div className="flex items-center gap-6">
          <Link
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 transition-all duration-300 ease-in-out hover:text-white"
          >
            Discord
          </Link>
          <Link
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 transition-all duration-300 ease-in-out hover:text-white"
          >
            X
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #D21056 0%, #FF6B35 100%)',
            }}
          >
            Open App
          </Link>
        </div>
      </div>
    </nav>
  )
}
