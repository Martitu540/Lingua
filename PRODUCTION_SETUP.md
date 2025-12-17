# Production Setup Guide

## Building for Production

### 1. Build the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Build the production version
pnpm build
```

This will:
- Optimize all code
- Minify JavaScript and CSS
- Generate static pages where possible
- Create optimized bundles
- Output to `.next` folder

### 2. Start Production Server

```bash
# Start the production server
pnpm start
```

The app will run on `http://localhost:3000` (or the port specified in your environment)

### 3. Environment Variables

Make sure all environment variables are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# AI (Google Gemini - Free)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Optional: OpenAI (if you want to use it instead)
# OPENAI_API_KEY=your_openai_key
```

## Performance Optimizations Applied

### 1. React Optimizations
- ✅ `useMemo` for expensive calculations
- ✅ `useCallback` for event handlers
- ✅ Memoized welcome message
- ✅ Optimized exercise extraction

### 2. Next.js Optimizations
- ✅ Server Components where possible
- ✅ Automatic code splitting
- ✅ Image optimization (if using Next.js Image)
- ✅ Static generation for static pages

### 3. Additional Optimizations You Can Add

#### Enable Compression
Add to `next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
}
```

#### Enable SWC Minification (Already enabled by default in Next.js 13+)

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier Available)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### Option 2: Self-Hosted with PM2
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "diplomna-app" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 3: Docker
Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

## Performance Monitoring

### Check Bundle Size
```bash
pnpm build
# Check the output for bundle sizes
```

### Lighthouse Audit
1. Build and start production server
2. Open Chrome DevTools
3. Run Lighthouse audit
4. Aim for:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+

## Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `pnpm lint`

### Runtime Errors
- Check environment variables are set
- Check Supabase connection
- Check Stripe keys (use test keys for development)

## Production Checklist

- [ ] All environment variables set
- [ ] Build completes without errors
- [ ] Production server starts successfully
- [ ] All features tested in production mode
- [ ] Database connections working
- [ ] Stripe webhooks configured (if using)
- [ ] Error logging set up
- [ ] Performance monitoring enabled


