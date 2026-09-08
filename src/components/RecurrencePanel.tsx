import type { ReactNode } from 'react'
import { formatEvent, formulaFor } from '../dp/recurrence'
import type { Cell, FillEvent } from '../dp/types'
import type { AnyRun, Inputs } from '../state/loom'
import { Panel } from './ui'

interface Props {
  run: AnyRun
  inputs: Inputs
  step: number
  order: number[][]
  focus: Cell | null
}

export default function RecurrencePanel({ run, inputs, step, order, focus }: Props) {
  const current = step > 0 ? run.events[step - 1] : null
  const cell = focus ?? (current ? { i: current.i, j: current.j } : null)
  const formula = formulaFor(inputs.problem, inputs.unbounded)

  let body: ReactNode
  if (!cell) {
    body = <Empty>Hover a cell — or press Weave — to see the recurrence evaluated with real numbers.</Empty>
  } else if (order[cell.i][cell.j] === 0) {
    body = <BaseCase run={run} cell={cell} />
  } else if (order[cell.i][cell.j] > step) {
    body = (
      <Empty>
        <code className="font-mono text-ink">dp[{cell.i}][{cell.j}]</code> has not been woven yet.
      </Empty>
    )
  } else {
    body = <Evaluated ev={run.events[order[cell.i][cell.j] - 1]} live={focus === null} />
  }

  return (
    <Panel title="Recurrence" aside={cell ? <code className="font-mono">dp[{cell.i}][{cell.j}]</code> : undefined}>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-md bg-linen-deep/70 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-ink-soft">
        {formula.map((c) => (
          <div key={c.when} className="contents">
            <dt className="break-words text-ink">{c.expr}</dt>
            <dd className="text-right italic">{c.when}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 min-h-[7.5rem]">{body}</div>
    </Panel>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-soft">{children}</p>
}

function BaseCase({ run, cell }: { run: AnyRun; cell: Cell }) {
  const value = run.table[cell.i][cell.j]
  const why =
    run.kind === 'knapsack'
      ? cell.i === 0
        ? 'no items yet, so nothing can be packed'
        : 'zero capacity holds nothing'
      : run.kind === 'edit'
        ? cell.i === 0
          ? `turning the empty prefix into ${cell.j} character${cell.j === 1 ? '' : 's'} takes ${cell.j} insertion${cell.j === 1 ? '' : 's'}`
          : `erasing ${cell.i} character${cell.i === 1 ? '' : 's'} takes ${cell.i} deletion${cell.i === 1 ? '' : 's'}`
        : 'an empty prefix shares nothing with anything'
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-sm text-ink tabular">
        dp[{cell.i}][{cell.j}] = {value}
      </p>
      <p className="text-sm text-ink-soft">
        <span className="font-semibold text-ink">Base case</span> — {why}.
      </p>
    </div>
  )
}

function Evaluated({ ev, live }: { ev: FillEvent; live: boolean }) {
  const r = formatEvent(ev)
  const showSub = r.substituted !== r.symbolic && r.substituted !== r.result
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-ink-soft">
        {live ? 'Shuttle at' : 'Hovered'} <code className="font-mono text-ink">{r.lhs}</code> · {ev.note}
      </p>
      <div className="font-mono text-sm leading-relaxed tabular">
        <div className="text-ink">
          {r.lhs} = <span className="text-walnut">{r.symbolic}</span>
        </div>
        {showSub && <div className="pl-3 text-ink-soft">= {r.substituted}</div>}
        <div className="pl-3 font-medium text-ink">
          = {r.result} <span className="text-ink-soft">→ {ev.choice}</span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="candidate terms">
        {ev.terms.map((t, k) => (
          <li
            key={k}
            className={`rounded border px-2 py-1 text-xs tabular ${
              k === ev.winner ? 'border-walnut bg-walnut text-oat' : 'border-taupe bg-oat text-ink-soft'
            }`}
          >
            <span className="font-medium">{t.label}</span>
            <span className={`ml-1.5 font-mono ${k === ev.winner ? 'text-oat/90' : ''}`}>{t.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
