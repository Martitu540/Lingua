"use client"

import { Bot, Gamepad2, BarChart3, Mic, Clock, Award } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const features = [
  {
    icon: Bot,
    title: "AI Conversation Tutor",
    description: "Practice real conversations with our AI tutor. Get instant feedback on pronunciation and grammar.",
    gradient: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    glowColor: "shadow-violet-500/20",
  },
  {
    icon: Gamepad2,
    title: "Gamified Learning",
    description: "Earn XP, maintain streaks, unlock achievements, and compete on leaderboards to stay motivated.",
    gradient: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    glowColor: "shadow-amber-500/20",
  },
  {
    icon: BarChart3,
    title: "Adaptive Learning",
    description: "Our AI adapts to your level, focusing on areas where you need the most practice.",
    gradient: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    glowColor: "shadow-emerald-500/20",
  },
  {
    icon: Mic,
    title: "Speech Recognition",
    description: "Practice speaking with advanced speech recognition. Perfect your accent and pronunciation.",
    gradient: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    glowColor: "shadow-rose-500/20",
  },
  {
    icon: Clock,
    title: "Bite-sized Lessons",
    description: "Learn in just 5-10 minutes a day. Perfect for busy schedules and consistent progress.",
    gradient: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    glowColor: "shadow-cyan-500/20",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Earn certificates as you complete courses. Share your achievements with the world.",
    gradient: "from-yellow-500 to-amber-600",
    bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    glowColor: "shadow-yellow-500/20",
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0]
  index: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index])

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-500 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl ${feature.glowColor} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Animated gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
      />

      {/* Floating orb decoration */}
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-150`}
      />

      <div
        className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${feature.glowColor}`}
      >
        <feature.icon
          className={`h-7 w-7 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`}
        />
      </div>

      <h3 className="relative text-xl font-bold">{feature.title}</h3>
      <p className="relative mt-2 text-muted-foreground">{feature.description}</p>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full`}
      />
    </div>
  )
}

export function LandingFeatures() {
  return (
    <section id="features" className="relative border-t bg-muted/30 px-4 py-20 md:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] animate-blob" />
        <div className="absolute right-0 bottom-1/4 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-lg shadow-primary/10">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[size:200%_auto] bg-clip-text text-transparent animate-gradient">
              Master a Language
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to make language learning effective and enjoyable.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
