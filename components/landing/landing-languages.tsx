import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users } from "lucide-react"

const languages = [
  { code: "es", name: "Spanish", flag: "🇪🇸", learners: "5.2M", color: "from-red-500 to-yellow-500" },
  { code: "fr", name: "French", flag: "🇫🇷", learners: "3.8M", color: "from-blue-500 to-red-500" },
  { code: "de", name: "German", flag: "🇩🇪", learners: "2.1M", color: "from-black to-yellow-500" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", learners: "1.9M", color: "from-red-500 to-white" },
  { code: "it", name: "Italian", flag: "🇮🇹", learners: "1.5M", color: "from-green-500 to-red-500" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", learners: "1.3M", color: "from-green-500 to-yellow-500" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", learners: "1.1M", color: "from-red-600 to-yellow-400" },
  { code: "ko", name: "Korean", flag: "🇰🇷", learners: "950K", color: "from-blue-600 to-red-500" },
]

export function LandingLanguages() {
  return (
    <section id="languages" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Languages
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Choose Your <span className="gradient-text">Language</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start with any of our popular courses, with more languages added regularly.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl transition-all duration-300 group-hover:scale-150" />
              <div className="relative flex flex-col items-center">
                <span className="text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {lang.flag}
                </span>
                <h3 className="mt-3 text-lg font-bold">{lang.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {lang.learners}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="shadow-lg shadow-primary/30" asChild>
            <Link href="/auth/sign-up">Start Learning Today</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
