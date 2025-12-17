"use client"

import type React from "react"
import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  BookOpen,
  MessageSquare,
  Lightbulb,
  RotateCcw,
  Languages,
  Trophy,
  Zap,
  Target,
  XCircle,
} from "lucide-react"
import type { Course, Language } from "@/types/database"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { AIExerciseCard } from "./ai-exercise-card"
import { AchievementNotification } from "@/components/achievements/achievement-notification"
import type { Achievement } from "@/types/database"

interface CourseWithLanguages extends Course {
  source_language: Language
  target_language: Language
}

interface UserProgress {
  lessonsCompleted: number
  mistakes: string[]
  recentTopics: string[]
  currentUnit: string | null
  totalXP: number
}

interface ChatInterfaceProps {
  userId: string
  userName: string
  userLevel: number
  activeCourse?: CourseWithLanguages
  languages?: Language[]
  userProgress?: UserProgress
}

const suggestedPrompts = [
  {
    icon: BookOpen,
    title: "Daily Exercise",
    prompt: "Give me a daily exercise to practice!",
    color: "border-border/50 bg-card hover:bg-accent/50 text-foreground",
    xp: "+10 XP",
  },
  {
    icon: MessageSquare,
    title: "Have a conversation",
    prompt: "Let's have a simple conversation to practice.",
    color: "border-border/50 bg-card hover:bg-accent/50 text-foreground",
  },
  {
    icon: Lightbulb,
    title: "Explain grammar",
    prompt: "Can you explain a grammar concept to me?",
    color: "border-border/50 bg-card hover:bg-accent/50 text-foreground",
  },
  {
    icon: RotateCcw,
    title: "Review mistakes",
    prompt: "Help me understand my recent mistakes.",
    color: "border-border/50 bg-card hover:bg-accent/50 text-foreground",
  },
  {
    icon: Target,
    title: "Practice vocabulary",
    prompt: "Can you help me practice some vocabulary words?",
    color: "border-border/50 bg-card hover:bg-accent/50 text-foreground",
  },
]

