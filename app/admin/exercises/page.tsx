import { createClient } from "@/lib/supabase/server"
import { AdminExercisesManager } from "@/components/admin/admin-exercises-manager"

export default async function AdminExercisesPage() {
  const supabase = await createClient()

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .order("title", { ascending: true })

  if (exercisesError) {
    console.error("Error fetching exercises:", exercisesError)
  }

  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError)
  }

  return (
    <AdminExercisesManager 
      exercises={exercises ?? []} 
      lessons={lessons ?? []} 
    />
  )
}

