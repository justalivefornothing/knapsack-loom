import type { Dispatch } from 'react'
import { LIMITS, type Action, type Inputs } from '../state/loom'
import { Button, IconButton, Label, Panel, Switch, TextInput } from './ui'

interface Props {
  inputs: Inputs
  dispatch: Dispatch<Action>
}

export default function InputsPanel({ inputs, dispatch }: Props) {
  const isKnapsack = inputs.problem === 'knapsack'
  return (
    <Panel
      title={isKnapsack ? 'Items & capacity' : 'Strings'}
      aside={isKnapsack ? `${inputs.items.length} / ${LIMITS.items} items` : `≤ ${LIMITS.string} chars each`}
    >
      {isKnapsack ? <KnapsackInputs inputs={inputs} dispatch={dispatch} /> : <StringInputs inputs={inputs} dispatch={dispatch} />}

      <div className="mt-4 border-t border-taupe/50 pt-3">
        <Label htmlFor="seed">Seed</Label>
        <div className="mt-1 flex gap-2">
          <TextInput
            id="seed"
            value={inputs.seed}
            onChange={(e) => dispatch({ type: 'seed', seed: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'generate' })}
            placeholder="any text"
            spellCheck={false}
          />
          <Button variant="primary" onClick={() => dispatch({ type: 'generate' })} className="shrink-0">
            Generate
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">Same seed, same instance — deterministic PRNG.</p>
      </div>
    </Panel>
  )
}

function KnapsackInputs({ inputs, dispatch }: Props) {
  const setItems = (items: Inputs['items']) => dispatch({ type: 'items', items })
  const update = (k: number, key: 'w' | 'v', raw: string) => {
    const n = raw === '' ? 0 : Number(raw)
    if (Number.isNaN(n)) return
    setItems(inputs.items.map((it, idx) => (idx === k ? { ...it, [key]: n } : it)))
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1.4rem_1fr_1fr_2.25rem] items-center gap-x-2 gap-y-1.5">
        <span className="font-mono text-[11px] text-ink-soft">#</span>
        <Label>weight</Label>
        <Label>value</Label>
        <span />
        {inputs.items.map((it, k) => (
          <div key={k} className="contents">
            <span className="font-mono text-xs text-ink-soft tabular">{k + 1}</span>
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={LIMITS.weight}
              aria-label={`item ${k + 1} weight`}
              value={it.w}
              onChange={(e) => update(k, 'w', e.target.value)}
            />
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              max={LIMITS.value}
              aria-label={`item ${k + 1} value`}
              value={it.v}
              onChange={(e) => update(k, 'v', e.target.value)}
            />
            <IconButton
              label={`remove item ${k + 1}`}
              disabled={inputs.items.length <= 1}
              onClick={() => setItems(inputs.items.filter((_, idx) => idx !== k))}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </IconButton>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={inputs.items.length >= LIMITS.items}
          onClick={() => setItems([...inputs.items, { w: 2, v: 3 }])}
        >
          + Add item
        </Button>
        <Button onClick={() => dispatch({ type: 'shuffle' })} disabled={inputs.items.length < 2} title="Reorder the items — the answer does not change">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 3h3l6 8h3M1 11h3l1.5-2M10 3h3M11 1l2 2-2 2M11 9l2 2-2 2" />
          </svg>
          Shuffle items
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3 pt-1">
        <div>
          <Label htmlFor="capacity">Capacity W</Label>
          <TextInput
            id="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.capacity}
            className="mt-1"
            value={inputs.capacity}
            onChange={(e) => e.target.value !== '' && dispatch({ type: 'capacity', capacity: Number(e.target.value) })}
          />
        </div>
        <div className="pb-2">
          <Switch
            checked={inputs.unbounded}
            onChange={(unbounded) => dispatch({ type: 'unbounded', unbounded })}
            label="Unbounded"
          />
        </div>
      </div>
    </div>
  )
}

function StringInputs({ inputs, dispatch }: Props) {
  const key = inputs.problem === 'lcs' ? 'lcs' : 'edit'
  const { a, b } = inputs.strings[key]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {(['a', 'b'] as const).map((which) => (
        <div key={which}>
          <Label htmlFor={`str-${which}`}>String {which} {which === 'a' ? '(rows)' : '(columns)'}</Label>
          <TextInput
            id={`str-${which}`}
            className="mt-1 tracking-[0.15em]"
            value={which === 'a' ? a : b}
            maxLength={LIMITS.string}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => dispatch({ type: 'strings', which, value: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}
