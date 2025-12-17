"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Globe,
  Home,
  BookOpen,
  MessageSquare,
  Trophy,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/chat", label: "AI Tutor", icon: MessageSquare },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
]

interface DashboardSidebarProps {
  profile: Profile | null
}

function SidebarContent({
  profile,
  collapsed,
  onCollapse,
}: {
  profile: Profile | null
  collapsed: boolean
  onCollapse?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center px-2")}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Globe className="h-5 w-5 text-white" />
            {!collapsed && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
              </div>
            )}
          </div>
          {!collapsed && <span className="text-lg font-bold">LinguaFlow</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        {profile && !collapsed && (
          <div className="mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent font-bold text-white shadow-lg">
                {profile.display_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{profile.display_name || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">Level {profile.current_level}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!collapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            className={cn("flex-1 justify-start gap-3 text-muted-foreground", collapsed && "justify-center px-2")}
            asChild
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          className={cn(
            "mt-1 w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-2",
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>

      {/* Collapse toggle - desktop only */}
      {onCollapse && (
        <div className="hidden border-t p-2 md:block">
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={onCollapse}>
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
      )}
    </div>
  )
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-card transition-all duration-300 md:block",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <SidebarContent profile={profile} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40 bg-card shadow-lg">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <SidebarContent profile={profile} collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  )
}
