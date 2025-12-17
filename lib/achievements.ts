import { createClient } from "@/lib/supabase/server"
import type { Achievement } from "@/types/database"

interface AchievementCheckContext {
  userId: string
  totalXP?: number
  streakCount?: number
  lessonsCompleted?: number
  mistakesCount?: number
  currentHour?: number
  hasAIChat?: boolean
}

/**
 * Checks and unlocks achievements based on user progress
 * Returns array of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  context: AchievementCheckContext
): Promise<Achievement[]> {
  const supabase = await createClient()
  const { userId, totalXP, streakCount, lessonsCompleted, mistakesCount, currentHour, hasAIChat } = context

  // Get all achievements
  const { data: allAchievements } = await supabase.from("achievements").select("*")
  if (!allAchievements) return []

  // Get user's already earned achievements
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId)

  const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || [])

  const newlyUnlocked: Achievement[] = []

  for (const achievement of allAchievements) {
    // Skip if already earned
    if (earnedIds.has(achievement.id)) continue

    const criteria = achievement.criteria as { type: string; value: number | string }
    let shouldUnlock = false

    switch (criteria.type) {
      case "lessons_completed":
        if (lessonsCompleted !== undefined && lessonsCompleted >= (criteria.value as number)) {
          shouldUnlock = true
        }
        break

      case "streak":
        if (streakCount !== undefined && streakCount >= (criteria.value as number)) {
          shouldUnlock = true
        }
        break

      case "xp":
        if (totalXP !== undefined && totalXP >= (criteria.value as number)) {
          shouldUnlock = true
        }
        break

      case "perfect_lesson":
        if (mistakesCount !== undefined && mistakesCount === 0) {
          shouldUnlock = true
        }
        break

      case "time":
        if (currentHour !== undefined) {
          if (criteria.value === "night" && currentHour >= 22) {
            shouldUnlock = true
          } else if (criteria.value === "morning" && currentHour < 7) {
            shouldUnlock = true
          }
        }
        break

      case "ai_chat":
        if (hasAIChat) {
          shouldUnlock = true
        }
        break
    }

    if (shouldUnlock) {
      // Unlock the achievement
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      })

      if (!error) {
        // Award XP
        if (achievement.xp_reward > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_xp, current_level")
            .eq("id", userId)
            .single()

          if (profile) {
            const newXP = (profile.total_xp || 0) + achievement.xp_reward
            const newLevel = Math.floor(newXP / 100) + 1

            await supabase
              .from("profiles")
              .update({
                total_xp: newXP,
                current_level: newLevel > profile.current_level ? newLevel : profile.current_level,
              })
              .eq("id", userId)
          }
        }

        newlyUnlocked.push(achievement)
      }
    }
  }

  return newlyUnlocked
}

