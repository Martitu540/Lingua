import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, RefreshCw, Trophy } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const actions = [
  {
    href: "/learn",
    icon: BookOpen,
    label: "Learn",
    color: "text-primary",
    bg: "bg-primary/10 hover:bg-primary/20",
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "AI Tutor",
    color: "text-accent",
    bg: "bg-accent/10 hover:bg-accent/20",
  },
  {
    href: "/review",
    icon: RefreshCw,
    label: "Review",
    color: "text-success",
    bg: "bg-success/10 hover:bg-success/20",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    label: "Compete",
    color: "text-xp",
    bg: "bg-xp/10 hover:bg-xp/20",
  },
]

export function QuickActions() {
  return (
    <Card className="overflow-hidden border-border/50 lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-300",
              action.bg,
              "hover:scale-105 hover:shadow-lg animate-scale-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <action.icon className={cn("h-6 w-6 transition-transform duration-300 hover:scale-110", action.color)} />
            <span className="text-xs font-medium">{action.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
