"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Heart, Zap, Sparkles, Gift } from "lucide-react"
import confetti from "canvas-confetti"

// Only import confetti on client side
if (typeof window !== "undefined") {
  // confetti is already imported
}

interface ThankYouPopupProps {
  open: boolean
  onClose: () => void
  amount: number
  heartsReward: number
  xpReward: number
}

export function ThankYouPopup({ open, onClose, amount, heartsReward, xpReward }: ThankYouPopupProps) {
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      // Trigger confetti
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      setShowContent(true)

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    } else {
      setShowContent(false)
    }
  }, [open, onClose])

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
        {showContent && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-center shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-white/30 animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Main content */}
            <div className="relative z-10">
              {/* Gift icon with animation */}
              <div className="mb-6 flex justify-center">
                <div className="relative animate-bounce-in">
                  <div className="animate-bounce-slow">
                    <Gift className="h-20 w-20 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 animate-spin-slow">
                    <Sparkles className="h-8 w-8 text-yellow-300" />
                  </div>
                </div>
              </div>

              {/* Thank you text */}
              <h2 className="mb-2 text-3xl font-bold text-white animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-400">
                Thank You! 🎉
              </h2>

              <p className="mb-6 text-lg text-white/90 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-500">
                Your donation of <span className="font-bold">${amount.toFixed(2)}</span> helps us improve the platform!
              </p>

              {/* Rewards section */}
              <div className="mb-6 rounded-xl bg-white/20 p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-600">
                <p className="mb-3 text-sm font-semibold text-white/90">You received:</p>
                <div className="flex items-center justify-center gap-6">
                  {/* Hearts reward */}
                  <div className="flex flex-col items-center gap-1 animate-in zoom-in-0 duration-500 delay-800">
                    <div className="animate-bounce">
                      <Heart className="h-8 w-8 fill-white text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">+{heartsReward}</span>
                  </div>

                  {/* XP reward */}
                  <div className="flex flex-col items-center gap-1 animate-in zoom-in-0 duration-500 delay-900">
                    <div className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                      <Zap className="h-8 w-8 text-yellow-300" />
                    </div>
                    <span className="text-lg font-bold text-white">+{xpReward} XP</span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="rounded-lg bg-white/20 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white/30 hover:scale-105 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-700"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

