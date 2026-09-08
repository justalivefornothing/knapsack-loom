import { allocTable, type DpRun, type FillEvent, type PathStep, type Table } from './types'

export type EditKind = 'match' | 'sub' | 'ins' | 'del'

export interface AlignmentStep {
  kind: EditKind
  /** Character consumed from `a` (null for an insertion). */
  a: string | null
  /** Character consumed from `b` (null for a deletion). */
  b: string | null
}

export interface EditDistanceRun extends DpRun {
  alignment: AlignmentStep[]
}

/** Pre-allocated table with the base cases dp[i][0] = i and dp[0][j] = j. */
export function editDistanceTable(a: string, b: string): Table {
  const table = allocTable(a.length + 1, b.length + 1, 0)
  for (let i = 0; i <= a.length; i++) table[i][0] = i
  for (let j = 0; j <= b.length; j++) table[0][j] = j
  return table
}

const q = (c: string) => `‘${c}’`

/** Fill the Levenshtein table row-major, yielding one event per interior cell. */
export function* editDistanceSteps(
  a: string,
  b: string,
  table: Table = editDistanceTable(a, b),
): Generator<FillEvent, void, void> {
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const ca = a[i - 1]
      const cb = b[j - 1]
      const diag = table[i - 1][j - 1]
      if (ca === cb) {
        table[i][j] = diag
        yield {
          i,
          j,
          value: diag,
          deps: [{ i: i - 1, j: j - 1 }],
          terms: [
            {
              label: `keep ${q(ca)}`,
              expr: `dp[${i - 1}][${j - 1}]`,
              sub: String(diag),
              value: diag,
              dep: { i: i - 1, j: j - 1 },
            },
          ],
          op: 'copy',
          winner: 0,
          choice: `${q(ca)} matches ${q(cb)}, no edit`,
          note: `a${i} = b${j}`,
        }
        continue
      }
      const up = table[i - 1][j]
      const left = table[i][j - 1]
      const terms = [
        {
          label: `substitute ${q(ca)} → ${q(cb)}`,
          expr: `dp[${i - 1}][${j - 1}] + 1`,
          sub: `${diag} + 1`,
          value: diag + 1,
          dep: { i: i - 1, j: j - 1 },
        },
        {
          label: `delete ${q(ca)}`,
          expr: `dp[${i - 1}][${j}] + 1`,
          sub: `${up} + 1`,
          value: up + 1,
          dep: { i: i - 1, j },
        },
        {
          label: `insert ${q(cb)}`,
          expr: `dp[${i}][${j - 1}] + 1`,
          sub: `${left} + 1`,
          value: left + 1,
          dep: { i, j: j - 1 },
        },
      ]
      let winner = 0
      for (let t = 1; t < terms.length; t++) if (terms[t].value < terms[winner].value) winner = t
      const value = terms[winner].value
      table[i][j] = value
      yield {
        i,
        j,
        value,
        deps: terms.map((t) => t.dep),
        terms,
        op: 'min',
        winner,
        choice: terms[winner].label,
        note: `a${i} = ${q(ca)} ≠ b${j} = ${q(cb)}`,
      }
    }
  }
}

/** Walk the finished table back to (0, 0), producing the path and the alignment in reading order. */
export function editDistanceBacktrack(
  table: Table,
  a: string,
  b: string,
): { path: PathStep[]; alignment: AlignmentStep[] } {
  const path: PathStep[] = []
  const alignment: AlignmentStep[] = []
  let i = a.length
  let j = b.length
  while (i > 0 || j > 0) {
    const ca = a[i - 1]
    const cb = b[j - 1]
    let kind: EditKind
    if (i > 0 && j > 0 && ca === cb) kind = 'match'
    else if (i > 0 && j > 0 && table[i][j] === table[i - 1][j - 1] + 1) kind = 'sub'
    else if (i > 0 && table[i][j] === table[i - 1][j] + 1) kind = 'del'
    else kind = 'ins'
    const choice = {
      match: `keep ${q(ca)}`,
      sub: `substitute ${q(ca)} → ${q(cb)}`,
      del: `delete ${q(ca)}`,
      ins: `insert ${q(cb)}`,
    }[kind]
    path.push({ i, j, kind, choice })
    alignment.push({
      kind,
      a: kind === 'ins' ? null : ca,
      b: kind === 'del' ? null : cb,
    })
    if (kind !== 'ins') i--
    if (kind !== 'del') j--
  }
  path.push({ i: 0, j: 0, kind: 'start', choice: 'both strings empty' })
  alignment.reverse()
  return { path, alignment }
}

export function editDistance(a: string, b: string): EditDistanceRun {
  const table = editDistanceTable(a, b)
  const events = Array.from(editDistanceSteps(a, b, table))
  const { path, alignment } = editDistanceBacktrack(table, a, b)
  return { table, events, path, alignment, best: table[a.length][b.length] }
}
