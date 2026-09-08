import { useEffect, useMemo, useReducer } from 'react'
import type { ProblemId } from '../dp/recurrence'
import { DEFAULT_INPUTS, initialState, reducer, SPEED_MS, TRACE_MS, type AnyRun } from './loom'

/** Fill order per cell: 0 for pre-filled base cases, k for the k-th event. */
export function fillOrder(run: AnyRun): number[][] {
  const { table, events } = run
  const order = table.map((row) => row.map(() => 0))
  events.forEach((ev, k) => {
    order[ev.i][ev.j] = k + 1
  })
  return order
}

const PROBLEM_IDS: ProblemId[] = ['knapsack', 'edit', 'lcs']

/** Shareable start state: ?p=edit|lcs|knapsack&rolling=1 */
function fromUrl() {
  const q = new URLSearchParams(window.location.search)
  const p = q.get('p') as ProblemId | null
  const state = initialState(p && PROBLEM_IDS.includes(p) ? { ...DEFAULT_INPUTS, problem: p } : DEFAULT_INPUTS)
  return q.get('rolling') === '1' ? { ...state, rolling: true } : state
}

export function useLoom() {
  const [state, dispatch] = useReducer(reducer, undefined, fromUrl)

  useEffect(() => {
    if (!state.playing) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), SPEED_MS[state.speed])
    return () => window.clearInterval(id)
  }, [state.playing, state.speed])

  useEffect(() => {
    if (!state.tracing) return
    const id = window.setInterval(() => dispatch({ type: 'traceTick' }), TRACE_MS)
    return () => window.clearInterval(id)
  }, [state.tracing])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (state.inputs.problem === 'knapsack') q.delete('p')
    else q.set('p', state.inputs.problem)
    if (state.rolling && state.inputs.problem === 'knapsack') q.set('rolling', '1')
    else q.delete('rolling')
    const search = q.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`)
  }, [state.inputs.problem, state.rolling])

  const order = useMemo(() => fillOrder(state.run), [state.run])
  const maxValue = useMemo(() => Math.max(0, ...state.run.table.flat()), [state.run])

  return { state, dispatch, order, maxValue }
}
