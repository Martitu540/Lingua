import { createClient } from "@/lib/supabase/server"
import { AdminCoursesManager } from "@/components/admin/admin-courses-manager"

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true })

  const { data: languages } = await supabase.from("languages").select("*").order("name", { ascending: true })

  return <AdminCoursesManager courses={courses ?? []} languages={languages ?? []} />
}

