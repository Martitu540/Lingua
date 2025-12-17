import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Mail, ArrowRight } from "lucide-react"

export default function SignUpSuccessPage() {
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription className="text-base">
                We&apos;ve sent you a confirmation link. Please check your inbox and click the link to activate your
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p>Didn&apos;t receive the email? Check your spam folder or wait a few minutes.</p>
              </div>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/auth/login" className="gap-2">
                  Go to login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
