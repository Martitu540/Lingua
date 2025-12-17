import { createClient } from "@/lib/supabase/server"
import { AdminLessonsManager } from "@/components/admin/admin-lessons-manager"

export default async function AdminLessonsPage() {
  const supabase = await createClient()

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: units } = await supabase.from("units").select("*").order("title", { ascending: true })

  return <AdminLessonsManager lessons={lessons ?? []} units={units ?? []} />
}

