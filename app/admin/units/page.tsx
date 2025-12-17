import { createClient } from "@/lib/supabase/server"
import { AdminUnitsManager } from "@/components/admin/admin-units-manager"

export default async function AdminUnitsPage() {
  const supabase = await createClient()

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: courses } = await supabase.from("courses").select("*").order("title", { ascending: true })

  return <AdminUnitsManager units={units ?? []} courses={courses ?? []} />
}

