"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { lookupWord, detectLanguage } from "@/lib/dictionary"
import { Volume2 } from "lucide-react"
import { useSpeech } from "@/hooks/use-speech"

interface TappableTextProps {
  text: string
  className?: string
  wordClassName?: string
  language?: "es" | "en" | "auto"
  highlightWords?: string[] // Only these words will be tappable (overrides highlightAll)
  highlightQuoted?: boolean // Auto-highlight words in quotes like "Adiós"
  highlightAll?: boolean // Make every word tappable (Duolingo-style)
}

interface WordInfo {
  word: string
  cleanWord: string
  translation: string | null
  pronunciation?: string
  partOfSpeech?: string
  isHighlighted: boolean
  isQuoted: boolean
}

export function TappableText({
  text,
  className,
  wordClassName,
  language = "auto",
  highlightWords,
  highlightQuoted = true, // Default to highlighting quoted words
  highlightAll = true,
}: TappableTextProps) {
  const [activeWord, setActiveWord] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const detectedLang = language === "auto" ? detectLanguage(text) : language
  const direction = detectedLang === "es" ? "es-en" : "en-es"

  const { speak, isSpeaking } = useSpeech({
    lang: detectedLang === "es" ? "es-ES" : "en-US",
    rate: 0.9,
  })

  const words: WordInfo[] = (() => {
    const result: WordInfo[] = []
    // Match quoted words like "word" or «word» or 'word', or regular words/spaces
    const regex = /([""«»'']([^""«»'']+)[""«»''])|(\S+)|(\s+)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0]

      // Check if it's whitespace
      if (/^\s+$/.test(fullMatch)) {
        result.push({ word: fullMatch, cleanWord: fullMatch, translation: null, isHighlighted: false, isQuoted: false })
        continue
      }

      // Check if it's a quoted word
      const isQuoted = /^[""«»'']/.test(fullMatch)
      const cleanWord = fullMatch.replace(/^[""«»'']+|[""«»'']+$/g, "").replace(/[.,!?;:]+$/, "")

      // Determine if this word should be highlighted
      const shouldHighlight =
        (isQuoted && highlightQuoted) ||
        (highlightWords && highlightWords.some((hw) => hw.toLowerCase() === cleanWord.toLowerCase())) ||
        highlightAll

      const lookup = shouldHighlight ? lookupWord(cleanWord, direction) : null

      result.push({
        word: fullMatch,
        cleanWord,
        translation: lookup?.translation || null,
        pronunciation: lookup?.pronunciation,
        partOfSpeech: lookup?.partOfSpeech,
        isHighlighted: shouldHighlight,
        isQuoted,
      })
    }

    return result
  })()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setActiveWord(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleWordClick = (index: number, event: React.MouseEvent) => {
    const wordInfo = words[index]

    // Only allow clicking on highlighted words
    if (!wordInfo.isHighlighted) return
    if (/^\s+$/.test(wordInfo.word)) return

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()

    if (containerRect) {
      setTooltipPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      })
    }

    setActiveWord(activeWord === index ? null : index)
  }

  const activeWordInfo = activeWord !== null ? words[activeWord] : null

  return (
    <span ref={containerRef} className={cn("relative inline", className)}>
      <span className="leading-relaxed">
        {words.map((wordInfo, index) => {
          if (/^\s+$/.test(wordInfo.word)) {
            return <span key={index}>{wordInfo.word}</span>
          }

          const isActive = activeWord === index

          if (!wordInfo.isHighlighted) {
            return (
              <span key={index} className={wordClassName}>
                {wordInfo.word}
              </span>
            )
          }

          return (
            <span
              key={index}
              onClick={(e) => handleWordClick(index, e)}
              className={cn(
                "relative cursor-pointer rounded-md px-1 py-0.5 transition-all font-semibold",
                "bg-primary/10 text-primary border-b-2 border-primary/50",
                "hover:bg-primary/20 hover:border-primary",
                isActive && "bg-primary/25 border-primary ring-2 ring-primary/20",
                wordClassName,
              )}
            >
              {wordInfo.word}
            </span>
          )
        })}
      </span>

      {/* Tooltip */}
      {activeWord !== null && tooltipPosition && activeWordInfo?.isHighlighted && (
        <span
          ref={tooltipRef}
          className={cn(
            "absolute z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            "min-w-[200px] max-w-[300px]",
          )}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          {/* Arrow */}
          <span className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full">
            <span className="block border-8 border-transparent border-t-card" />
          </span>

          {/* Content */}
          <span className="block rounded-xl border-2 border-primary/20 bg-card p-4 shadow-xl">
            {activeWordInfo?.translation ? (
              <>
                {/* Original word */}
                <span className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-xl text-primary">{activeWordInfo.cleanWord}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      speak(activeWordInfo.cleanWord)
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      isSpeaking && "animate-pulse",
                    )}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </span>

                {/* Part of speech */}
                {activeWordInfo.partOfSpeech && (
                  <span className="inline-block px-2 py-0.5 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {activeWordInfo.partOfSpeech}
                  </span>
                )}

                {/* Translation */}
                <span className="block text-foreground mt-2">
                  <span className="text-muted-foreground text-sm">Translation: </span>
                  <span className="font-semibold text-lg">{activeWordInfo.translation}</span>
                </span>

                {/* Pronunciation */}
                {activeWordInfo.pronunciation && (
                  <span className="block mt-1 text-sm text-muted-foreground italic">
                    /{activeWordInfo.pronunciation}/
                  </span>
                )}
              </>
            ) : (
              <span className="block text-center py-1">
                <span className="block font-bold text-lg mb-1">{activeWordInfo?.cleanWord}</span>
                <span className="block text-sm text-muted-foreground">Tap to hear pronunciation</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(activeWordInfo?.cleanWord || "")
                  }}
                  className="mt-2 flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                  Listen
                </button>
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  )
}
