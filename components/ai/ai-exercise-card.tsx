"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, Sparkles, Zap, Lightbulb, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Exercise {
  id?: string
  type: "exercise"
  exerciseType: "multiple_choice" | "fill_blank" | "translation" | "conversation"
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  xpReward: number
  difficulty: number
}

interface AIExerciseCardProps {
  exercise: Exercise
  onComplete: (isCorrect: boolean) => void
}

export function AIExerciseCard({ exercise, onComplete }: AIExerciseCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const normalize = (value: string) => value.trim().toLowerCase()

  const handleSubmit = useCallback(() => {
    const answer = exercise.exerciseType === "multiple_choice" ? selectedAnswer : userAnswer.trim()
    const correct = answer.toLowerCase() === exercise.correctAnswer.toLowerCase()
    setIsCorrect(correct)
    setShowResult(true)
  }, [exercise.exerciseType, selectedAnswer, userAnswer, exercise.correctAnswer])

  const handleContinue = useCallback(() => {
    if (isCompleting) return // Prevent double submission
    setIsCompleting(true)
    
    // Small delay for smooth transition
    setTimeout(() => {
      onComplete(isCorrect)
    }, 300)
  }, [onComplete, isCorrect, isCompleting])

  const renderMultipleChoiceOptions = (withFeedback: boolean) => {
    if (!exercise.options) return null

    return (
      <div className="space-y-2">
        {exercise.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrectAnswer = normalize(option) === normalize(exercise.correctAnswer)
          const showCorrectHighlight = withFeedback && isCorrectAnswer
          const showIncorrectHighlight = withFeedback && isSelected && !isCorrectAnswer

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (withFeedback) return
                setSelectedAnswer(option)
              }}
              disabled={withFeedback}
              className={cn(
                "w-full rounded-lg border-2 p-3 text-left transition-all flex items-center justify-between gap-3",
                !withFeedback &&
                  (isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"),
                withFeedback && showCorrectHighlight && "border-emerald-500 bg-emerald-50 shadow-sm",
                withFeedback && showIncorrectHighlight && "border-red-500 bg-red-50",
                withFeedback &&
                  !showCorrectHighlight &&
                  !showIncorrectHighlight &&
                  "border-border/70 bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  showCorrectHighlight && "text-emerald-700",
                  showIncorrectHighlight && "text-red-700",
                )}
              >
                {option}
              </span>
              {withFeedback && (
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {showCorrectHighlight && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">Correct answer</span>
                    </>
                  )}
                  {showIncorrectHighlight && (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-700">Your choice</span>
                    </>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Card className={cn(
      "border-2 bg-gradient-to-br from-primary/5 to-accent/5 transition-all duration-500",
      showResult && isCorrect && "border-emerald-500 shadow-lg shadow-emerald-500/20",
      showResult && !isCorrect && "border-red-500 shadow-lg shadow-red-500/20",
      !showResult && "border-primary/20"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className={cn(
              "h-5 w-5 transition-colors",
              showResult && isCorrect && "text-emerald-600",
              showResult && !isCorrect && "text-red-600",
              !showResult && "text-primary"
            )} />
            Practice Exercise
            {showResult && isCorrect && (
              <span className="ml-2 text-sm font-normal text-emerald-600 animate-pulse">✓ Completed</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showResult && isCorrect && (
              <Badge className="gap-1 bg-emerald-500 text-white animate-bounce">
                <Zap className="h-3 w-3" />
                +{exercise.xpReward} XP Earned!
              </Badge>
            )}
            {!showResult && (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {exercise.xpReward} XP
                </Badge>
                <Badge variant="outline">Level {exercise.difficulty}</Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4">
          <p className="text-base font-medium">{exercise.question}</p>
        </div>

        {exercise.exerciseType === "multiple_choice" && exercise.options ? (
          renderMultipleChoiceOptions(showResult)
        ) : (
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer..."
            className="text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (userAnswer.trim() || selectedAnswer)) {
                handleSubmit()
              }
            }}
          />
        )}

        {!showResult ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer && !userAnswer.trim()}
            className="w-full"
            size="lg"
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-lg p-4 flex items-center gap-3",
                isCorrect ? "bg-emerald-50 border-2 border-emerald-200" : "bg-red-50 border-2 border-red-200",
              )}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div className="flex-1">
                <p className={cn("font-semibold", isCorrect ? "text-emerald-900" : "text-red-900")}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-red-700 mt-1">
                    Correct answer: <strong>{exercise.correctAnswer}</strong>
                  </p>
                )}
              </div>
            </div>

            {exercise.explanation && (
              <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Explanation:</p>
                    <p className="text-sm text-blue-800">{exercise.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleContinue} 
              className="w-full" 
              size="lg" 
              variant={isCorrect ? "default" : "outline"}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
