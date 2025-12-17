"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "@/hooks/use-toast"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

if (!stripePublishableKey) {
  console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Payment features will not work.")
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface HeartsPurchaseProps {
  currentHearts: number
  onSuccess?: () => void
  trigger?: ReactNode
}

const heartsPackages = [
  { hearts: 1, price: 0.99, popular: false },
  { hearts: 5, price: 3.99, popular: true },
  { hearts: 10, price: 6.99, popular: false },
]

function CheckoutForm({
  hearts,
  price,
  onSuccess,
  onClose,
}: {
  hearts: number
  price: number
  onSuccess?: () => void
  onClose?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      console.error("Stripe not loaded:", { stripe: !!stripe, elements: !!elements })
      toast({
        title: "Payment Not Ready",
        description: "Please wait for payment system to load",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    console.log("Submitting payment...")

    try {
      // Confirm payment (clientSecret should already be set)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: "if_required",
      })

      console.log("Payment confirmation result:", { error: error?.message, paymentIntent: paymentIntent?.id, status: paymentIntent?.status })

      if (error) {
        console.error("Payment error:", error)
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent?.status === "succeeded") {
        console.log("Payment succeeded!")

        // Webhooks can be delayed/misconfigured; sync on-demand to ensure hearts credit immediately.
        try {
          const syncRes = await fetch("/api/payments/sync-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          })

          if (!syncRes.ok) {
            const syncErr = await syncRes.json().catch(() => ({}))
            console.warn("Payment sync failed:", syncErr)
          }
        } catch (syncError) {
          console.warn("Payment sync request failed:", syncError)
        }

        toast({
          title: "Success!",
          description: `You purchased ${hearts} heart${hearts > 1 ? "s" : ""}!`,
        })
        onSuccess?.()
        onClose?.()
        // Refresh after a short delay to show the success message
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.log("Payment status:", paymentIntent?.status)
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed...",
        })
      }
    } catch (error) {
      console.error("Payment submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${price.toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

export function HeartsPurchase({ currentHearts, onSuccess, trigger }: HeartsPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<typeof heartsPackages[0] | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectPackage = async (pkg: typeof heartsPackages[0]) => {
    setSelectedPackage(pkg)
    try {
      console.log("Creating payment intent for:", pkg)
      
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pkg.price,
          type: "hearts",
          metadata: { heartsAmount: pkg.hearts.toString() },
        }),
      })

      console.log("Payment intent response status:", response.status)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error("Payment intent error:", errorData)
        throw new Error(errorData.error || "Failed to create payment intent")
      }

      const data = await response.json()
      console.log("Payment intent data:", { hasClientSecret: !!data.clientSecret, paymentIntentId: data.paymentIntentId })
      
      if (!data.clientSecret) {
        console.error("No client secret in response:", data)
        throw new Error("No client secret received from server")
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error("Error selecting package:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
      setSelectedPackage(null)
      setClientSecret(null)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedPackage(null)
    setClientSecret(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full gap-2">
            <Heart className="h-4 w-4 fill-hearts text-hearts" />
            Buy Hearts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Hearts</DialogTitle>
          <DialogDescription>Buy hearts to continue learning without waiting</DialogDescription>
        </DialogHeader>

        {!selectedPackage ? (
          <div className="space-y-3">
            {heartsPackages.map((pkg) => (
              <button
                key={pkg.hearts}
                type="button"
                onClick={() => handleSelectPackage(pkg)}
                className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hearts/10">
                      <Heart className="h-6 w-6 fill-hearts text-hearts" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{pkg.hearts} Heart{pkg.hearts > 1 ? "s" : ""}</span>
                        {pkg.popular && (
                          <Badge variant="outline" className="border-primary text-primary">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${(pkg.price / pkg.hearts).toFixed(2)} per heart
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold">${pkg.price.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : clientSecret ? (
          stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <CheckoutForm
                hearts={selectedPackage.hearts}
                price={selectedPackage.price}
                onSuccess={onSuccess}
                onClose={handleClose}
              />
            </Elements>
          ) : (
            <div className="p-4 text-center text-destructive">
              <p>Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {selectedPackage && (
          <Button variant="ghost" onClick={handleClose} className="mt-2 w-full">
            Back
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
