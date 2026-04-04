"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="flex flex-1 items-center justify-center px-6 md:px-12">
      <div className="mx-auto max-w-4xl text-center">
        {/* Headline */}
        <h1 
          className="text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl lg:text-[96px]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <span className="text-balance">Proof unlocks payment.</span>
        </h1>

        {/* Subline */}
        <p 
          className="mx-auto mt-6 max-w-xl text-lg text-[#6b6b6b] md:text-xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s',
          }}
        >
          Lock funds in a contract. Someone shows up and proves it. The money moves.
        </p>

        {/* Buttons */}
        <div 
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
          }}
        >
          {/* Primary button - gradient */}
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #D21056 0%, #FF6B35 100%)',
            }}
          >
            Open Owner Dashboard
          </Link>

          {/* Secondary button - ghost/outline */}
          <Link
            href="/app"
            className="inline-flex items-center justify-center border border-white/30 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-white/50 hover:shadow-lg"
          >
            View Demo Tasks
          </Link>
        </div>
      </div>
    </section>
  )
}
