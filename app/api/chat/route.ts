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

// Test route
export async function GET() {
  return NextResponse.json({ 
    message: "AI Chat API is working!", 
    route: "/api/chat",
    geminiConfigured: !!GEMINI_API_KEY,
    openaiConfigured: !!OPENAI_API_KEY
  })
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
    
    // The @ai-sdk/react useChat hook sends body parameters directly in the request body
    // Extract values with proper fallbacks
    const uiMessages = body.messages
    const userId = body.userId || ""
    const userName = body.userName || "Learner"
    const userLevel = body.userLevel || 1
    const targetLanguage = body.targetLanguage || "Spanish"
    const userProgress = body.userProgress
    
    console.log("AI Chat Request:", { 
      targetLanguage, 
      userLevel, 
      userName,
      hasProgress: !!userProgress,
      bodyKeys: Object.keys(body),
      hasMessages: !!uiMessages
    })
    
    if (!uiMessages || !Array.isArray(uiMessages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      )
    }

    // Transform UIMessage format to streamText format
    // UIMessage has { id, role, parts: [{ type: 'text', text: '...' }] }
    // streamText expects { role: 'user' | 'assistant' | 'system', content: '...' }
    const messages = uiMessages
      .filter((msg: any) => msg && typeof msg === "object" && msg.role)
      .map((msg: any) => {
        let content = ""
        
        try {
          // Extract text from parts array
          if (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0) {
            const textParts = msg.parts.filter((p: any) => p && typeof p === "object" && p.type === 'text' && p.text)
            content = textParts.map((p: any) => {
              if (p && p.text && typeof p.text === "string") {
                return String(p.text)
              }
              return ""
            }).join('')
          }
          
          // Fallback to content if parts don't exist (backward compatibility)
          if (!content && msg.content) {
            if (typeof msg.content === "string") {
              content = msg.content
            } else if (typeof msg.content === "object") {
              try {
                content = JSON.stringify(msg.content)
              } catch {
                content = ""
              }
            } else {
              content = String(msg.content || "")
            }
          }
        } catch (error) {
          console.warn("Error processing message:", error)
          content = ""
        }
        
        // Ensure content is always a string
        if (typeof content !== "string") {
          content = ""
        }
        
        return {
          role: msg.role || "user",
          content: content.trim(),
        }
      })
      .filter((msg: any) => msg && msg.content && typeof msg.content === "string" && msg.content.trim().length > 0)

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

    const systemPrompt = `You are an expert, friendly language tutor helping ${userName} learn ${targetLanguage || "a language"}. 
IMPORTANT: The student is learning ${targetLanguage || "a language"}, NOT English. All exercises, conversations, and explanations must be in ${targetLanguage || "the target language"}.

The student is currently at level ${userLevel} (beginner levels 1-5, intermediate 6-10, advanced 11+).

${progressContext}

Your teaching style:
- Be encouraging and patient
- Adapt your language complexity to the student's level
- For beginners (1-5): Use simple vocabulary, short sentences, provide translations frequently
- For intermediate (6-10): Use more complex sentences, introduce idioms, explain grammar nuances
- For advanced (11+): Use native-like expressions, discuss cultural context, challenge the student

Guidelines:
- CRITICAL: All exercises, questions, and practice must be in ${targetLanguage || "the target language"}, NOT English
- TRANSLATION REQUIREMENT: When you speak in ${targetLanguage || "the target language"}, ALWAYS provide English translations in parentheses after each sentence or phrase. Format: "Spanish text (English translation)"
- For vocabulary: Always show both the ${targetLanguage || "target language"} word and its English translation together
- For sentences: Provide translations for every sentence you write in ${targetLanguage || "the target language"}
- Example format: "Hola, ¿cómo estás? (Hello, how are you?)" or "Me llamo Juan (My name is Juan)"
- Correct mistakes gently and explain why
- Use examples and mnemonics to help remember
- Encourage the student to practice by asking follow-up questions
- If asked to have a conversation, respond naturally but keep it at the appropriate difficulty, with translations
- When explaining grammar, use clear examples with translations
- Add pronunciation tips when relevant (using simple phonetic descriptions)
- IMPORTANT: Do NOT include any audio file references, image URLs, or file paths in your responses. Only use text-based content.

EXERCISE GENERATION:
When the user asks for exercises or practice, generate interactive exercises in this JSON format (ONLY include the JSON, no other text):
{
  "type": "exercise",
  "exerciseType": "multiple_choice" | "fill_blank" | "translation" | "conversation",
  "question": "Question text in ${targetLanguage || "target language"}",
  "options": ["option1", "option2", "option3", "option4"], // for multiple choice, all in ${targetLanguage || "target language"}
  "correctAnswer": "correct option",
  "explanation": "Why this is correct (can be in English for explanation)",
  "xpReward": 10,
  "difficulty": ${userLevel}
}

IMPORTANT: When generating exercises:
1. The question and options must be in ${targetLanguage || "the target language"}
2. Only output the JSON object, no markdown code blocks, no extra text
3. Do NOT wrap the JSON in \`\`\`json\`\`\` blocks
4. The JSON should be a single, valid JSON object

For regular responses, just respond naturally. Only use the exercise format when explicitly requested or when you want to give a practice exercise.

Keep responses concise but helpful. Avoid overwhelming the student with too much information at once.`

    // Use Gemini (free) or OpenAI (paid) based on available keys
    // For @ai-sdk/google, use model names without "models/" prefix
    // Available models: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash-latest
    const result = streamText({
      model: useGemini 
        ? google("gemini-2.5-flash") // Free, fast model - newest version
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

