# Stripe Webhook Setup for Local Development

## Option 1: Stripe CLI (Recommended for Local Development)

The Stripe CLI allows you to forward webhooks to your local server without needing a public domain.

### Step 1: Install Stripe CLI

**Windows:**
```powershell
# Using Scoop
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download from: https://github.com/stripe/stripe-cli/releases
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Local Server

While your Next.js dev server is running (`pnpm dev`), open a **new terminal** and run:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

This will:
- Create a webhook endpoint in your Stripe dashboard
- Forward all webhook events to your local server
- Display a webhook signing secret (starts with `whsec_`)

### Step 4: Add Webhook Secret to .env.local

Copy the webhook signing secret from the CLI output and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Test Webhook

In another terminal, trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

You should see the event in your Stripe CLI terminal and your Next.js server should receive it.

## Option 2: ngrok (Alternative - Creates Public URL)

If you prefer a public URL that works with Stripe's dashboard:

### Step 1: Install ngrok

Download from: https://ngrok.com/download

### Step 2: Start Your Local Server

```bash
pnpm dev
```

### Step 3: Create ngrok Tunnel

```bash
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Step 4: Configure Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://abc123.ngrok.io/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret to `.env.local`

### Step 5: Update .env.local

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Option 3: Test Mode Webhook (Quick Testing)

For quick testing without CLI, you can manually create webhooks in Stripe Dashboard:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Use ngrok URL (from Option 2) or use Stripe CLI (Option 1)
4. Select events and get the signing secret

## Development Workflow

### Recommended Setup:

1. **Terminal 1:** Run your Next.js dev server
   ```bash
   pnpm dev
   ```

2. **Terminal 2:** Run Stripe CLI webhook forwarding
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

3. **Terminal 3:** (Optional) Trigger test events
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Troubleshooting

### Webhook not receiving events?
- Check that Stripe CLI is running and forwarding
- Verify the webhook secret in `.env.local` matches the CLI output
- Check your Next.js server logs for errors
- Ensure your webhook route is accessible at `/api/payments/webhook`

### "Invalid signature" error?
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI
- Restart your Next.js server after updating `.env.local`

### Testing Payments Locally

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

Any expiry date in the future, any CVC.

## Production Setup

When you deploy to production:

1. Get your production domain (e.g., `https://yourapp.com`)
2. Go to Stripe Dashboard → Webhooks
3. Add endpoint: `https://yourapp.com/api/payments/webhook`
4. Select the same events
5. Copy the production webhook secret
6. Update your production environment variables

