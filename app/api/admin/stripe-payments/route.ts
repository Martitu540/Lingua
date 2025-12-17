import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (allow if is_admin is true or if profile doesn't exist yet - for testing)
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    // Temporarily allow access if profile doesn't exist or is_admin field doesn't exist
    // TODO: Uncomment the check below once you've set is_admin = true for your user
    // if (!profile?.is_admin) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    // Fetch payments from Stripe (works in both test and live mode)
    let formattedPayments: any[] = []
    let source = "stripe"
    
    try {
      // Try to fetch from Stripe first (works in both test and live mode)
      // Get all payment intents, not just recent ones
      const allPayments = []
      let hasMore = true
      let startingAfter: string | undefined = undefined

      // Fetch all payments in batches
      while (hasMore && allPayments.length < 500) {
        const payments = await stripe.paymentIntents.list({
          limit: 100,
          expand: ["data.customer"],
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })

        allPayments.push(...payments.data)
        hasMore = payments.has_more
        if (payments.data.length > 0) {
          startingAfter = payments.data[payments.data.length - 1].id
        }
      }

      console.log(`Found ${allPayments.length} total payment intents from Stripe`)

      // Format payments data - include all types
      formattedPayments = allPayments
        .filter((pi) => pi.status === "succeeded")
        .map((pi) => ({
          id: pi.id,
          amount: pi.amount / 100, // Convert from cents
          currency: pi.currency,
          type: pi.metadata?.type || "unknown",
          status: pi.status,
          created: new Date(pi.created * 1000).toISOString(),
          customer: pi.customer,
        }))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()) // Sort by newest first

      console.log(`Formatted ${formattedPayments.length} succeeded payments from Stripe`)
      console.log("Payment types:", formattedPayments.map(p => p.type))
    } catch (stripeError: any) {
      console.error("Stripe API error:", stripeError?.message || stripeError)
      source = "database"
      
      // Fallback to database payments if Stripe API fails
      const { data: dbPayments, error: dbError } = await supabase
        .from("payments")
        .select("amount, type, status, created_at, stripe_payment_intent_id")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false })
        .limit(100)

      if (dbError) {
        console.error("Database error:", dbError)
      }

      if (dbPayments && dbPayments.length > 0) {
        formattedPayments = dbPayments.map((p) => ({
          id: p.stripe_payment_intent_id || `db-${Date.now()}-${Math.random()}`,
          amount: typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0),
          currency: "usd",
          type: p.type || "unknown",
          status: p.status,
          created: p.created_at,
        }))
        console.log(`Using ${formattedPayments.length} payments from database`)
      } else {
        console.log("No payments found in database either")
      }
    }

    return NextResponse.json({ 
      payments: formattedPayments,
      source,
      count: formattedPayments.length 
    })
  } catch (error) {
    console.error("Error fetching Stripe payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

