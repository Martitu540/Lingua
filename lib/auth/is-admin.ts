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

  // If an allowlist exists, ONLY allow those emails.
  if (allowlist.length > 0) {
    return Boolean(email && allowlist.includes(normalizeEmail(email)))
  }

  // If no allowlist is configured:
  // - In production, deny by default (prevents accidental public admin access).
  // - In development, allow a simple profile-settings role fallback for convenience.
  if (process.env.NODE_ENV === "production") {
    return false
  }

  const role = profile?.settings?.role
  if (role === "admin") return true

  const isAdminFlag = profile?.settings?.isAdmin ?? profile?.settings?.admin
  if (isAdminFlag === true) return true

  return false
}
