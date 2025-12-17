// Simple Levenshtein distance
export function distance(a: string, b: string): number {
  a = a.toLowerCase()
  b = b.toLowerCase()

  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[a.length][b.length]
}

// Suggest closest answer
export function suggestAnswer(user: string, correctList: string[]) {
  let best = null
  let bestScore = Infinity

  for (const truth of correctList) {
    const d = distance(user, truth)
    if (d < bestScore) {
      best = truth
      bestScore = d
    }
  }

  // Suggest only if the answer is "close"
  if (bestScore <= 3) return best
  return null
}
