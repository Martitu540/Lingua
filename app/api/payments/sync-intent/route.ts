import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getDonationRewards(amountUsd: number) {
  if (amountUsd >= 50) return { heartsReward: 10, xpReward: 500 }
  if (amountUsd >= 25) return { heartsReward: 5, xpReward: 250 }
  if (amountUsd >= 10) return { heartsReward: 3, xpReward: 100 }
  return { heartsReward: 1, xpReward: 50 }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentIntentId } = (await request.json().catch(() => ({}))) as { paymentIntentId?: string }

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 })
    }

    const paymentIntent = (await stripe.paymentIntents.retrieve(paymentIntentId)) as Stripe.PaymentIntent

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not succeeded", status: paymentIntent.status },
        { status: 409 },
      )
    }

    const metadataUserId = paymentIntent.metadata.userId
    const type = paymentIntent.metadata.type || "hearts"

    if (!metadataUserId || metadataUserId !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to user" }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle()

    if (existingPayment) {
      const { data: profile } = await admin.from("profiles").select("hearts, total_xp").eq("id", user.id).single()
      return NextResponse.json({ ok: true, alreadyProcessed: true, profile })
    }

    let heartsAdded = 0
    let xpAdded = 0

    if (type === "hearts") {
      heartsAdded = parseInt(paymentIntent.metadata.heartsAmount || "1")
    } else if (type === "donation") {
      const { heartsReward, xpReward } = getDonationRewards(paymentIntent.amount / 100)
      heartsAdded = heartsReward
      xpAdded = xpReward
    }

    await admin.from("payments").insert({
      user_id: user.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      type,
      stripe_payment_intent_id: paymentIntent.id,
      status: "succeeded",
      metadata:
        type === "donation"
          ? { heartsReward: heartsAdded, xpReward: xpAdded }
          : type === "hearts"
            ? { heartsAmount: heartsAdded }
            : null,
    })

    if (heartsAdded !== 0 || xpAdded !== 0) {
      const { data: profile } = await admin.from("profiles").select("hearts, total_xp").eq("id", user.id).single()
      const updates: { hearts?: number; total_xp?: number } = {}

      if (profile) {
        if (heartsAdded !== 0) updates.hearts = (profile.hearts || 0) + heartsAdded
        if (xpAdded !== 0) updates.total_xp = (profile.total_xp || 0) + xpAdded
      } else {
        if (heartsAdded !== 0) updates.hearts = heartsAdded
        if (xpAdded !== 0) updates.total_xp = xpAdded
      }

      if (Object.keys(updates).length > 0) {
        await admin.from("profiles").update(updates).eq("id", user.id)
      }
    }

    const { data: updatedProfile } = await admin.from("profiles").select("hearts, total_xp").eq("id", user.id).single()
    return NextResponse.json({ ok: true, credited: { heartsAdded, xpAdded }, profile: updatedProfile })
  } catch (error) {
    console.error("Error syncing payment intent:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to sync payment" }, { status: 500 })
  }
}
