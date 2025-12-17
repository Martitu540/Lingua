import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { isAdmin } from "@/lib/auth/is-admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("email, settings").eq("id", user.id).maybeSingle()

  if (!isAdmin({ userEmail: user.email, profile })) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
    </div>
  )
}
