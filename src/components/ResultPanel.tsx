import type { AnyRun, Inputs } from '../state/loom'
import { Panel } from './ui'

interface Props {
  run: AnyRun
  inputs: Inputs
  step: number
  trace: number
}

const HEADLINE = { knapsack: 'Best value', edit: 'Edit distance', lcs: 'LCS length' } as const

export default function ResultPanel({ run, inputs, step, trace }: Props) {
  const done = step >= run.events.length
  const hops = trace >= 0 ? run.path.slice(0, trace) : []
  const traced = trace >= run.path.length

  return (
    <Panel
      title="Answer"
      aside={
        done ? (
          traced ? (
            <span className="text-crimson">thread complete</span>
          ) : trace >= 0 ? (
            'tracing…'
          ) : (
            'press Trace to reconstruct'
          )
        ) : (
          'weaving…'
        )
      }
    >
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase">{HEADLINE[run.kind]}</span>
        <span className={`font-slab text-3xl font-bold tabular transition-colors ${done ? 'text-walnut' : 'text-taupe'}`}>
          {done ? run.best : '·'}
        </span>
      </div>
      <div className="mt-3">
        {run.kind === 'knapsack' && <KnapsackResult run={run} inputs={inputs} hops={hops} />}
        {run.kind === 'edit' && <EditResult run={run} hops={hops} />}
        {run.kind === 'lcs' && <LcsResult run={run} inputs={inputs} hops={hops} />}
      </div>
    </Panel>
  )
}

type Hops = AnyRun['path']

function KnapsackResult({ run, inputs, hops }: { run: Extract<AnyRun, { kind: 'knapsack' }>; inputs: Inputs; hops: Hops }) {
  const counts = new Map<number, number>()
  for (const h of hops) if (h.kind === 'take') counts.set(h.i - 1, (counts.get(h.i - 1) ?? 0) + 1)
  const weight = [...counts].reduce((s, [k, c]) => s + inputs.items[k].w * c, 0)
  const value = [...counts].reduce((s, [k, c]) => s + inputs.items[k].v * c, 0)
  return (
    <div className="space-y-2.5">
      <ul className="flex flex-wrap gap-1.5" aria-label="items">
        {inputs.items.map((it, k) => {
          const c = counts.get(k) ?? 0
          return (
            <li
              key={k}
              className={`rounded-md border px-2 py-1 font-mono text-xs tabular transition-colors duration-300 ${
                c > 0 ? 'border-crimson bg-crimson text-oat shadow-[0_1px_6px_rgba(168,38,43,0.35)]' : 'border-taupe bg-oat text-ink-soft'
              }`}
            >
              <span className="opacity-80">#{k + 1}</span> w{it.w} v{it.v}
              {c > 1 && <span className="ml-1 font-semibold">×{c}</span>}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-ink-soft tabular">
        {hops.length === 0 ? (
          'Chosen items light up as the thread passes their rows.'
        ) : (
          <>
            Packed weight <b className="text-ink">{weight}</b> / {inputs.capacity} · value <b className="text-ink">{value}</b>
            {run.chosen.length === 0 && hops.length === run.path.length && ' — nothing fits'}
          </>
        )}
      </p>
    </div>
  )
}

const MARK = { match: '│', sub: '≠', ins: '+', del: '−' } as const

function EditResult({ run, hops }: { run: Extract<AnyRun, { kind: 'edit' }>; hops: Hops }) {
  const n = run.alignment.length
  // Hops walk from the corner, i.e. from the end of the alignment backwards.
  const revealedFrom = n - Math.min(n, Math.max(0, hops.length))
  if (n === 0) return <p className="text-xs text-ink-soft">Both strings are empty — nothing to align.</p>
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="inline-grid gap-x-0.5 font-mono text-sm" style={{ gridTemplateColumns: `repeat(${n}, 1.4rem)` }}>
          {run.alignment.map((s, k) => (
            <Col key={`a${k}`} on={k >= revealedFrom} kind={s.kind}>
              {s.a ?? '·'}
            </Col>
          ))}
          {run.alignment.map((s, k) => (
            <span key={`m${k}`} className={`text-center text-xs ${k >= revealedFrom ? (s.kind === 'match' ? 'text-taupe-deep' : 'text-crimson') : 'text-taupe/60'}`}>
              {MARK[s.kind]}
            </span>
          ))}
          {run.alignment.map((s, k) => (
            <Col key={`b${k}`} on={k >= revealedFrom} kind={s.kind}>
              {s.b ?? '·'}
            </Col>
          ))}
        </div>
      </div>
      <p className="text-xs text-ink-soft">
        <span className="text-crimson">≠</span> substitute · <span className="text-crimson">+</span> insert ·{' '}
        <span className="text-crimson">−</span> delete · │ keep
      </p>
    </div>
  )
}

function Col({ on, kind, children }: { on: boolean; kind: keyof typeof MARK; children: string }) {
  return (
    <span
      className={`grid h-6 place-items-center rounded-sm transition-colors duration-300 ${
        !on ? 'text-taupe' : kind === 'match' ? 'bg-linen-deep text-ink' : 'bg-crimson text-oat'
      }`}
    >
      {children}
    </span>
  )
}

function LcsResult({ run, inputs, hops }: { run: Extract<AnyRun, { kind: 'lcs' }>; inputs: Inputs; hops: Hops }) {
  const { a, b } = inputs.strings.lcs
  const matches = hops.filter((h) => h.kind === 'match')
  const litA = new Set(matches.map((h) => h.i - 1))
  const litB = new Set(matches.map((h) => h.j - 1))
  const revealed = run.sequence.slice(run.sequence.length - matches.length)
  return (
    <div className="space-y-2">
      <Chars name="a" s={a} lit={litA} />
      <Chars name="b" s={b} lit={litB} />
      <p className="text-xs text-ink-soft">
        Subsequence:{' '}
        <span className="font-mono text-sm tracking-[0.2em] text-crimson">
          {revealed || (hops.length === run.path.length ? 'ε' : '…')}
        </span>
      </p>
    </div>
  )
}

function Chars({ name, s, lit }: { name: string; s: string; lit: Set<number> }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="w-3 text-xs text-ink-soft">{name}</span>
      <div className="flex flex-wrap gap-0.5">
        {s.split('').map((c, k) => (
          <span
            key={k}
            className={`grid h-6 w-6 place-items-center rounded-sm transition-colors duration-300 ${
              lit.has(k) ? 'bg-crimson text-oat' : 'bg-linen-deep text-ink-soft'
            }`}
          >
            {c}
          </span>
        ))}
        {s.length === 0 && <span className="text-xs text-taupe-deep">ε</span>}
      </div>
    </div>
  )
}
