"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react"

const improvements = [
  {
    category: "User Engagement",
    priority: "High",
    items: [
      "Add push notifications for daily practice reminders",
      "Implement achievement badges and milestones",
      "Create weekly challenges and competitions",
      "Add social features: friend system, study groups",
      "Implement spaced repetition algorithm for better retention",
    ],
  },
  {
    category: "Content & Learning",
    priority: "High",
    items: [
      "Add more exercise types: flashcards, pronunciation practice",
      "Implement adaptive learning paths based on performance",
      "Add video lessons and interactive dialogues",
      "Create grammar explanations and tips",
      "Add cultural context and real-world usage examples",
    ],
  },
  {
    category: "Performance & UX",
    priority: "Medium",
    items: [
      "Implement offline mode for mobile app",
      "Add progress tracking with detailed analytics",
      "Optimize image loading and lazy loading",
      "Add skeleton loaders for better perceived performance",
      "Implement service worker for PWA capabilities",
    ],
  },
  {
    category: "Monetization",
    priority: "Medium",
    items: [
      "Add premium subscription tiers",
      "Implement referral program with rewards",
      "Create marketplace for user-generated content",
      "Add corporate/educational licenses",
      "Implement affiliate program",
    ],
  },
  {
    category: "Technical",
    priority: "Low",
    items: [
      "Add comprehensive error tracking (Sentry)",
      "Implement A/B testing framework",
      "Add automated testing (unit, integration, e2e)",
      "Set up CI/CD pipeline",
      "Implement feature flags system",
    ],
  },
]

const priorityColors = {
  High: "destructive",
  Medium: "default",
  Low: "secondary",
} as const

export function AdminImprovements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          Platform Improvements & Recommendations
        </h2>
        <p className="text-muted-foreground">Actionable insights to enhance user experience and growth</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {improvements.map((improvement, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{improvement.category}</span>
                <Badge variant={priorityColors[improvement.priority as keyof typeof priorityColors]}>
                  {improvement.priority} Priority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {improvement.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Wins (Implement First)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li>
              <strong>Add daily practice reminders:</strong> Increase user retention by 30-40% with simple email/push
              notifications
            </li>
            <li>
              <strong>Implement achievement system:</strong> Gamification increases engagement significantly
            </li>
            <li>
              <strong>Add progress visualization:</strong> Users love seeing their learning journey
            </li>
            <li>
              <strong>Optimize mobile experience:</strong> 60%+ of users are on mobile - ensure perfect responsive design
            </li>
            <li>
              <strong>Add social proof:</strong> Show user testimonials, success stories, and leaderboards
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

