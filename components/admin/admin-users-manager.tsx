"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { RefreshCw, Search, Crown, Flame, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  display_name: string
  email: string
  total_xp: number
  current_level: number
  streak_count: number
  hearts: number
  created_at: string
  is_premium: boolean
}

interface AdminUsersManagerProps {
  users: User[]
}

export function AdminUsersManager({ users: initialUsers }: AdminUsersManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">View and manage all users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{user.display_name}</span>
                {user.is_premium && (
                  <Badge variant="outline" className="border-gold text-gold">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-xp" />
                  <span className="font-semibold">{user.total_xp}</span>
                  <span className="text-muted-foreground">XP</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-streak" />
                  <span className="font-semibold">{user.streak_count}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {user.current_level}</span>
                <span className="text-muted-foreground">{user.hearts} ❤️</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

