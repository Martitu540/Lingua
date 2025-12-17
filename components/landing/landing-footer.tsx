import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Globe, Sparkles, Github, Twitter } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingFooter() {
  return (
    <footer className="border-t bg-card px-4 py-12">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Globe className="h-5 w-5 text-white" />
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight">LinguaFlow</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The modern way to learn languages. Powered by AI, designed for humans.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <a href="#" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <a href="#" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="transition-colors hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#languages" className="transition-colors hover:text-primary">
                  Languages
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>2025 LinguaFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
