# Stripe Debugging Guide

## Common Issues in Test Mode

### 1. Check Environment Variables

Make sure these are in your `.env.local`:

```env
# Test mode keys (start with pk_test_ and sk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (optional for local dev)
```

### 2. Check Browser Console

Open browser DevTools (F12) and check the Console tab for errors:

**Common errors:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set` → Add the key to `.env.local` and restart dev server
- `Payment service not configured` → Check server logs, STRIPE_SECRET_KEY might be missing
- `No client secret received` → Check network tab, API might be failing
- `Stripe not loaded` → Stripe.js library might not be loading

### 3. Check Network Tab

1. Open DevTools → Network tab
2. Click "Buy Hearts" and select a package
3. Look for `/api/payments/create-intent` request
4. Check:
   - Status code (should be 200)
   - Response body (should have `clientSecret`)
   - Request payload (should have amount, type, metadata)

### 4. Check Server Logs

Look at your terminal where `pnpm dev` is running for:
- `Creating payment intent:` - Shows the request
- `Payment intent created:` - Shows the response
- `Error creating payment intent:` - Shows any errors

### 5. Test Mode Specific

In Stripe test mode:
- Use test cards: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

### 6. Payment Element Not Showing

If the payment form doesn't appear after clicking "Continue":
- Check if `clientSecret` is set (console log should show it)
- Check if Stripe.js loaded (check Network tab for stripe.js)
- Check browser console for Stripe errors

### 7. Debug Steps

1. **Check Stripe keys are loaded:**
   ```javascript
   // In browser console
   console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   ```

2. **Check if payment intent is created:**
   - Look for "Creating payment intent" in server logs
   - Check response in Network tab

3. **Check if Elements is rendering:**
   - Payment form should appear after selecting package
   - If not, check console for errors

4. **Test with Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

## Quick Fix Checklist

- [ ] `.env.local` has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
- [ ] `.env.local` has `STRIPE_SECRET_KEY` (starts with `sk_test_`)
- [ ] Restarted dev server after adding env variables
- [ ] Using test mode keys (not live keys)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API call
- [ ] Payment form appears after selecting package

