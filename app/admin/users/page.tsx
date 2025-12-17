import { createClient } from "@/lib/supabase/server"
import { AdminUsersManager } from "@/components/admin/admin-users-manager"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, display_name, email, total_xp, current_level, streak_count, hearts, created_at, is_premium")
    .order("total_xp", { ascending: false })
    .limit(500)

  return <AdminUsersManager users={users ?? []} />
}

