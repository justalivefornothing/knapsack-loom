import type { FillEvent } from './types'

export type ProblemId = 'knapsack' | 'edit' | 'lcs'

/** The general recurrence, one case per line, for the panel header. */
export function formulaFor(problem: ProblemId, unbounded = false): string[] {
  switch (problem) {
    case 'knapsack':
      return [
        'dp[i][j] = dp[i−1][j]                        if wᵢ > j',
        unbounded
          ? 'dp[i][j] = max(dp[i−1][j], dp[i][j − wᵢ] + vᵢ)      otherwise'
          : 'dp[i][j] = max(dp[i−1][j], dp[i−1][j − wᵢ] + vᵢ)    otherwise',
      ]
    case 'edit':
      return [
        'dp[i][j] = dp[i−1][j−1]                                if aᵢ = bⱼ',
        'dp[i][j] = 1 + min(dp[i−1][j−1], dp[i−1][j], dp[i][j−1])   otherwise',
      ]
    case 'lcs':
      return [
        'dp[i][j] = dp[i−1][j−1] + 1                 if aᵢ = bⱼ',
        'dp[i][j] = max(dp[i−1][j], dp[i][j−1])       otherwise',
      ]
  }
}

export interface RecurrenceText {
  /** "dp[2][7]" */
  lhs: string
  /** "max(dp[1][7], dp[1][3] + 5)" — built from the event's own terms. */
  symbolic: string
  /** "max(4, 4 + 5)" */
  substituted: string
  /** "9" */
  result: string
}

/**
 * Render a fill event as the recurrence it evaluated. Because the text is
 * derived from the same terms the algorithm used, it cannot drift from the
 * numbers in the table.
 */
export function formatEvent(ev: FillEvent): RecurrenceText {
  const wrap = (parts: string[]) => (ev.op === 'copy' ? parts[0] : `${ev.op}(${parts.join(', ')})`)
  return {
    lhs: `dp[${ev.i}][${ev.j}]`,
    symbolic: wrap(ev.terms.map((t) => t.expr)),
    substituted: wrap(ev.terms.map((t) => t.sub)),
    result: String(ev.value),
  }
}

/** Single-line form, handy for tests and screen readers. */
export function formatEventLine(ev: FillEvent): string {
  const r = formatEvent(ev)
  const steps = [r.symbolic, r.substituted, r.result].filter((s, k, arr) => k === 0 || s !== arr[k - 1])
  return `${r.lhs} = ${steps.join(' = ')}`
}
