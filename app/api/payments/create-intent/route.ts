import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, type, metadata } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    console.log("Creating payment intent:", { amount, type, userId: user.id, metadata })

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        userId: user.id,
        type: type || "hearts",
        ...metadata,
      },
    })

    console.log("Payment intent created:", { id: paymentIntent.id, status: paymentIntent.status, hasClientSecret: !!paymentIntent.client_secret })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment intent"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
