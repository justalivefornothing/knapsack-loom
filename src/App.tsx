import { useEffect, useState } from 'react'
import Controls from './components/Controls'
import DpGrid from './components/DpGrid'
import InputsPanel from './components/InputsPanel'
import { Panel } from './components/ui'
import type { ProblemId } from './dp/recurrence'
import type { Cell } from './dp/types'
import { useLoom } from './state/useLoom'

const PROBLEMS: { id: ProblemId; label: string; hint: string }[] = [
  { id: 'knapsack', label: '0/1 Knapsack', hint: 'rows are items, columns are capacity' },
  { id: 'edit', label: 'Edit distance', hint: 'rows are prefixes of a, columns prefixes of b' },
  { id: 'lcs', label: 'Longest common subsequence', hint: 'rows are prefixes of a, columns prefixes of b' },
]

export default function App() {
  const { state, dispatch, order, maxValue } = useLoom()
  const [focus, setFocus] = useState<Cell | null>(null)
  const { run, inputs } = state
  const problem = PROBLEMS.find((p) => p.id === inputs.problem)!

  // Global shortcuts; ignored while typing or when the grid itself is handling arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, button, [role="grid"], [role="switch"]')) return
      if (e.key === ' ') {
        e.preventDefault()
        dispatch({ type: state.playing ? 'pause' : 'play' })
      } else if (e.key === 'ArrowRight') dispatch({ type: 'stepBy', delta: 1 })
      else if (e.key === 'ArrowLeft') dispatch({ type: 'stepBy', delta: -1 })
      else if (e.key === 't' || e.key === 'T') dispatch({ type: 'trace' })
      else if (e.key === 'r' || e.key === 'R') dispatch({ type: 'reset' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, state.playing])

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h1 className="font-slab text-3xl font-bold leading-tight text-walnut sm:text-4xl">
              Knapsack <span className="text-crimson">Loom</span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Dynamic programming tables woven cell by cell, with the backtrace pulled through the grid as a
              single crimson thread.
            </p>
          </div>
          <nav role="tablist" aria-label="problem" className="flex flex-wrap gap-1 rounded-lg border border-taupe/70 bg-oat/60 p-1">
            {PROBLEMS.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={inputs.problem === p.id}
                onClick={() => {
                  setFocus(null)
                  dispatch({ type: 'problem', problem: p.id })
                }}
                className={`h-8 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-walnut ${
                  inputs.problem === p.id ? 'bg-walnut text-oat shadow-sm' : 'text-ink-soft hover:bg-linen-deep hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <Panel title="Table" aside={problem.hint}>
            <Controls state={state} dispatch={dispatch} />
            <div className="mt-4">
              <DpGrid
                run={run}
                inputs={inputs}
                step={state.step}
                order={order}
                maxValue={maxValue}
                trace={state.trace}
                focus={focus}
                onFocus={setFocus}
              />
            </div>
            <Legend maxValue={maxValue} />
          </Panel>

        </div>

        <aside className="space-y-4">
          <InputsPanel inputs={inputs} dispatch={dispatch} />
          <Panel title="Keys">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs text-ink-soft">
              {[
                ['Space', 'weave / pause'],
                ['← →', 'step one cell'],
                ['T', 'trace the thread'],
                ['R', 'rewind'],
                ['Tab → arrows', 'walk the table, reading each recurrence'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>
                    <kbd className="rounded border border-taupe bg-oat px-1.5 py-0.5 font-mono text-[11px] text-ink">{k}</kbd>
                  </dt>
                  <dd className="self-center">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </aside>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-taupe/50 pt-4 text-xs text-ink-soft">
        <span>Every number in the table comes from a generator that also emits the recurrence that produced it.</span>
        <span>MIT · built with React, TypeScript and Tailwind</span>
      </footer>
    </main>
  )
}

function Legend({ maxValue }: { maxValue: number }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-soft">
      <div className="flex items-center gap-2">
        <span className="font-mono tabular">0</span>
        <span
          aria-hidden
          className="h-2.5 w-24 rounded-sm border border-taupe/60"
          style={{ background: 'linear-gradient(90deg, var(--color-oat), var(--color-walnut))' }}
        />
        <span className="font-mono tabular">{maxValue}</span>
        <span>cell value</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-3 rounded-[2px] bg-oat outline outline-2 -outline-offset-1 outline-ink" />
        shuttle
      </div>
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-3 rounded-[2px] bg-oat outline-2 outline-dashed -outline-offset-1 outline-taupe-deep" />
        dependency
      </div>
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-3 rounded-[2px] bg-oat outline outline-2 -outline-offset-1 outline-taupe-deep" />
        winning term
      </div>
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-0.5 w-5 rounded bg-crimson" />
        backtrace thread
      </div>
    </div>
  )
}
