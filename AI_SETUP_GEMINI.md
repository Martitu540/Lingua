# Free AI Chat Setup - Google Gemini

## Quick Setup (2 minutes)

### Step 1: Get Your Free Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Add to .env.local

Create or edit `.env.local` in your project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C), then:
pnpm dev
```

That's it! The chat will now use Google Gemini (completely free).

## Features

✅ **100% Free** - No credit card required
✅ **Fast responses** - Gemini 1.5 Flash is optimized for speed
✅ **Good quality** - Great for language learning conversations
✅ **No rate limits** - Generous free tier

## Model Used

- **Gemini 1.5 Flash** - Fast, efficient, perfect for chat applications

## Fallback

If you don't set `GOOGLE_GENERATIVE_AI_API_KEY`, the system will try to use OpenAI (if `OPENAI_API_KEY` is set).

## Troubleshooting

**Error: "No AI API key configured"**
- Make sure you added `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`
- Restart your dev server after adding the key
- Check that the key doesn't have extra spaces

**Chat not responding?**
- Check browser console (F12) for errors
- Check server logs for API errors
- Verify your API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

## Alternative Free Options

If Gemini doesn't work for you, you can also try:

1. **Hugging Face Inference API** - Free tier available
2. **Together AI** - Free tier with open-source models
3. **Replicate** - Pay-as-you-go with free credits

See `AI_CHAT_SETUP.md` for more details.


