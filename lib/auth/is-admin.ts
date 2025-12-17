type ProfileLike = {
  settings?: any
  email?: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isAdmin({
  userEmail,
  profile,
}: {
  userEmail?: string | null
  profile?: ProfileLike | null
}) {
  const email = userEmail || profile?.email || null

  // Preferred: explicit allowlist via env var (comma-separated).
  const allowlistRaw = process.env.ADMIN_EMAILS || ""
  const allowlist = allowlistRaw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map(normalizeEmail)

  if (email && allowlist.includes(normalizeEmail(email))) return true

  // Fallback: stored role in profile settings (useful when you manage it in Supabase).
  const role = profile?.settings?.role
  if (role === "admin") return true

  const isAdminFlag = profile?.settings?.isAdmin ?? profile?.settings?.admin
  if (isAdminFlag === true) return true

  return false
}

