"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, Gift } from "lucide-react"
import { ThankYouPopup } from "@/components/payments/thank-you-popup"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "@/hooks/use-toast"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

if (!stripePublishableKey) {
  console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Payment features will not work.")
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

const quickAmounts = [5, 10, 25, 50, 100]

function DonationCheckoutForm({
  amount,
  onSuccess,
  onClose,
  onPaymentSuccess,
}: {
  amount: number
  onSuccess?: () => void
  onClose?: () => void
  onPaymentSuccess?: (heartsReward: number, xpReward: number) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
    console.log("Submitting donation payment...")

    try {
      // Confirm payment (clientSecret should already be set)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?donation=success`,
        },
        redirect: "if_required",
      })

      console.log("Donation payment result:", { error: error?.message, paymentIntent: paymentIntent?.id, status: paymentIntent?.status })

      if (error) {
        console.error("Donation payment error:", error)
        toast({
          title: "Donation Failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent?.status === "succeeded") {
        console.log("Donation succeeded!")
        
        // Calculate rewards
        let heartsReward = 0
        let xpReward = 0
        
        if (amount >= 50) {
          heartsReward = 10
          xpReward = 500
        } else if (amount >= 25) {
          heartsReward = 5
          xpReward = 250
        } else if (amount >= 10) {
          heartsReward = 3
          xpReward = 100
        } else {
          heartsReward = 1
          xpReward = 50
        }

        // Immediately update profile (don't wait for webhook)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("hearts, total_xp")
            .eq("id", user.id)
            .single()

          if (fetchError) {
            console.error("Error fetching profile:", fetchError)
          }

          if (profile) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                hearts: (profile.hearts || 0) + heartsReward,
                total_xp: (profile.total_xp || 0) + xpReward,
              })
              .eq("id", user.id)

            if (updateError) {
              console.error("Error updating profile:", updateError)
            } else {
              console.log("Profile updated successfully:", {
                hearts: (profile.hearts || 0) + heartsReward,
                xp: (profile.total_xp || 0) + xpReward,
              })
            }
          }
        }

        // Show thank you popup via callback
        onPaymentSuccess?.(heartsReward, xpReward)
        onSuccess?.()
        onClose?.()
      } else {
        console.log("Donation payment status:", paymentIntent?.status)
        toast({
          title: "Payment Processing",
          description: "Your donation is being processed...",
        })
      }
    } catch (error) {
      console.error("Donation submission error:", error)
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
          `Donate $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

export function DonationButton() {
  const [amount, setAmount] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [rewards, setRewards] = useState({ hearts: 0, xp: 0 })
  const supabase = createClient()

  const handleQuickAmount = (value: number) => {
    setAmount(value)
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue)
    }
  }

  const handleProceed = async () => {
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $1",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Creating donation payment intent for:", amount)
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          type: "donation",
        }),
      })

      console.log("Donation payment intent response status:", response.status)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error("Donation payment intent error:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to initialize payment",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      console.log("Donation payment intent data:", { hasClientSecret: !!data.clientSecret, paymentIntentId: data.paymentIntentId })

      if (!data.clientSecret) {
        console.error("No client secret in response:", data)
        toast({
          title: "Error",
          description: "No client secret received from server",
          variant: "destructive",
        })
        return
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error("Error creating donation payment intent:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setClientSecret(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gift className="h-4 w-4" />
          Donate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Support LinguaFlow</DialogTitle>
          <DialogDescription>Your donation helps us improve the platform and add new features</DialogDescription>
        </DialogHeader>

        {!clientSecret ? (
          <div className="space-y-4">
            <div>
              <Label>Quick Amounts</Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleQuickAmount(value)}
                    className={`rounded-lg border-2 p-3 font-semibold transition-all ${
                      amount === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-amount">Custom Amount</Label>
              <div className="mt-2 flex gap-2">
                <span className="flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Show rewards preview */}
            {amount >= 1 && (
              <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">You'll receive:</span>
                </div>
                <div className="space-y-1 text-sm">
                  {amount >= 50 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-hearts text-hearts" />
                        <span>10 Hearts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ 500 XP</span>
                      </div>
                    </>
                  ) : amount >= 25 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-hearts text-hearts" />
                        <span>5 Hearts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ 250 XP</span>
                      </div>
                    </>
                  ) : amount >= 10 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-hearts text-hearts" />
                        <span>3 Hearts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ 100 XP</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-hearts text-hearts" />
                        <span>1 Heart</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ 50 XP</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleProceed} className="w-full" disabled={amount < 1}>
              Continue to Payment
            </Button>
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
              <DonationCheckoutForm
                amount={amount}
                onSuccess={() => handleClose()}
                onClose={handleClose}
                onPaymentSuccess={(hearts, xp) => {
                  setRewards({ hearts, xp })
                  setShowThankYou(true)
                }}
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

        {clientSecret && (
          <Button variant="ghost" onClick={handleClose} className="mt-2 w-full">
            Back
          </Button>
        )}
      </DialogContent>

      <ThankYouPopup
        open={showThankYou}
        onClose={() => {
          setShowThankYou(false)
          window.location.reload()
        }}
        amount={amount}
        heartsReward={rewards.hearts}
        xpReward={rewards.xp}
      />
    </Dialog>
  )
}

