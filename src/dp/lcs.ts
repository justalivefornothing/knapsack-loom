import { allocTable, type DpRun, type FillEvent, type PathStep, type Table } from './types'

export interface LcsRun extends DpRun {
  /** One longest common subsequence, in reading order. */
  sequence: string
}

/** Pre-allocated (|a|+1) × (|b|+1) table of zeros. */
export function lcsTable(a: string, b: string): Table {
  return allocTable(a.length + 1, b.length + 1, 0)
}

const q = (c: string) => `‘${c}’`

/** Fill the LCS table row-major, yielding one event per interior cell. */
export function* lcsSteps(
  a: string,
  b: string,
  table: Table = lcsTable(a, b),
): Generator<FillEvent, void, void> {
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const ca = a[i - 1]
      const cb = b[j - 1]
      if (ca === cb) {
        const diag = table[i - 1][j - 1]
        table[i][j] = diag + 1
        yield {
          i,
          j,
          value: diag + 1,
          deps: [{ i: i - 1, j: j - 1 }],
          terms: [
            {
              label: `extend with ${q(ca)}`,
              expr: `dp[${i - 1}][${j - 1}] + 1`,
              sub: `${diag} + 1`,
              value: diag + 1,
              dep: { i: i - 1, j: j - 1 },
            },
          ],
          op: 'copy',
          winner: 0,
          choice: `${q(ca)} matches ${q(cb)}, extend`,
          note: `a${i} = b${j}`,
        }
        continue
      }
      const up = table[i - 1][j]
      const left = table[i][j - 1]
      const terms = [
        {
          label: `drop ${q(ca)} from a`,
          expr: `dp[${i - 1}][${j}]`,
          sub: String(up),
          value: up,
          dep: { i: i - 1, j },
        },
        {
          label: `drop ${q(cb)} from b`,
          expr: `dp[${i}][${j - 1}]`,
          sub: String(left),
          value: left,
          dep: { i, j: j - 1 },
        },
      ]
      const winner = up >= left ? 0 : 1
      const value = terms[winner].value
      table[i][j] = value
      yield {
        i,
        j,
        value,
        deps: terms.map((t) => t.dep),
        terms,
        op: 'max',
        winner,
        choice: terms[winner].label,
        note: `a${i} = ${q(ca)} ≠ b${j} = ${q(cb)}`,
      }
    }
  }
}

/** Walk the finished table back to an edge, collecting matched characters. */
export function lcsBacktrack(table: Table, a: string, b: string): { path: PathStep[]; sequence: string } {
  const path: PathStep[] = []
  const chars: string[] = []
  let i = a.length
  let j = b.length
  while (i > 0 && j > 0) {
    const ca = a[i - 1]
    const cb = b[j - 1]
    if (ca === cb) {
      path.push({ i, j, kind: 'match', choice: `${q(ca)} is in the subsequence` })
      chars.push(ca)
      i--
      j--
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      path.push({ i, j, kind: 'up', choice: `drop ${q(ca)} from a` })
      i--
    } else {
      path.push({ i, j, kind: 'left', choice: `drop ${q(cb)} from b` })
      j--
    }
  }
  path.push({ i, j, kind: 'start', choice: 'a prefix ran out' })
  return { path, sequence: chars.reverse().join('') }
}

export function lcs(a: string, b: string): LcsRun {
  const table = lcsTable(a, b)
  const events = Array.from(lcsSteps(a, b, table))
  const { path, sequence } = lcsBacktrack(table, a, b)
  return { table, events, path, sequence, best: table[a.length][b.length] }
}
