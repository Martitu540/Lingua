# AI Chat Setup Guide

## Overview
The AI chat feature provides a free, interactive language tutor that:
- ✅ Generates daily exercises for XP rewards
- ✅ Adapts to your learning level and progress
- ✅ Provides grammar explanations and vocabulary practice
- ✅ Tracks your mistakes and suggests improvements
- ✅ Supports multiple languages
- ✅ Connects to your course progress

## Features

### 1. **Language Selection**
- Choose any language you want to practice
- The AI adapts its teaching style to your selected language
- Switch languages anytime during the chat

### 2. **Daily Exercises**
- Ask for "daily exercise" to get practice questions
- Earn XP for completing exercises correctly
- Exercises adapt to your current level
- Multiple exercise types: multiple choice, fill-in-the-blank, translation

### 3. **Progress Integration**
- The AI knows your:
  - Current level and XP
  - Completed lessons
  - Common mistakes
  - Recent topics studied
- Uses this information to personalize teaching

### 4. **Progressive Learning**
- Beginner (Levels 1-5): Simple vocabulary, short sentences
- Intermediate (Levels 6-10): Complex sentences, idioms, grammar nuances
- Advanced (Levels 11+): Native-like expressions, cultural context

## AI Model Configuration

### Current Setup
The chat uses OpenAI's GPT-4o-mini model by default (cost-effective option).

### Free Model Options

To use a completely free model, you have several options:

#### Option 1: Hugging Face Inference API (Recommended for Free)
1. Sign up at [Hugging Face](https://huggingface.co/)
2. Get your API key from [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Add to `.env.local`:
```env
HUGGINGFACE_API_KEY=your_api_key_here
AI_MODEL=huggingface/meta-llama/Llama-3.2-3B-Instruct
```

#### Option 2: Google Gemini (Free Tier)
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
AI_MODEL=google/gemini-pro
```

#### Option 3: Anthropic Claude (Limited Free Tier)
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `.env.local`:
```env
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL=anthropic/claude-3-haiku
```

### Updating the API Route

To switch models, update `app/api/ai/chat/route.ts`:

```typescript
// For Hugging Face
import { createHuggingFace } from '@ai-sdk/huggingface'

const huggingface = createHuggingFace({
  apiKey: process.env.HUGGINGFACE_API_KEY,
})

const result = streamText({
  model: huggingface('meta-llama/Llama-3.2-3B-Instruct'),
  // ...
})
```

## Usage Tips

1. **Start with Daily Exercise**: Ask "Give me a daily exercise" to earn XP
2. **Practice Conversations**: Say "Let's have a conversation" for speaking practice
3. **Get Explanations**: Ask "Can you explain [grammar topic]?"
4. **Review Mistakes**: Say "Help me understand my recent mistakes"
5. **Vocabulary Practice**: Ask "Can you help me practice vocabulary?"

## Exercise Types

The AI can generate:
- **Multiple Choice**: Choose the correct answer
- **Fill in the Blank**: Complete the sentence
- **Translation**: Translate between languages
- **Conversation**: Practice dialogue

## XP Rewards

- Each exercise completed correctly: **10 XP**
- XP is automatically added to your profile
- Daily goals are updated automatically
- Level progression happens automatically

## Troubleshooting

### Chat not responding?
- Check your internet connection
- Verify API keys are set correctly
- Check browser console for errors

### Exercises not appearing?
- Make sure to explicitly ask for exercises
- Try: "Give me a daily exercise" or "Create a practice exercise"

### XP not updating?
- Check browser console for errors
- Verify you're logged in
- Check Supabase connection

## Future Enhancements

- Voice conversation practice
- Pronunciation feedback
- Spaced repetition exercises
- Custom exercise difficulty
- Exercise history tracking


