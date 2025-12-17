"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"
import { User, Bell, Volume2, Globe, Shield, Trash2, Save, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsFormProps {
  profile: Profile | null
  userEmail: string
}

export function SettingsForm({ profile, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile settings
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [nativeLanguage, setNativeLanguage] = useState(profile?.native_language || "en")

  // Notification settings
  const [dailyReminder, setDailyReminder] = useState(true)
  const [streakReminder, setStreakReminder] = useState(true)
  const [weeklyProgress, setWeeklyProgress] = useState(true)

  // Sound settings
  const [soundEffects, setSoundEffects] = useState(true)
  const [pronunciation, setPronunciation] = useState(true)

  // Learning settings
  const [dailyGoal, setDailyGoal] = useState("50")
  const [autoPlay, setAutoPlay] = useState(true)
  const [funnierMode, setFunnierMode] = useState(
    (profile?.settings as any)?.learning?.funnierMode || false
  )

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        native_language: nativeLanguage,
        settings: {
          notifications: {
            dailyReminder,
            streakReminder,
            weeklyProgress,
          },
          sound: {
            effects: soundEffects,
            pronunciation,
          },
          learning: {
            dailyGoal: Number.parseInt(dailyGoal),
            autoPlay,
            funnierMode,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile?.id)

    setLoading(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userEmail} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language</Label>
            <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
              <SelectTrigger id="nativeLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Learning Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Learning
          </CardTitle>
          <CardDescription>Customize your learning experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Daily XP Goal</Label>
            <Select value={dailyGoal} onValueChange={setDailyGoal}>
              <SelectTrigger id="dailyGoal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Casual (10 XP)</SelectItem>
                <SelectItem value="30">Regular (30 XP)</SelectItem>
                <SelectItem value="50">Serious (50 XP)</SelectItem>
                <SelectItem value="100">Intense (100 XP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-play Audio</Label>
              <p className="text-sm text-muted-foreground">Automatically play pronunciation</p>
            </div>
            <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Funnier Mode</Label>
              <p className="text-sm text-muted-foreground">Make speech more fun and energetic</p>
            </div>
            <Switch checked={funnierMode} onCheckedChange={setFunnierMode} />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Sound
          </CardTitle>
          <CardDescription>Control audio settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound Effects</Label>
              <p className="text-sm text-muted-foreground">Play sounds for correct/incorrect answers</p>
            </div>
            <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pronunciation</Label>
              <p className="text-sm text-muted-foreground">Enable text-to-speech for words</p>
            </div>
            <Switch checked={pronunciation} onCheckedChange={setPronunciation} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Reminder</Label>
              <p className="text-sm text-muted-foreground">Get reminded to practice every day</p>
            </div>
            <Switch checked={dailyReminder} onCheckedChange={setDailyReminder} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Streak Reminder</Label>
              <p className="text-sm text-muted-foreground">{"Get notified if you're about to lose your streak"}</p>
            </div>
            <Switch checked={streakReminder} onCheckedChange={setStreakReminder} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Progress</Label>
              <p className="text-sm text-muted-foreground">Receive weekly progress reports</p>
            </div>
            <Switch checked={weeklyProgress} onCheckedChange={setWeeklyProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className={cn("min-w-[140px]", saved && "bg-success hover:bg-success")}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
