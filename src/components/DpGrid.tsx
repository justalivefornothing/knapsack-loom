import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cellsEqual, type Cell } from '../dp/types'
import type { AnyRun, Inputs } from '../state/loom'
import { tint } from '../lib/tint'

interface Props {
  run: AnyRun
  inputs: Inputs
  step: number
  order: number[][]
  maxValue: number
  trace: number
  focus: Cell | null
  onFocus: (cell: Cell | null) => void
}

const GAP = 1

export default function DpGrid({ run, inputs, step, order, maxValue, trace, focus, onFocus }: Props) {
  const { table, events, path } = run
  const rows = table.length
  const cols = table[0].length
  const isKnapsack = run.kind === 'knapsack'
  const headerW = isKnapsack ? 58 : 34

  const wrapRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(36)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const avail = el.clientWidth - headerW - (cols + 1) * GAP
      setCell(Math.max(24, Math.min(46, Math.floor(avail / cols))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cols, headerW])

  const current = step > 0 ? events[step - 1] : null
  const winnerDep = current ? current.terms[current.winner].dep : null
  const shown = trace >= 0 ? path.slice(0, trace) : []
  const inPath = new Set(shown.map((p) => `${p.i},${p.j}`))
  const litRows = new Set(shown.filter((p) => p.kind === 'take' || p.kind === 'match').map((p) => p.i))
  const litCols = new Set(shown.filter((p) => p.kind === 'match').map((p) => p.j))

  const pitch = cell + GAP
  // The grid has GAP padding, then a header track, then a gap before each cell track.
  const cx = (j: number) => 2 * GAP + headerW + j * pitch + cell / 2
  const cy = (i: number) => 2 * GAP + cell + i * pitch + cell / 2
  const width = 2 * GAP + headerW + cols * pitch
  const height = 2 * GAP + cell + rows * pitch

  // Thread geometry: full polyline drawn once, revealed via dash offset so it grows smoothly.
  const pts = path.map((p) => [cx(p.j), cy(p.i)] as const)
  const segLen: number[] = []
  for (let k = 1; k < pts.length; k++) segLen.push(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]))
  const totalLen = segLen.reduce((s, l) => s + l, 0)
  const visibleLen = segLen.slice(0, Math.max(0, trace - 1)).reduce((s, l) => s + l, 0)

  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!focus || !gridRef.current) return
    const el = gridRef.current.querySelector<HTMLElement>(`[data-cell="${focus.i},${focus.j}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focus])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    if (e.key === 'Escape') return onFocus(null)
    const d = move[e.key]
    if (!d) return
    e.preventDefault()
    const base = focus ?? (current ? { i: current.i, j: current.j } : { i: 0, j: 0 })
    onFocus({
      i: Math.max(0, Math.min(rows - 1, base.i + d[0])),
      j: Math.max(0, Math.min(cols - 1, base.j + d[1])),
    })
  }

  const rowLabel = (i: number) => {
    if (isKnapsack) {
      if (i === 0) return <span className="text-ink-soft">∅</span>
      const it = inputs.items[i - 1]
      return (
        <span className="tabular">
          <span className="text-ink-soft">w</span>
          {it.w} <span className="text-ink-soft">v</span>
          {it.v}
        </span>
      )
    }
    const a = inputs.strings[run.kind].a
    return i === 0 ? <span className="text-ink-soft">ε</span> : a[i - 1]
  }
  const colLabel = (j: number) => {
    if (isKnapsack) return j
    const b = inputs.strings[run.kind].b
    return j === 0 ? <span className="text-ink-soft">ε</span> : b[j - 1]
  }

  return (
    <div ref={wrapRef} className="w-full overflow-x-auto pb-1">
      <div
        ref={gridRef}
        role="grid"
        tabIndex={0}
        aria-label="dynamic programming table"
        aria-rowcount={rows + 1}
        aria-colcount={cols + 1}
        onKeyDown={onKeyDown}
        onMouseLeave={() => onFocus(null)}
        className="relative grid rounded-sm bg-taupe outline-none ring-offset-2 ring-offset-linen focus-visible:ring-2 focus-visible:ring-walnut"
        style={{
          width,
          gap: GAP,
          padding: GAP,
          gridTemplateColumns: `${headerW}px repeat(${cols}, ${cell}px)`,
          gridAutoRows: `${cell}px`,
          fontSize: cell < 30 ? 11 : 13,
        }}
      >
        <div role="columnheader" className="grid place-items-center bg-linen-deep font-mono text-[10px] text-ink-soft">
          i╲j
        </div>
        {Array.from({ length: cols }, (_, j) => (
          <div
            key={`c${j}`}
            role="columnheader"
            className={`grid place-items-center bg-linen-deep font-mono tabular ${
              litCols.has(j) ? 'font-medium text-crimson' : current?.j === j ? 'font-medium text-ink' : 'text-ink-soft'
            }`}
          >
            {colLabel(j)}
          </div>
        ))}
        {table.map((row, i) => (
          <Fragment key={`r${i}`}>
            <div
              role="rowheader"
              className={`grid place-items-center bg-linen-deep font-mono text-[11px] ${
                litRows.has(i) ? 'font-medium text-crimson' : current?.i === i ? 'font-medium text-ink' : 'text-ink-soft'
              }`}
            >
              {rowLabel(i)}
            </div>
            {row.map((value, j) => {
              const filled = order[i][j] <= step
              const isCurrent = current?.i === i && current?.j === j
              const dep = current?.deps.some((d) => d.i === i && d.j === j)
              const isWinner = cellsEqual(winnerDep, { i, j })
              const isFocus = cellsEqual(focus, { i, j })
              const style = filled ? tint(value, maxValue) : { background: 'var(--color-linen)', color: 'transparent' }
              const outline = isCurrent
                ? '2px solid var(--color-ink)'
                : isWinner
                  ? '2px solid var(--color-taupe-deep)'
                  : dep
                    ? '2px dashed var(--color-taupe-deep)'
                    : isFocus
                      ? '2px solid var(--color-ink-soft)'
                      : 'none'
              return (
                <div
                  key={j}
                  role="gridcell"
                  data-cell={`${i},${j}`}
                  aria-label={filled ? `dp[${i}][${j}] = ${value}` : `dp[${i}][${j}] not yet filled`}
                  aria-selected={isFocus || undefined}
                  onMouseEnter={() => onFocus({ i, j })}
                  onClick={() => onFocus({ i, j })}
                  className={`relative grid cursor-crosshair place-items-center font-mono tabular transition-[background-color,color] duration-200 ${
                    isCurrent ? 'z-10 shadow-[0_2px_10px_rgba(43,33,24,0.35)]' : ''
                  } ${dep || isWinner || isFocus ? 'z-[5]' : ''}`}
                  style={{ ...style, outline, outlineOffset: -1 }}
                >
                  {filled ? value : ''}
                  {inPath.has(`${i},${j}`) && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[2px] ring-2 ring-inset ring-crimson/70"
                    />
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20 overflow-visible"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {trace >= 0 && totalLen > 0 && (
            <polyline
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="var(--color-crimson)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={totalLen}
              strokeDashoffset={totalLen - visibleLen}
              style={{ transition: 'stroke-dashoffset 240ms linear' }}
            />
          )}
          {shown.map((p, k) => (
            <circle key={k} cx={cx(p.j)} cy={cy(p.i)} r={cell < 30 ? 3 : 4} fill="var(--color-crimson)" />
          ))}
        </svg>
      </div>
    </div>
  )
}
