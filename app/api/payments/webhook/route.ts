import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const userId = paymentIntent.metadata.userId
    const type = paymentIntent.metadata.type

    if (!userId) {
      console.error("Missing userId in payment intent metadata:", paymentIntent.id)
      return NextResponse.json({ received: true })
    }

    // Idempotency: ignore already-recorded payments.
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle()

    if (existingPayment) {
      return NextResponse.json({ received: true })
    }

    // Calculate rewards for donations
    let heartsReward = 0
    let xpReward = 0

    if (type === "donation") {
      const donationAmount = paymentIntent.amount / 100

      if (donationAmount >= 50) {
        // Large donation: 10 hearts + 500 XP
        heartsReward = 10
        xpReward = 500
      } else if (donationAmount >= 25) {
        // Medium donation: 5 hearts + 250 XP
        heartsReward = 5
        xpReward = 250
      } else if (donationAmount >= 10) {
        // Small donation: 3 hearts + 100 XP
        heartsReward = 3
        xpReward = 100
      } else {
        // Minimum donation: 1 heart + 50 XP
        heartsReward = 1
        xpReward = 50
      }
    }

    // Record payment in database first
    await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        type: type,
        stripe_payment_intent_id: paymentIntent.id,
        status: "succeeded",
        metadata: type === "donation" ? { heartsReward, xpReward } : null,
      })

    // Update user profile with rewards
    const { data: profile } = await supabase.from("profiles").select("hearts, total_xp").eq("id", userId).single()

    if (profile) {
      let updates: { hearts?: number; total_xp?: number } = {}

      if (type === "hearts") {
        const heartsAmount = parseInt(paymentIntent.metadata.heartsAmount || "1")
        // Add hearts without cap - users can have more than 5 hearts if they purchase
        updates.hearts = (profile.hearts || 0) + heartsAmount
      } else if (type === "donation" && heartsReward > 0) {
        // Add donation rewards
        updates.hearts = (profile.hearts || 0) + heartsReward
        updates.total_xp = (profile.total_xp || 0) + xpReward
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
