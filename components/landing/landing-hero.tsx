"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Flame, Trophy, Zap, Play } from "lucide-react"
import { useEffect, useState } from "react"

export function LandingHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-gradient">
        {/* Animated blobs */}
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] animate-blob dark:bg-primary/20" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[100px] animate-blob animation-delay-2000 dark:bg-accent/15" />
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px] animate-blob animation-delay-4000" />
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_110%)] opacity-30" />
      </div>

      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm shadow-lg shadow-primary/10 transition-all duration-500 ${mounted ? "animate-slide-up" : "opacity-0"}`}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            AI-Powered Language Learning
            <span className="rounded-full bg-gradient-to-r from-accent to-primary px-2 py-0.5 text-xs font-bold text-white">
              NEW
            </span>
          </div>

          <h1
            className={`max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl transition-all duration-700 delay-100 ${mounted ? "animate-slide-up" : "opacity-0 translate-y-4"}`}
          >
            Learn Any Language,{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[size:200%_auto] bg-clip-text text-transparent animate-gradient">
                The Fun Way
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path
                  d="M2 10C50 4 150 0 298 8"
                  stroke="url(#underline-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-[draw_1s_ease-out_forwards]"
                  style={{
                    strokeDasharray: 300,
                    strokeDashoffset: 300,
                    animation: mounted ? "draw 1s ease-out 0.5s forwards" : "none",
                  }}
                />
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="var(--primary)" />
                    <stop offset="1" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl transition-all duration-700 delay-200 ${mounted ? "animate-slide-up" : "opacity-0 translate-y-4"}`}
          >
            Master languages through gamified lessons, AI conversations, and personalized learning paths. Join millions
            learning with LinguaFlow.
          </p>

          <div
            className={`mt-10 flex flex-col gap-4 sm:flex-row transition-all duration-700 delay-300 ${mounted ? "animate-slide-up" : "opacity-0 translate-y-4"}`}
          >
            <Button
              size="lg"
              className="gap-2 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link href="/get-started">
                Start Learning Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link href="#features">
                <Play className="h-4 w-4" />
                See How It Works
              </Link>
            </Button>
          </div>

          <div
            className={`mt-16 grid grid-cols-3 gap-8 md:gap-16 transition-all duration-700 delay-[400ms] ${mounted ? "animate-slide-up" : "opacity-0 translate-y-4"}`}
          >
            <div className="group flex flex-col items-center">
              <div className="flex items-center gap-2 text-3xl font-bold md:text-4xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-streak/15 group-hover:bg-streak/25 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-streak/20">
                  <Flame className="h-6 w-6 text-streak group-hover:animate-flame" />
                </div>
                <span className="tabular-nums">10M+</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Active Learners</p>
            </div>
            <div className="group flex flex-col items-center">
              <div className="flex items-center gap-2 text-3xl font-bold md:text-4xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xp/15 group-hover:bg-xp/25 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-xp/20">
                  <Trophy className="h-6 w-6 text-xp" />
                </div>
                <span className="tabular-nums">15+</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Languages</p>
            </div>
            <div className="group flex flex-col items-center">
              <div className="flex items-center gap-2 text-3xl font-bold md:text-4xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <span className="tabular-nums">5 min</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Daily Lessons</p>
            </div>
          </div>

          <div
            className={`mt-20 w-full max-w-5xl transition-all duration-1000 delay-500 ${mounted ? "animate-slide-up" : "opacity-0 translate-y-8"}`}
          >
            <div className="relative rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-xl p-1.5 shadow-2xl shadow-primary/10 dark:shadow-primary/5 hover:shadow-3xl hover:shadow-primary/20 transition-all duration-500 group">
              {/* Animated border glow */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 -z-10" />

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-bold text-white shadow-lg">
                Live Preview
              </div>
              <div className="rounded-xl bg-muted/50 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-2xl font-bold text-white shadow-lg shadow-orange-500/30 animate-scale-pulse">
                      ES
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Spanish - Basics 1</p>
                      <p className="text-sm text-muted-foreground">Lesson 3 of 5</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-4 sm:flex">
                    <div className="flex items-center gap-2 rounded-full bg-streak/15 px-3 py-1.5 shadow-md">
                      <Flame className="h-5 w-5 text-streak animate-flame" />
                      <span className="font-bold text-streak">7</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-xp/15 px-3 py-1.5 shadow-md">
                      <Zap className="h-5 w-5 text-xp" />
                      <span className="font-bold text-xp">250</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border-2 bg-background p-6">
                  <p className="text-center text-muted-foreground">Translate this phrase:</p>
                  <p className="mt-2 text-center text-2xl font-bold">Buenos días</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border-2 border-primary bg-primary/10 p-4 text-center font-medium text-primary transition-all shadow-md shadow-primary/20 cursor-pointer">
                      Good morning
                    </div>
                    <div className="rounded-xl border-2 border-border p-4 text-center text-muted-foreground transition-all hover:border-muted-foreground hover:bg-muted/50 cursor-pointer">
                      Good night
                    </div>
                    <div className="rounded-xl border-2 border-border p-4 text-center text-muted-foreground transition-all hover:border-muted-foreground hover:bg-muted/50 cursor-pointer">
                      Good afternoon
                    </div>
                    <div className="rounded-xl border-2 border-border p-4 text-center text-muted-foreground transition-all hover:border-muted-foreground hover:bg-muted/50 cursor-pointer">
                      Hello
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  )
}
