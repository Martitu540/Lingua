import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, Menu, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Globe className="h-5 w-5 text-white" />
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">LinguaFlow</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="#languages"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Languages
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Stories
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" className="font-medium" asChild>
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button className="font-medium shadow-lg shadow-primary/25" asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-6 pt-6">
                <Link href="#features" className="text-lg font-medium">
                  Features
                </Link>
                <Link href="#languages" className="text-lg font-medium">
                  Languages
                </Link>
                <Link href="#testimonials" className="text-lg font-medium">
                  Stories
                </Link>
                <hr className="my-2" />
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild className="w-full shadow-lg shadow-primary/25">
                  <Link href="/get-started">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
