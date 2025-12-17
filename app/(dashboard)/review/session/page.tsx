import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReviewSessionContainer } from "@/components/review/review-session-container"

export default async function ReviewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; lessonId?: string }>
}) {
  const { type, lessonId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let exercises: any[] = []
  let reviewTitle = "Review Session"

  if (type === "mistakes") {
    // Fetch exercises from incorrect answers
    const { data: incorrectExercises } = await supabase
      .from("user_exercise_history")
      .select(
        `
        exercise_id,
        exercise:exercises(*, lesson:lessons(title, unit:units(course_id)))
      `
      )
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("attempted_at", { ascending: false })
      .limit(20)

    // Get unique exercises (avoid duplicates) and ensure content is properly structured
    const uniqueExerciseIds = new Set<string>()
    exercises =
      incorrectExercises
        ?.filter((item) => {
          if (!item.exercise || uniqueExerciseIds.has(item.exercise.id)) {
            return false
          }
          uniqueExerciseIds.add(item.exercise.id)
          return true
        })
        .map((item) => {
          const exercise = item.exercise
          if (!exercise) return null
          
          // Ensure content is properly parsed (Supabase JSONB is usually already an object)
          if (typeof exercise.content === "string") {
            try {
              exercise.content = JSON.parse(exercise.content)
            } catch (e) {
              console.error("Failed to parse exercise content:", exercise.id, e)
              return null
            }
          }
          
          // Validate content structure based on exercise type
          if (!exercise.content || typeof exercise.content !== "object") {
            console.warn("Exercise missing or invalid content:", exercise.id, typeof exercise.content, exercise.content)
            return null
          }
          
          if (exercise.type === "multiple_choice") {
            if (!exercise.content.options || !Array.isArray(exercise.content.options) || exercise.content.options.length === 0) {
              console.warn("Multiple choice exercise missing options:", exercise.id, "Content:", JSON.stringify(exercise.content))
              return null
            }
            if (exercise.content.correct_index === undefined || exercise.content.correct_index === null) {
              console.warn("Multiple choice exercise missing correct_index:", exercise.id, "Content:", JSON.stringify(exercise.content))
              return null
            }
          }
          
          return exercise
        })
        .filter((ex) => ex && ex.content) || [] // Filter out exercises without content

    reviewTitle = "Review Mistakes"
  } else if (type === "smart" || !type) {
    // Smart review: Get exercises that were answered incorrectly
    // First, get all exercises that were answered incorrectly (regardless of lesson)
    const { data: incorrectHistory } = await supabase
      .from("user_exercise_history")
      .select("exercise_id")
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("attempted_at", { ascending: false })
      .limit(30)

    const incorrectExerciseIds = incorrectHistory?.map((h: any) => h.exercise_id).filter(Boolean) || []

    if (incorrectExerciseIds.length > 0) {
      // Get the full exercise data for these exercises
      const { data: allExercises } = await supabase
        .from("exercises")
        .select("*")
        .in("id", incorrectExerciseIds)

      // Get unique exercises (avoid duplicates)
      const uniqueExerciseIds = new Set<string>()
      exercises =
        allExercises
          ?.filter((exercise: any) => {
            if (!exercise || uniqueExerciseIds.has(exercise.id)) {
              return false
            }
            uniqueExerciseIds.add(exercise.id)
            return true
          })
          .map((exercise: any) => {
            // Ensure content is properly parsed (Supabase returns JSONB as object, but double-check)
            if (exercise && typeof exercise.content === "string") {
              try {
                exercise.content = JSON.parse(exercise.content)
              } catch {
                // If parsing fails, keep as is
              }
            }
            // Validate content structure based on exercise type
            if (!exercise.content || typeof exercise.content !== "object") {
              console.warn("Exercise missing or invalid content:", exercise.id, typeof exercise.content)
              return null
            }
            
            if (exercise.type === "multiple_choice") {
              if (!exercise.content.options || !Array.isArray(exercise.content.options) || exercise.content.options.length === 0) {
                console.warn("Multiple choice exercise missing options:", exercise.id, "Content:", JSON.stringify(exercise.content))
                return null
              }
              if (exercise.content.correct_index === undefined || exercise.content.correct_index === null) {
                console.warn("Multiple choice exercise missing correct_index:", exercise.id, "Content:", JSON.stringify(exercise.content))
                return null
              }
            }
            
            return exercise
          })
          .filter((ex: any) => ex && ex.content) || []
    }

    reviewTitle = "Smart Review"
  } else if (lessonId) {
    // Review specific lesson
    const { data: lesson } = await supabase
      .from("lessons")
      .select(`
        *,
        exercises(*)
      `)
      .eq("id", lessonId)
      .single()

    exercises =
      lesson?.exercises
        ?.sort((a: any, b: any) => a.order_index - b.order_index)
        .map((exercise: any) => {
          // Ensure content is properly parsed
          if (exercise && typeof exercise.content === "string") {
            try {
              exercise.content = JSON.parse(exercise.content)
            } catch {
              // If parsing fails, keep as is
            }
          }
          return exercise
        })
        .filter((ex: any) => ex && ex.content) || []
    reviewTitle = lesson?.title || "Lesson Review"
  }

  // Debug: Log exercise structure
  if (exercises.length > 0) {
    console.log(`[Review] Found ${exercises.length} exercises for ${reviewTitle}`)
    console.log(`[Review] First exercise sample:`, {
      id: exercises[0]?.id,
      type: exercises[0]?.type,
      hasContent: !!exercises[0]?.content,
      contentType: typeof exercises[0]?.content,
      contentKeys: exercises[0]?.content ? Object.keys(exercises[0].content) : [],
      hasOptions: exercises[0]?.type === "multiple_choice" ? !!exercises[0]?.content?.options : "N/A",
      optionsLength: exercises[0]?.type === "multiple_choice" ? exercises[0]?.content?.options?.length : "N/A",
    })
  }

  if (exercises.length === 0) {
    redirect("/review?empty=true")
  }

  // Get user profile for hearts
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user has hearts
  if ((profile as any)?.hearts <= 0) {
    redirect("/learn?nohearts=true")
  }

  return (
    <ReviewSessionContainer
      exercises={exercises}
      userId={user.id}
      reviewTitle={reviewTitle}
      initialHearts={(profile as any)?.hearts ?? 5}
    />
  )
}

