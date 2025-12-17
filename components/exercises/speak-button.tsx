"use client"

import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

interface SpeakButtonProps {
  text: string
  lang?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  className?: string
  autoPlay?: boolean
}

export function SpeakButton({
  text,
  lang = "es-ES",
  size = "md",
  variant = "ghost",
  className,
  autoPlay = false,
}: SpeakButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useSpeech({ lang })

  // Auto-play on mount if requested
  if (autoPlay && isSupported && typeof window !== "undefined") {
    // Small delay to ensure component is mounted
    setTimeout(() => speak(text), 300)
  }

  if (!isSupported) return null

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => (isSpeaking ? stop() : speak(text))}
      className={cn(
        sizeClasses[size],
        "rounded-full transition-all",
        isSpeaking && "animate-pulse bg-primary text-primary-foreground",
        className,
      )}
    >
      {isSpeaking ? <VolumeX className={iconSizes[size]} /> : <Volume2 className={iconSizes[size]} />}
    </Button>
  )
}
