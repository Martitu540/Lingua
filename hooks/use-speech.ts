"use client"

import { useState, useCallback, useEffect } from "react"

interface UseSpeechOptions {
  lang?: string
  rate?: number
  pitch?: number
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { lang = "es-ES", rate = 0.9, pitch = 1 } = options
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.pitch = pitch

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, lang, rate, pitch],
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  return { speak, stop, isSpeaking, isSupported }
}
