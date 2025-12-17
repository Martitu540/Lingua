import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/ai/chat-interface"
import type { Course, Language } from "@/types/database"

interface CourseWithLanguages extends Course {
  source_language: Language
  target_language: Language
}

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's enrolled courses for context
  const { data: userCourses } = await supabase
    .from("user_courses")
    .select(`
      *,
      course:courses(
        *,
        source_language:languages!courses_source_language_id_fkey(*),
        target_language:languages!courses_target_language_id_fkey(*)
      )
    `)
    .eq("user_id", user.id)
    .order("last_practiced_at", { ascending: false })

  // Fetch all available languages for selection
  const { data: languages } = await supabase
    .from("languages")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Get the most recently practiced course
  const activeCourse = userCourses?.[0]?.course as CourseWithLanguages | undefined

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, total_xp")
    .eq("id", user.id)
    .single()

  // Fetch user progress for AI context
  const { data: lessonProgress } = await supabase
    .from("user_lesson_progress")
    .select(`
      *,
      lesson:lessons(
        title,
        unit:units(title, course:courses(title))
      )
    `)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(10)

  // Fetch recent mistakes
  const { data: exerciseHistory } = await supabase
    .from("user_exercise_history")
    .select(`
      *,
      exercise:exercises(
        content,
        lesson:lessons(title)
      )
    `)
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .order("attempted_at", { ascending: false })
    .limit(10)

  // Fetch current unit progress
  const currentUnit = userCourses?.[0]?.current_unit_id
    ? await supabase
        .from("units")
        .select("title")
        .eq("id", userCourses[0].current_unit_id)
        .single()
    : { data: null }

  // Build progress context
  const userProgress = {
    lessonsCompleted: lessonProgress?.filter((p) => p.status === "completed").length || 0,
    mistakes: exerciseHistory?.map((h) => {
      const content = h.exercise?.content as any
      return content?.question || content?.text || "Unknown mistake"
    }) || [],
    recentTopics: lessonProgress?.map((p) => p.lesson?.title || "").filter(Boolean) || [],
    currentUnit: currentUnit?.data?.title || null,
    totalXP: profile?.total_xp || 0,
  }

  return (
    <div className="mx-auto h-[calc(100vh-8rem)] max-w-5xl">
      <ChatInterface
        userId={user.id}
        userName={profile?.display_name || "Learner"}
        userLevel={profile?.current_level || 1}
        activeCourse={activeCourse}
        languages={languages || []}
        userProgress={userProgress}
      />
    </div>
  )
}
