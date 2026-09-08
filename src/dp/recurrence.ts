import type { FillEvent } from './types'

export type ProblemId = 'knapsack' | 'edit' | 'lcs'

export interface FormulaCase {
  expr: string
  when: string
}

/** The general recurrence as (expression, condition) cases for the panel header. */
export function formulaFor(problem: ProblemId, unbounded = false): FormulaCase[] {
  switch (problem) {
    case 'knapsack':
      return [
        { expr: 'dp[i][j] = dp[i−1][j]', when: 'if wᵢ > j' },
        {
          expr: unbounded
            ? 'dp[i][j] = max(dp[i−1][j], dp[i][j − wᵢ] + vᵢ)'
            : 'dp[i][j] = max(dp[i−1][j], dp[i−1][j − wᵢ] + vᵢ)',
          when: 'otherwise',
        },
      ]
    case 'edit':
      return [
        { expr: 'dp[i][j] = dp[i−1][j−1]', when: 'if aᵢ = bⱼ' },
        { expr: 'dp[i][j] = 1 + min(dp[i−1][j−1], dp[i−1][j], dp[i][j−1])', when: 'otherwise' },
      ]
    case 'lcs':
      return [
        { expr: 'dp[i][j] = dp[i−1][j−1] + 1', when: 'if aᵢ = bⱼ' },
        { expr: 'dp[i][j] = max(dp[i−1][j], dp[i][j−1])', when: 'otherwise' },
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
