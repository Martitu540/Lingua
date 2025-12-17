"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Globe, ArrowLeft, Check, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Passwords match", met: password === confirmPassword && password.length > 0 },
  ]

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Globe className="h-5 w-5 text-white" />
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
              </div>
            </div>
            <span className="font-bold">LinguaFlow</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Card className="border-2 border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Start your language learning journey today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name (optional)</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                      {passwordRequirements.map((req) => (
                        <div key={req.label} className="flex items-center gap-2 text-sm">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${req.met ? "bg-success text-white" : "bg-muted"}`}
                          >
                            <Check className={`h-3 w-3 ${req.met ? "" : "text-muted-foreground/30"}`} />
                          </div>
                          <span className={req.met ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                  <Button type="submit" className="h-11 w-full shadow-lg shadow-primary/25" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Link href="#" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </p>

                <div className="mt-6 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
