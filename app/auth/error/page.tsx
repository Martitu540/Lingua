import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, AlertCircle, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-center p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">LinguaFlow</span>
        </Link>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="border-2 text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We encountered an error during authentication. This could be due to an expired link or a temporary
                issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/login" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/">Go to homepage</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
