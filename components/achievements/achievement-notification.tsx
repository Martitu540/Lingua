"use client"

import { useEffect, useState } from "react"
import { Trophy, Flame, Zap, Target, Moon, Sunrise, MessageSquare, Footprints, X } from "lucide-react"
import type { Achievement } from "@/types/database"

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  star: Zap,
  trophy: Trophy,
  "check-circle": Target,
  moon: Moon,
  sunrise: Sunrise,
  "message-square": MessageSquare,
  footprints: Footprints,
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      setShowConfetti(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 500) // Wait for animation to finish
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement || !isVisible) return null

  const Icon = iconMap[achievement.icon] || Trophy

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-5 duration-500">
      {/* Glow effect */}
      <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 opacity-75 animate-pulse rounded-2xl" />
      
      {/* Main card */}
      <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-2xl min-w-[320px] max-w-md animate-bounce-in">
        {/* Confetti particles */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ["#fbbf24", "#f97316", "#ec4899", "#8b5cf6", "#3b82f6"][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1.5 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center gap-4">
          {/* Icon with animation */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 shadow-lg animate-scale-in rotate-in">
              <Icon className="h-8 w-8 text-white animate-wiggle" />
            </div>
            
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse-ring" />
          </div>

          {/* Text */}
          <div className="flex-1 animate-slide-in-left">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-yellow-600 animate-spin-slow" />
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Achievement Unlocked!</p>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{achievement.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
            {achievement.xp_reward > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-orange-500 animate-pulse" />
                <span className="text-xs font-semibold text-orange-600">+{achievement.xp_reward} XP</span>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 500)
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full sparkle"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
          50% {
            transform: translateY(10px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0) rotate(-180deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes rotate-in {
          from {
            transform: rotate(-10deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(10deg);
          }
          75% {
            transform: rotate(-10deg);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100px) translateX(var(--random-x, 0)) rotate(360deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(2) rotate(180deg);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-rotate-in {
          animation: rotate-in 0.5s ease-out;
        }

        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out 0.3s both;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        .confetti-particle {
          animation: confetti-fall var(--animation-duration, 1.5s) ease-out forwards;
        }

        .sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

