import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

const benefits = [
  "Free forever basic plan",
  "No credit card required",
  "Start learning in seconds",
  "AI tutor included",
]

export function LandingCTA() {
  return (
    <section className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 md:p-16">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
          </div>

          {/* Floating sparkles */}
          <Sparkles className="absolute right-10 top-10 h-8 w-8 text-white/30 animate-float" />
          <Sparkles
            className="absolute bottom-20 left-20 h-6 w-6 text-white/20 animate-float"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Start your journey today
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Ready to Start Your Language Journey?
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Join millions of learners and start speaking a new language today. It only takes 5 minutes a day.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle2 className="h-5 w-5" />
                  {benefit}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="mt-10 gap-2 bg-white text-primary font-semibold shadow-xl hover:bg-white/90"
              asChild
            >
              <Link href="/get-started">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
