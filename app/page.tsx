import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingLanguages } from "@/components/landing/landing-languages"
import { LandingTestimonials } from "@/components/landing/landing-testimonials"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingLanguages />
        <LandingTestimonials />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
