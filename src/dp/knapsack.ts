import { allocTable, type DpRun, type FillEvent, type PathStep, type Table } from './types'

export interface KnapsackOptions {
  /** Unbounded: each item may be taken any number of times. */
  unbounded?: boolean
}

export interface KnapsackRun extends DpRun {
  /** Zero-based indices of the chosen items, ascending (repeats when unbounded). */
  chosen: number[]
}

/** Pre-allocated (n+1) × (capacity+1) table; row 0 and column 0 are the zero base cases. */
export function knapsackTable(n: number, capacity: number): Table {
  return allocTable(n + 1, capacity + 1, 0)
}

const sub = (n: number) => String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])

/**
 * Fill the knapsack table row by row, yielding one event per interior cell.
 *
 * The column order mirrors the space-optimised 1-D algorithm: 0/1 walks j
 * downward so dp[j - w] still holds the previous row, unbounded walks upward
 * so dp[j - w] already holds the current row. The 2-D result is identical.
 */
export function* knapsackSteps(
  weights: number[],
  values: number[],
  capacity: number,
  opts: KnapsackOptions = {},
  table: Table = knapsackTable(weights.length, capacity),
): Generator<FillEvent, void, void> {
  const n = weights.length
  const unbounded = !!opts.unbounded
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1]
    const v = values[i - 1]
    const srcRow = unbounded ? i : i - 1
    for (let k = 1; k <= capacity; k++) {
      const j = unbounded ? k : capacity + 1 - k
      const skip = table[i - 1][j]
      const skipTerm = {
        label: `skip item ${i}`,
        expr: `dp[${i - 1}][${j}]`,
        sub: String(skip),
        value: skip,
        dep: { i: i - 1, j },
      }
      if (w > j) {
        table[i][j] = skip
        yield {
          i,
          j,
          value: skip,
          deps: [skipTerm.dep],
          terms: [skipTerm],
          op: 'copy',
          winner: 0,
          choice: `item ${i} does not fit`,
          note: `w${sub(i)} = ${w} > j = ${j}`,
        }
        continue
      }
      const rest = table[srcRow][j - w]
      const take = rest + v
      const takeTerm = {
        label: `take item ${i}`,
        expr: `dp[${srcRow}][${j} − ${w}] + ${v}`,
        sub: `${rest} + ${v}`,
        value: take,
        dep: { i: srcRow, j: j - w },
      }
      const winner = take > skip ? 1 : 0
      const value = winner ? take : skip
      table[i][j] = value
      yield {
        i,
        j,
        value,
        deps: [skipTerm.dep, takeTerm.dep],
        terms: [skipTerm, takeTerm],
        op: 'max',
        winner,
        choice: winner ? `take item ${i}` : `skip item ${i}`,
        note: `w${sub(i)} = ${w} ≤ j = ${j}`,
      }
    }
  }
}

/** Walk the finished table from the corner back to row 0, recording each decision. */
export function knapsackBacktrack(
  table: Table,
  weights: number[],
  capacity: number,
  opts: KnapsackOptions = {},
): { path: PathStep[]; chosen: number[] } {
  const path: PathStep[] = []
  const chosen: number[] = []
  let i = weights.length
  let j = capacity
  while (i > 0) {
    if (table[i][j] === table[i - 1][j]) {
      path.push({ i, j, kind: 'skip', choice: `skip item ${i}` })
      i--
    } else {
      path.push({ i, j, kind: 'take', choice: `take item ${i}` })
      chosen.push(i - 1)
      j -= weights[i - 1]
      if (!opts.unbounded) i--
    }
  }
  path.push({ i, j, kind: 'start', choice: 'empty knapsack' })
  chosen.sort((a, b) => a - b)
  return { path, chosen }
}

export function knapsack(
  weights: number[],
  values: number[],
  capacity: number,
  opts: KnapsackOptions = {},
): KnapsackRun {
  if (weights.length !== values.length) throw new Error('weights and values must have equal length')
  const table = knapsackTable(weights.length, capacity)
  const events = Array.from(knapsackSteps(weights, values, capacity, opts, table))
  const { path, chosen } = knapsackBacktrack(table, weights, capacity, opts)
  return { table, events, path, chosen, best: table[weights.length][capacity] }
}
