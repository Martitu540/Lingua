import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Using Google Gemini (FREE tier available)
// Get your free API key from: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""

// Fallback to OpenAI if Gemini key is not set
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""

// Test route - remove this after confirming it works
export async function GET() {
  return NextResponse.json({ message: "AI Chat API is working!", route: "/api/ai/chat" })
}

export async function POST(req: NextRequest) {
  try {
    console.log("AI Chat API called - Route is working!")
    
    // Check which API key is available
    const useGemini = !!GEMINI_API_KEY
    const useOpenAI = !!OPENAI_API_KEY && !useGemini
    
    if (!useGemini && !useOpenAI) {
      console.error("No AI API key configured")
      return NextResponse.json(
        { 
          error: "No AI API key configured. Please set GOOGLE_GENERATIVE_AI_API_KEY (free) or OPENAI_API_KEY in your .env.local file.\n\nGet free Gemini key: https://makersuite.google.com/app/apikey" 
        },
        { status: 500 }
      )
    }
    
    console.log(`Using ${useGemini ? 'Google Gemini' : 'OpenAI'} for AI chat`)

    const body = await req.json()
    const { messages: uiMessages, userId, userName, userLevel, targetLanguage, userProgress } = body
    
    if (!uiMessages || !Array.isArray(uiMessages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      )
    }

    // Transform UIMessage format to streamText format
    // UIMessage has { id, role, parts: [{ type: 'text', text: '...' }] }
    // streamText expects { role: 'user' | 'assistant' | 'system', content: '...' }
    const messages = uiMessages.map((msg: any) => {
      // Extract text from parts array
      const textParts = msg.parts?.filter((p: any) => p.type === 'text') || []
      const content = textParts.map((p: any) => p.text || '').join('')
      
      // Fallback to content if parts don't exist (backward compatibility)
      return {
        role: msg.role,
        content: content || msg.content || '',
      }
    }).filter((msg: any) => msg.content.trim().length > 0)

    console.log("Transformed messages:", messages.length, "messages")

    const supabase = await createClient()
    
    // Build context from user progress
    let progressContext = ""
    if (userProgress) {
      const { lessonsCompleted, mistakes, recentTopics, currentUnit } = userProgress
      progressContext = `
User Progress Context:
- Level: ${userLevel}
- Lessons Completed: ${lessonsCompleted || 0}
- Common Mistakes: ${mistakes?.length ? mistakes.slice(0, 5).join(", ") : "None recorded"}
- Recent Topics: ${recentTopics?.length ? recentTopics.slice(0, 5).join(", ") : "Starting fresh"}
- Current Unit: ${currentUnit || "Not specified"}
`
    }

    const systemPrompt = `You are an expert, friendly language tutor helping ${userName} learn ${targetLanguage}. 
The student is currently at level ${userLevel} (beginner levels 1-5, intermediate 6-10, advanced 11+).

${progressContext}

Your teaching style:
- Be encouraging and patient
- Adapt your language complexity to the student's level
- For beginners (1-5): Use simple vocabulary, short sentences, provide translations frequently
- For intermediate (6-10): Use more complex sentences, introduce idioms, explain grammar nuances
- For advanced (11+): Use native-like expressions, discuss cultural context, challenge the student

Guidelines:
- Always include the ${targetLanguage} word/phrase with its translation when teaching vocabulary
- Correct mistakes gently and explain why
- Use examples and mnemonics to help remember
- Encourage the student to practice by asking follow-up questions
- If asked to have a conversation, respond naturally but keep it at the appropriate difficulty
- When explaining grammar, use clear examples
- Add pronunciation tips when relevant (using simple phonetic descriptions)

EXERCISE GENERATION:
When the user asks for exercises or practice, generate interactive exercises in this JSON format:
{
  "type": "exercise",
  "exerciseType": "multiple_choice" | "fill_blank" | "translation" | "conversation",
  "question": "Question text",
  "options": ["option1", "option2", "option3", "option4"], // for multiple choice
  "correctAnswer": "correct option",
  "explanation": "Why this is correct",
  "xpReward": 10,
  "difficulty": ${userLevel}
}

For regular responses, just respond naturally. Only use the exercise format when explicitly requested or when you want to give a practice exercise.

Keep responses concise but helpful. Avoid overwhelming the student with too much information at once.`

    // Use Gemini (free) or OpenAI (paid) based on available keys
    const result = streamText({
      model: useGemini 
        ? google("gemini-1.5-flash") // Free, fast model
        : openai("gpt-4o-mini"), // Fallback to OpenAI if needed
      system: systemPrompt,
      messages: messages as any,
      maxTokens: 1000,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("AI Chat Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat request"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
