/** A (row, column) address in a DP table. */
export interface Cell {
  i: number
  j: number
}

/** One candidate expression considered when filling a cell. */
export interface Term {
  /** Short human label, e.g. "skip item 2", "delete 'k'". */
  label: string
  /** Symbolic form in dp notation, e.g. "dp[1][3] + 5". */
  expr: string
  /** The same expression with the table values substituted, e.g. "4 + 5". */
  sub: string
  /** Numeric value of the expression. */
  value: number
  /** The cell this term reads from, if any. */
  dep: Cell | null
}

/** A single "this cell was filled" event yielded by a DP generator. */
export interface FillEvent {
  i: number
  j: number
  value: number
  /** Every cell read to compute this value (drawn as outlined dependencies). */
  deps: Cell[]
  /** Candidate terms; terms[winner].value === value. */
  terms: Term[]
  /** How the terms combine. "copy" means there is exactly one term. */
  op: 'max' | 'min' | 'copy'
  winner: number
  /** What the winning term means, e.g. "take item 2". */
  choice: string
  /** Why this branch of the recurrence applied, e.g. "w₂ = 3 ≤ j = 7". */
  note: string
}

/** One hop of the reconstruction walk, from the corner back to the origin. */
export interface PathStep {
  i: number
  j: number
  /** Machine-readable decision: take | skip | match | sub | ins | del | up | left | start. */
  kind: string
  /** Human-readable decision. */
  choice: string
}

export type Table = number[][]

/** Common shape of a finished DP run. */
export interface DpRun {
  table: Table
  events: FillEvent[]
  path: PathStep[]
  best: number
}

/** Allocate a (rows × cols) table filled with `fill`. */
export function allocTable(rows: number, cols: number, fill = 0): Table {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(fill))
}

/** Drain any iterable and count what it produced. */
export function countSteps(steps: Iterable<unknown>): number {
  let n = 0
  for (const _ of steps) n++
  return n
}

export function cellsEqual(a: Cell | null | undefined, b: Cell | null | undefined): boolean {
  return !!a && !!b && a.i === b.i && a.j === b.j
}