export function ChatInterface({
  userId,
  userName,
  userLevel,
  activeCourse,
  languages = [],
  userProgress,
}: ChatInterfaceProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Auto-select language from active course, don't show selector if course exists
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    activeCourse?.target_language?.name || languages?.[0]?.name || "Spanish"
  )
  const [exercises, setExercises] = useState<any[]>([])
  const [dailyExerciseCompleted, setDailyExerciseCompleted] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [hasCheckedAIAchievement, setHasCheckedAIAchievement] = useState(false)
  const [currentXP, setCurrentXP] = useState(userProgress?.totalXP || 0)
  const [currentLevel, setCurrentLevel] = useState(userLevel || 1)

  const targetLanguage = selectedLanguage

  // Build detailed welcome message with progress (memoized)
  const welcomeMessage = useMemo(() => {
    return `Hello ${userName}! 👋 I'm your AI language tutor. I'm here to help you learn ${targetLanguage}. 

You're currently at **Level ${userLevel}** (${userProgress?.totalXP || 0} XP), and I'll adapt my teaching to match your skills. 

${userProgress ? `📊 Your Progress:
- **${userProgress.lessonsCompleted} lessons** completed
- **${userProgress.totalXP} XP** earned
- Current unit: **${userProgress.currentUnit || "Starting fresh"}**
${userProgress.mistakes && userProgress.mistakes.length > 0 ? `- Recent mistakes to review: ${userProgress.mistakes.slice(0, 3).join(", ")}` : ""}
${userProgress.recentTopics && userProgress.recentTopics.length > 0 ? `- Recent topics: ${userProgress.recentTopics.slice(0, 3).join(", ")}` : ""}` : ""}

What would you like to practice today? You can ask for daily exercises, have conversations, or get explanations!`
  }, [userName, targetLanguage, userLevel, userProgress])

  const [localInput, setLocalInput] = useState("")
  
  // Ensure all values are valid strings/numbers before passing to useChat
  const safeUserName = typeof userName === "string" ? userName : "Learner"
  const safeTargetLanguage = typeof targetLanguage === "string" ? targetLanguage : "Spanish"
  const safeUserLevel = typeof userLevel === "number" ? userLevel : 1
  const safeWelcomeMessage = typeof welcomeMessage === "string" ? welcomeMessage : "Hello! I'm your AI language tutor."
  
  const { messages, sendMessage, isLoading, setMessages, error } = useChat({
    api: "/api/chat",
    body: {
      userId: typeof userId === "string" ? userId : "",
      userName: safeUserName,
      userLevel: safeUserLevel,
      targetLanguage: safeTargetLanguage,
      userProgress: userProgress || {
        lessonsCompleted: 0,
        mistakes: [],
        recentTopics: [],
        currentUnit: null,
        totalXP: 0,
      },
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant" as const,
        content: safeWelcomeMessage,
      },
    ],
    onFinish: async (message) => {
      // Safely handle message - ensure it exists and has valid structure
      if (!message || typeof message !== "object") {
        return
      }
      
      // Check if message contains exercise JSON
      try {
        // Handle both string content and parts array
        let messageContent = ""
        
        // Try different ways to get the content with null checks
        if (message && typeof message.content === "string" && message.content.length > 0) {
          messageContent = message.content
        } else if (message && message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
          const textParts = message.parts.filter((p: any) => p && p.type === "text" && p.text)
          messageContent = textParts.map((p: any) => (p && typeof p.text === "string") ? p.text : "").join("")
        } else if (message && message.text && typeof message.text === "string") {
          messageContent = message.text
        } else if (message && message.content && typeof message.content === "object") {
          // Try to extract from object
          try {
            messageContent = JSON.stringify(message.content)
          } catch {
            messageContent = ""
          }
        }
        
        // Also check the messages array for the latest message
        if ((!messageContent || messageContent.length === 0) && messages && Array.isArray(messages) && messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          if (lastMessage && typeof lastMessage.content === "string" && lastMessage.content.length > 0) {
            messageContent = lastMessage.content
          } else if (lastMessage && lastMessage.parts && Array.isArray(lastMessage.parts) && lastMessage.parts.length > 0) {
            const textParts = lastMessage.parts.filter((p: any) => p && p.type === "text" && p.text)
            messageContent = textParts.map((p: any) => (p && typeof p.text === "string") ? p.text : "").join("")
          }
        }

        // Ensure messageContent is a valid non-empty string
        if (!messageContent || typeof messageContent !== "string" || messageContent.trim().length === 0) {
          return
        }
        
        // Wait longer to ensure message is fully rendered and streamed completely
        // AI responses can take time to fully stream, especially for exercises
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Try multiple patterns to find JSON exercise
        // Pattern 1: Plain JSON object
        let jsonRegex = /\{[\s\S]*?"type"\s*:\s*"exercise"[\s\S]*?\}/g
        let matches = messageContent.match(jsonRegex)
        
        // Pattern 2: JSON in markdown code blocks
        if (!matches || matches.length === 0) {
          const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"type"\s*:\s*"exercise"[\s\S]*?\})\s*```/g
          const codeMatches = messageContent.match(codeBlockRegex)
          if (codeMatches) {
            matches = codeMatches.map(m => {
              const extracted = m.replace(/```(?:json)?\s*/, "").replace(/\s*```/, "")
              return extracted
            })
          }
        }

        // Pattern 3: Look for any JSON object with "exerciseType" field
        if (!matches || matches.length === 0) {
          jsonRegex = /\{[\s\S]*?"exerciseType"[\s\S]*?\}/g
          matches = messageContent.match(jsonRegex)
        }
        
        if (matches && matches.length > 0) {
          console.log(`🎯 Found ${matches.length} potential exercise(s) in message`)
          
          matches.forEach((match, index) => {
            try {
              // Clean the match
              let cleanedMatch = match.trim()
              // Remove markdown code block markers if present
              cleanedMatch = cleanedMatch.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
              
              console.log(`📝 Parsing exercise ${index + 1}:`, cleanedMatch.substring(0, 100))
              
              const exercise = JSON.parse(cleanedMatch)
              if (exercise.type === "exercise" || exercise.exerciseType) {
                // Create a stable, unique ID
                const exerciseId = `exercise-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
                
                const exerciseData = {
                  ...exercise,
                  type: "exercise", // Ensure type is set
                  id: exerciseId,
                  xpReward: exercise.xpReward || 10, // Ensure XP reward is set
                }
                
                console.log("✅ Extracted exercise:", {
                  id: exerciseData.id,
                  question: exerciseData.question?.substring(0, 50),
                  type: exerciseData.exerciseType,
                  xpReward: exerciseData.xpReward
                })
                
                // Use functional update with a small delay to ensure message processing is complete
                setTimeout(() => {
                  setExercises((prev) => {
                    // Check if exercise with same question already exists
                    const exists = prev.some(ex => 
                      ex.question === exerciseData.question && 
                      ex.exerciseType === exerciseData.exerciseType
                    )
                    if (exists) {
                      console.log("⚠️ Exercise already exists, skipping")
                      return prev
                    }
                    // Add to state
                    const newExercises = [...prev, exerciseData]
                    console.log("🎉 Adding exercise! Total exercises now:", newExercises.length)
                    return newExercises
                  })
                }, 200) // Small delay to ensure message is fully processed
              } else {
                console.log("❌ Exercise missing type or exerciseType:", exercise)
              }
            } catch (parseError) {
              console.error("❌ Error parsing exercise JSON:", parseError, "Match:", match.substring(0, 100))
            }
          })
        } else {
          console.log("ℹ️ No exercise JSON found in message")
        }
      } catch (e) {
        console.error("Error extracting exercise:", e)
      }
    },
    onError: (error) => {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please check your OpenAI API key.",
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    // Scroll to bottom when messages or exercises change
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight
    }
  }, [messages, exercises])

  // Extract exercises from messages whenever messages change (more reliable than onFinish)
  useEffect(() => {
    if (!messages || messages.length === 0) return

    // Get the last assistant message
    const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === "assistant")
    if (!lastAssistantMessage) return

    // Extract content from message
    let messageContent = ""
    if (typeof lastAssistantMessage.content === "string") {
      messageContent = lastAssistantMessage.content
    } else if (lastAssistantMessage.parts && Array.isArray(lastAssistantMessage.parts)) {
      const textParts = lastAssistantMessage.parts.filter((p: any) => p && p.type === "text" && p.text)
      messageContent = textParts.map((p: any) => (p && typeof p.text === "string") ? p.text : "").join("")
    }

    if (!messageContent || messageContent.trim().length === 0) return

    // Wait a bit to ensure message is complete
    const timeoutId = setTimeout(() => {
      // Try to find exercise JSON in the message
      let jsonRegex = /\{[\s\S]*?"type"\s*:\s*"exercise"[\s\S]*?\}/g
      let matches = messageContent.match(jsonRegex)
      
      if (!matches || matches.length === 0) {
        jsonRegex = /\{[\s\S]*?"exerciseType"[\s\S]*?\}/g
        matches = messageContent.match(jsonRegex)
      }

      if (matches && matches.length > 0) {
        matches.forEach((match, index) => {
          try {
            let cleanedMatch = match.trim()
            cleanedMatch = cleanedMatch.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
            
            const exercise = JSON.parse(cleanedMatch)
            if (exercise.type === "exercise" || exercise.exerciseType) {
              const exerciseId = `exercise-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
              
              const exerciseData = {
                ...exercise,
                type: "exercise",
                id: exerciseId,
                xpReward: exercise.xpReward || 10,
              }
              
              setExercises((prev) => {
                const exists = prev.some(ex => 
                  ex.id === exerciseId || 
                  (ex.question === exerciseData.question && ex.exerciseType === exerciseData.exerciseType)
                )
                if (exists) {
                  return prev
                }
                console.log("🎉 Adding exercise from useEffect! ID:", exerciseId)
                return [...prev, exerciseData]
              })
            }
          } catch (parseError) {
            // Invalid JSON, skip
          }
        })
      }
    }, 2000) // Wait 2 seconds after message appears

    return () => clearTimeout(timeoutId)
  }, [messages])


  const handleSuggestedPrompt = useCallback((prompt: string) => {
    // Ensure prompt is a valid string
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return
      }
    // Directly send the message using sendMessage
    sendMessage({ content: prompt.trim() })
  }, [sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = document.getElementById("chat-form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }
  }

  const handleExerciseComplete = useCallback(async (exerciseId: string, isCorrect: boolean, xpReward: number) => {
    // Award XP and track progress
    if (isCorrect && xpReward > 0) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp, current_level")
          .eq("id", userId)
          .single()

        if (profile) {
          const oldXP = profile.total_xp || 0
          const oldLevel = profile.current_level || 1
          const newXP = oldXP + xpReward
          const newLevel = Math.floor(newXP / 100) + 1

          // Update local state immediately for instant feedback
          setCurrentXP(newXP)
          setCurrentLevel(newLevel > oldLevel ? newLevel : oldLevel)

          // Update profile with XP and level
          await supabase
            .from("profiles")
            .update({
              total_xp: newXP,
              current_level: newLevel > oldLevel ? newLevel : oldLevel,
              last_active_at: new Date().toISOString(),
            })
            .eq("id", userId)

          // Update daily goal
          const today = new Date().toISOString().split("T")[0]
          const { data: dailyGoal } = await supabase
            .from("daily_goals")
            .select("*")
            .eq("user_id", userId)
            .eq("date", today)
            .single()

          if (dailyGoal) {
            await supabase
              .from("daily_goals")
              .update({
                xp_earned: (dailyGoal.xp_earned || 0) + xpReward,
                is_completed: (dailyGoal.xp_earned || 0) + xpReward >= (dailyGoal.xp_goal || 0),
              })
              .eq("id", dailyGoal.id)
          } else {
            await supabase.from("daily_goals").insert({
              user_id: userId,
              date: today,
              xp_earned: xpReward,
              lessons_completed: 0,
              xp_goal: 50, // Default daily goal
              lessons_goal: 1,
              is_completed: false,
            })
          }

          // Track exercise completion in history
          await supabase.from("user_exercise_history").insert({
            user_id: userId,
            exercise_id: `ai-exercise-${exerciseId}`,
            is_correct: true,
            user_answer: { answer: "completed" },
            attempted_at: new Date().toISOString(),
          })

          // Dispatch event to update header
          window.dispatchEvent(new CustomEvent("profile-updated"))

          // Show success toast with level up notification if applicable
          if (newLevel > oldLevel) {
            toast({
              title: "Level Up! 🚀",
              description: `Congratulations! You reached Level ${newLevel}! You earned ${xpReward} XP. Total: ${newXP} XP`,
              duration: 5000,
            })
          } else {
            toast({
              title: "Great job! 🎉",
              description: `You earned ${xpReward} XP! Total: ${newXP} XP (${newXP % 100}/100 to next level)`,
              duration: 4000,
            })
          }

          // Mark daily exercise as completed
          if (exerciseId.includes("daily") || exerciseId.includes("Daily")) {
            setDailyExerciseCompleted(true)
          }
        }
      } catch (error) {
        console.error("Error awarding XP:", error)
        toast({
          title: "Error",
          description: "Failed to update progress. Please try again.",
          variant: "destructive",
        })
      }
    } else if (!isCorrect) {
      // Track incorrect answer
      try {
        await supabase.from("user_exercise_history").insert({
          user_id: userId,
          exercise_id: `ai-exercise-${exerciseId}`,
          is_correct: false,
          user_answer: { answer: "incorrect" },
          attempted_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error tracking mistake:", error)
      }
    }

    // Keep exercise visible longer - don't remove immediately
    // Let user see the result and explanation
    // Only remove after user has had time to read everything
    if (isCorrect) {
      // For correct answers, keep visible longer to celebrate
      setTimeout(() => {
        setExercises((prev) => {
          console.log("Removing exercise:", exerciseId, "Remaining:", prev.filter((ex) => ex.id !== exerciseId).length)
          return prev.filter((ex) => ex.id !== exerciseId)
        })
      }, 10000) // 10 seconds for correct answers - let them celebrate!
    } else {
      // For incorrect, keep visible to read explanation
      setTimeout(() => {
        setExercises((prev) => {
          console.log("Removing exercise:", exerciseId, "Remaining:", prev.filter((ex) => ex.id !== exerciseId).length)
          return prev.filter((ex) => ex.id !== exerciseId)
        })
      }, 8000) // 8 seconds for incorrect answers
    }
  }, [userId, supabase])

  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLanguage(lang)
    // Reset chat when language changes with updated progress
    const updatedWelcomeMessage = `Hello ${userName}! 👋 I'm your AI language tutor. I'm here to help you learn ${lang}. 

You're currently at **Level ${userLevel}** (${userProgress?.totalXP || 0} XP), and I'll adapt my teaching to match your skills. 

${userProgress ? `📊 Your Progress:
- **${userProgress.lessonsCompleted} lessons** completed
- **${userProgress.totalXP} XP** earned
- Current unit: **${userProgress.currentUnit || "Starting fresh"}**` : ""}

What would you like to practice today?`
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: updatedWelcomeMessage,
      },
    ])
  }, [userName, userLevel, userProgress, setMessages])

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedInput = typeof localInput === "string" ? localInput.trim() : ""
    if (trimmedInput.length > 0 && !isLoading) {
      sendMessage({ content: trimmedInput })
      setLocalInput("")
      
      // Check for AI chat achievement on first message
      if (!hasCheckedAIAchievement) {
        setHasCheckedAIAchievement(true)
        try {
          const response = await fetch("/api/achievements/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hasAIChat: true,
            }),
          })

          if (response.ok) {
            const { unlocked } = await response.json()
            if (unlocked && unlocked.length > 0) {
              setUnlockedAchievement(unlocked[0])
            }
          }
        } catch (error) {
          console.error("Error checking achievements:", error)
        }
      }
    }
  }, [localInput, isLoading, sendMessage, hasCheckedAIAchievement])

  const canSend = useMemo(() => localInput.trim().length > 0 && !isLoading, [localInput, isLoading])

  return (
    <div className="flex h-full gap-4">
      {/* Main Chat */}
      <Card className="flex flex-1 flex-col overflow-hidden border-border/50">
        {/* Header */}
        <CardHeader className="shrink-0 border-b py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">AI Language Tutor</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {!activeCourse && languages.length > 0 && (
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <Languages className="h-3 w-3 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.name}>
                            {lang.flag_emoji} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {activeCourse && (
                    <Badge variant="secondary" className="gap-1">
                      <Languages className="h-3 w-3" />
                      {activeCourse.target_language?.flag_emoji} {activeCourse.target_language?.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    Level {currentLevel}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {currentXP} XP
                  </Badge>
                  <div className="h-6 w-1 bg-primary/20 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-accent transition-all duration-500"
                      style={{ height: `${(currentXP % 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content: welcomeMessage,
                  },
                ])
                setExercises([])
                setDailyExerciseCompleted(false)
                setLocalInput("")
              }}
              className="gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </CardHeader>

        {/* Messages area */}
        <div ref={scrollViewportRef} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages && Array.isArray(messages) && messages
              .filter((message) => message && typeof message === "object" && message.id)
              .map((message) => {
              
              // Handle both content string and parts array formats
              let messageText = ""
              try {
                if (message.content && typeof message.content === "string") {
                  messageText = message.content || ""
                } else if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
                  // Extract text from parts array
                  const textParts = message.parts.filter((p: any) => p && typeof p === "object" && p.type === "text" && p.text)
                  messageText = textParts.map((p: any) => {
                    if (p && p.text && typeof p.text === "string") {
                      return String(p.text)
                    }
                    return ""
                  }).join("")
                } else if (message.content) {
                  // Fallback: try to stringify if it's an object
                  try {
                    messageText = typeof message.content === "object" ? JSON.stringify(message.content) : String(message.content || "")
                  } catch {
                    messageText = ""
                  }
                }
              } catch (error) {
                messageText = ""
              }

              // Ensure messageText is always a valid string
              if (typeof messageText !== "string") {
                messageText = ""
              }

              // Remove exercise JSON from display (remove all JSON blocks that contain "type": "exercise")
              let displayText = messageText || ""
              // Remove JSON exercise blocks
              displayText = displayText.replace(/\{[\s\S]*?"type"\s*:\s*"exercise"[\s\S]*?\}/g, "")
              // Remove markdown code blocks that might contain JSON
              displayText = displayText.replace(/```json[\s\S]*?```/g, "")
              displayText = displayText.replace(/```[\s\S]*?```/g, "")
              // Remove audio/image/media references that might cause 404s
              displayText = displayText.replace(/!\[.*?\]\([^)]+\)/g, "") // Remove markdown images
              displayText = displayText.replace(/<audio[^>]*>.*?<\/audio>/gi, "") // Remove HTML audio tags
              displayText = displayText.replace(/<img[^>]*>/gi, "") // Remove HTML img tags
              displayText = displayText.replace(/\[audio:.*?\]/gi, "") // Remove custom audio references
              displayText = displayText.replace(/\/audio\/[^\s\)]+/gi, "") // Remove audio file paths
              // Clean up extra whitespace
              displayText = displayText.trim()

              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      message.role === "user" ? "bg-gradient-to-br from-primary to-accent shadow-lg" : "bg-secondary",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary prose prose-sm max-w-none",
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm [&_strong]:font-semibold [&_*]:text-inherit">
                      {displayText}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Exercise Cards - Always render if exercises exist */}
            {exercises.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                {exercises.map((exercise) => {
                  if (!exercise || !exercise.id) {
                    console.warn("⚠️ Exercise missing ID or data:", exercise)
                    return null
                  }
                  console.log("✅ Rendering exercise card:", exercise.id, "Question:", exercise.question?.substring(0, 40))
                  return (
                    <div key={exercise.id} className="animate-slide-up">
                      <AIExerciseCard
                        exercise={exercise}
                        onComplete={(isCorrect) => {
                          console.log("🎯 Exercise completion callback:", exercise.id, "Correct:", isCorrect)
                          handleExerciseComplete(exercise.id, isCorrect, exercise.xpReward || 10)
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && exercises.length > 0 && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                Debug: {exercises.length} exercise(s) in state
              </div>
            )}

            {error && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-sm text-red-800">
                    {error.message || "Failed to send message. Please check your OpenAI API key in .env.local"}
                  </span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Suggested topics:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt.prompt)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-sm",
                      prompt.color,
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <prompt.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{prompt.title}</span>
                    </div>
                    {prompt.xp && (
                      <Badge variant="outline" className="text-xs">
                        {prompt.xp}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <CardContent className="shrink-0 border-t p-4">
          <form id="chat-form" onSubmit={handleFormSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask me anything about ${targetLanguage}...`}
              className="min-h-[52px] max-h-32 resize-none rounded-xl"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[52px] w-[52px] shrink-0 rounded-xl shadow-lg shadow-primary/25"
              disabled={!canSend}
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-center text-xs text-red-600">
              ⚠️ {error.message || "Error: Please check your OpenAI API key in .env.local"}
            </p>
          )}
          {!error && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              💡 Tip: Ask for "daily exercise" to earn XP and practice {targetLanguage}!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </div>
  )
}
