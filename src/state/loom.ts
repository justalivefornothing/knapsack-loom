import { knapsack, type KnapsackRun } from '../dp/knapsack'
import { editDistance, type EditDistanceRun } from '../dp/editDistance'
import { lcs, type LcsRun } from '../dp/lcs'
import type { ProblemId } from '../dp/recurrence'
import { randomKnapsack, randomStrings, shuffleItems } from '../dp/random'

export interface Item {
  w: number
  v: number
}

export type Speed = 'slow' | 'normal' | 'fast'
export const SPEED_MS: Record<Speed, number> = { slow: 420, normal: 150, fast: 45 }
export const TRACE_MS = 260

export const LIMITS = { items: 8, capacity: 20, weight: 20, value: 30, string: 12 } as const

export interface Inputs {
  problem: ProblemId
  items: Item[]
  capacity: number
  unbounded: boolean
  strings: Record<'edit' | 'lcs', { a: string; b: string }>
  seed: string
}

export type AnyRun =
  | ({ kind: 'knapsack' } & KnapsackRun)
  | ({ kind: 'edit' } & EditDistanceRun)
  | ({ kind: 'lcs' } & LcsRun)

export interface LoomState {
  inputs: Inputs
  run: AnyRun
  /** Number of fill events applied to the visible table. */
  step: number
  playing: boolean
  speed: Speed
  /** -1 while the thread is hidden; otherwise how many path hops are revealed. */
  trace: number
  tracing: boolean
  rolling: boolean
  /** First visit: run the thread automatically once the table has filled. */
  demo: boolean
}

export type Action =
  | { type: 'problem'; problem: ProblemId }
  | { type: 'items'; items: Item[] }
  | { type: 'capacity'; capacity: number }
  | { type: 'unbounded'; unbounded: boolean }
  | { type: 'strings'; which: 'a' | 'b'; value: string }
  | { type: 'seed'; seed: string }
  | { type: 'generate' }
  | { type: 'shuffle' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'stepBy'; delta: number }
  | { type: 'reset' }
  | { type: 'finish' }
  | { type: 'trace' }
  | { type: 'traceTick' }
  | { type: 'speed'; speed: Speed }
  | { type: 'rolling'; rolling: boolean }

export function compute(inputs: Inputs): AnyRun {
  switch (inputs.problem) {
    case 'knapsack':
      return {
        kind: 'knapsack',
        ...knapsack(
          inputs.items.map((it) => it.w),
          inputs.items.map((it) => it.v),
          inputs.capacity,
          { unbounded: inputs.unbounded },
        ),
      }
    case 'edit':
      return { kind: 'edit', ...editDistance(inputs.strings.edit.a, inputs.strings.edit.b) }
    case 'lcs':
      return { kind: 'lcs', ...lcs(inputs.strings.lcs.a, inputs.strings.lcs.b) }
  }
}

export const DEFAULT_INPUTS: Inputs = {
  problem: 'knapsack',
  items: [
    { w: 1, v: 1 },
    { w: 3, v: 4 },
    { w: 4, v: 5 },
    { w: 5, v: 7 },
  ],
  capacity: 7,
  unbounded: false,
  strings: { edit: { a: 'kitten', b: 'sitting' }, lcs: { a: 'ABCBDAB', b: 'BDCABA' } },
  seed: 'loom-1',
}

export function initialState(inputs: Inputs = DEFAULT_INPUTS): LoomState {
  return {
    inputs,
    run: compute(inputs),
    step: 0,
    playing: true,
    speed: 'normal',
    trace: -1,
    tracing: false,
    rolling: false,
    demo: true,
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n) || lo))

/** Apply an input change: recompute the run and rewind the loom. */
function withInputs(state: LoomState, inputs: Inputs): LoomState {
  return { ...state, inputs, run: compute(inputs), step: 0, playing: false, trace: -1, tracing: false, demo: false }
}

export function reducer(state: LoomState, action: Action): LoomState {
  const { inputs, run } = state
  const total = run.events.length
  switch (action.type) {
    case 'problem':
      if (action.problem === inputs.problem) return state
      return { ...withInputs(state, { ...inputs, problem: action.problem }), playing: true }
    case 'items':
      return withInputs(state, {
        ...inputs,
        items: action.items
          .slice(0, LIMITS.items)
          .map((it) => ({ w: clamp(it.w, 1, LIMITS.weight), v: clamp(it.v, 0, LIMITS.value) })),
      })
    case 'capacity':
      return withInputs(state, { ...inputs, capacity: clamp(action.capacity, 1, LIMITS.capacity) })
    case 'unbounded':
      return withInputs(state, { ...inputs, unbounded: action.unbounded })
    case 'strings': {
      const key = inputs.problem === 'lcs' ? 'lcs' : 'edit'
      const value = action.value.slice(0, LIMITS.string)
      return withInputs(state, {
        ...inputs,
        strings: { ...inputs.strings, [key]: { ...inputs.strings[key], [action.which]: value } },
      })
    }
    case 'seed':
      return { ...state, inputs: { ...inputs, seed: action.seed } }
    case 'generate': {
      if (inputs.problem === 'knapsack') {
        const k = randomKnapsack(inputs.seed, 5)
        const items = k.weights.map((w, i) => ({ w, v: k.values[i] }))
        return withInputs(state, { ...inputs, items, capacity: k.capacity })
      }
      const key = inputs.problem
      return withInputs(state, { ...inputs, strings: { ...inputs.strings, [key]: randomStrings(inputs.seed) } })
    }
    case 'shuffle': {
      const s = shuffleItems(
        inputs.items.map((it) => it.w),
        inputs.items.map((it) => it.v),
        `${inputs.seed}:${Date.now()}`,
      )
      const items = s.weights.map((w, i) => ({ w, v: s.values[i] }))
      // Keep the finished state visible so the unchanged answer is obvious.
      const next = withInputs(state, { ...inputs, items })
      return { ...next, step: state.step >= total ? next.run.events.length : 0 }
    }
    case 'play':
      if (state.step >= total) return { ...state, step: 0, playing: true, trace: -1, tracing: false }
      return { ...state, playing: true, trace: -1, tracing: false }
    case 'pause':
      return { ...state, playing: false }
    case 'tick': {
      if (!state.playing) return state
      if (state.step < total) return { ...state, step: state.step + 1 }
      if (state.demo) return { ...state, playing: false, demo: false, trace: 0, tracing: true }
      return { ...state, playing: false }
    }
    case 'stepBy':
      return {
        ...state,
        playing: false,
        trace: -1,
        tracing: false,
        demo: false,
        step: clamp(state.step + action.delta, 0, total),
      }
    case 'reset':
      return { ...state, step: 0, playing: false, trace: -1, tracing: false, demo: false }
    case 'finish':
      return { ...state, step: total, playing: false, demo: false }
    case 'trace':
      return { ...state, step: total, playing: false, demo: false, trace: 0, tracing: true }
    case 'traceTick': {
      if (!state.tracing) return state
      if (state.trace < run.path.length) return { ...state, trace: state.trace + 1 }
      return { ...state, tracing: false }
    }
    case 'speed':
      return { ...state, speed: action.speed }
    case 'rolling':
      return { ...state, rolling: action.rolling }
  }
}
