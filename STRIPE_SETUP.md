# Stripe Payment Integration Setup

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard

## Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Database Setup

Run the payments table migration:

```sql
-- See scripts/004-create-payments-table.sql
```

Or run it directly in your Supabase SQL editor.

## Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## Apple Pay

Apple Pay works automatically on:
- Safari (macOS/iOS)
- Devices with Touch ID/Face ID
- Requires HTTPS in production

## Production Checklist

- [ ] Switch to live API keys
- [ ] Update webhook URL to production domain
- [ ] Test all payment flows
- [ ] Set up email receipts in Stripe Dashboard
- [ ] Configure tax settings if needed
- [ ] Set up refund policies

