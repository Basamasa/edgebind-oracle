"use client"

import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0c0c0c]">
      {/* Dotted grid background */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navigation />
        <Hero />
      </div>
    </main>
  )
}
