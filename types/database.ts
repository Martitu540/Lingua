export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  native_language: string
  created_at: string
  updated_at: string
  last_active_at: string | null
  is_premium: boolean
  premium_expires_at: string | null
  streak_count: number
  longest_streak: number
  total_xp: number
  current_level: number
  daily_xp_goal: number
  hearts: number
  last_heart_refresh: string
  settings: Record<string, unknown>
}

export interface Language {
  id: string
  code: string
  name: string
  flag_emoji: string
  is_active: boolean
}

export interface Course {
  id: string
  source_language_id: string
  target_language_id: string
  title: string
  description: string
  difficulty_level: string
  is_premium: boolean
  image_url: string
  created_at: string
  source_language?: Language
  target_language?: Language
}

export interface Unit {
  id: string
  course_id: string
  title: string
  description: string
  order_index: number
  icon: string
  theme_color: string
  unlock_xp: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  unit_id: string
  title: string
  type: string
  order_index: number
  xp_reward: number
  estimated_minutes: number
  is_premium: boolean
}

export interface Exercise {
  id: string
  lesson_id: string
  type: "multiple_choice" | "fill_blank" | "drag_drop" | "translation" | "speaking" | "listening"
  order_index: number
  difficulty: number
  content: ExerciseContent
  hints: string[] | null
  explanation: string
  audio_url: string | null
  image_url: string | null
}

export interface ExerciseContent {
  question?: string
  options?: string[]
  correct_index?: number
  sentence?: string
  blank_index?: number
  correct_answers?: string[]
  hint?: string
  translation?: string
  items?: string[]
  correct_order?: number[]
  prompt?: string
}

export interface UserCourse {
  id: string
  user_id: string
  course_id: string
  started_at: string
  last_practiced_at: string | null
  current_unit_id: string | null
  course?: Course
}

export interface UserLessonProgress {
  id: string
  user_id: string
  lesson_id: string
  status: "locked" | "available" | "in_progress" | "completed"
  score: number | null
  attempts: number
  completed_at: string | null
  last_attempted_at: string | null
  mistakes_count: number
}

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  xp_reward: number
  criteria: {
    type: string
    value: number | string
  }
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}

export interface DailyGoal {
  id: string
  user_id: string
  date: string
  xp_goal: number
  xp_earned: number
  lessons_goal: number
  lessons_completed: number
  is_completed: boolean
}

export interface AIConversation {
  id: string
  user_id: string
  course_id: string | null
  type: string
  started_at: string
  ended_at: string | null
  messages: AIMessage[]
}

export interface AIMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}
