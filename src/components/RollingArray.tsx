import type { KnapsackRun } from '../dp/knapsack'
import type { Inputs } from '../state/loom'
import { tint } from '../lib/tint'
import { Panel } from './ui'

interface Props {
  run: KnapsackRun
  inputs: Inputs
  step: number
  maxValue: number
}

/**
 * The space-optimised knapsack keeps one row. This view derives that row from
 * the 2-D table at the current step: entries already visited in this pass hold
 * row i, the rest still hold row i−1 — so you can watch what gets overwritten.
 */
export default function RollingArray({ run, inputs, step, maxValue }: Props) {
  const { table, events } = run
  const capacity = inputs.capacity
  const ev = step > 0 ? events[step - 1] : null
  const i = ev?.i ?? 0
  const j = ev?.j ?? -1
  const w = ev ? inputs.items[i - 1].w : 0
  const unbounded = inputs.unbounded

  const processed = (jj: number) => (ev ? (unbounded ? jj <= j : jj >= j) : true)
  const values = table[0].map((_, jj) => (processed(jj) ? table[i][jj] : table[Math.max(0, i - 1)][jj]))
  const old = ev ? table[i - 1][j] : null
  const changed = ev !== null && old !== ev.value
  const readIdx = ev && w <= j ? j - w : -1
  const visited = ev !== null && w <= j

  let caption: string
  if (!ev) caption = 'Row 0 — one array of zeros, before any item is considered.'
  else if (!visited)
    caption = `Row ${i} · j = ${j} < w = ${w}: the 1-D loop never visits this index, dp[${j}] keeps row ${i - 1}'s value.`
  else if (unbounded)
    caption = `Row ${i} · j climbs 1 → ${capacity}, so dp[${j} − ${w}] already holds row ${i} — items may repeat.`
  else caption = `Row ${i} · j falls ${capacity} → 1, so dp[${j} − ${w}] still holds row ${i - 1} — each item used once.`

  return (
    <Panel
      title="Rolling 1-D array"
      aside={
        <span className="font-mono tabular">
          dp[0..{capacity}] · {unbounded ? 'j ascending' : 'j descending'}
        </span>
      }
    >
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${capacity + 1}, minmax(2.1rem, 1fr))` }}>
          {values.map((v, jj) => {
            const isWrite = jj === j && visited
            const isRead = jj === readIdx
            return (
              <div key={jj} className="flex flex-col items-center gap-1">
                <div
                  className={`relative grid h-10 w-full place-items-center rounded-sm font-mono text-sm tabular transition-colors duration-200 ${
                    isWrite ? 'z-10 shadow-[0_2px_8px_rgba(43,33,24,0.3)]' : ''
                  }`}
                  style={{
                    ...tint(v, maxValue),
                    outline: isWrite
                      ? '2px solid var(--color-ink)'
                      : isRead
                        ? '2px dashed var(--color-taupe-deep)'
                        : '1px solid var(--color-taupe)',
                    outlineOffset: -1,
                  }}
                  aria-label={`dp[${jj}] = ${v}${isWrite && changed ? `, was ${old}` : ''}`}
                >
                  {isWrite && changed ? (
                    <span className="flex items-baseline gap-1">
                      <s className="text-[11px] opacity-70">{old}</s>
                      <span className="font-medium">{v}</span>
                    </span>
                  ) : (
                    v
                  )}
                </div>
                <span
                  className={`font-mono text-[10px] tabular ${
                    isWrite ? 'font-semibold text-ink' : isRead ? 'text-taupe-deep' : 'text-ink-soft'
                  }`}
                >
                  {isWrite ? '↑ write' : isRead ? '↑ read' : jj}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{caption}</p>
    </Panel>
  )
}
