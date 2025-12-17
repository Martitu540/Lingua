"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Layers, FileText, Users, Settings, LogOut, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/units", label: "Units", icon: Layers },
  { href: "/admin/lessons", label: "Lessons", icon: FileText },
  { href: "/admin/exercises", label: "Exercises", icon: Sparkles },
  { href: "/admin/users", label: "Users", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </Button>
          <Link href="/dashboard" className="mt-2 block">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <Settings className="h-5 w-5" />
              <span>Back to App</span>
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}

