import { useEffect, useMemo, useReducer } from 'react'
import { initialState, reducer, SPEED_MS, TRACE_MS, type AnyRun } from './loom'

/** Fill order per cell: 0 for pre-filled base cases, k for the k-th event. */
export function fillOrder(run: AnyRun): number[][] {
  const { table, events } = run
  const order = table.map((row) => row.map(() => 0))
  events.forEach((ev, k) => {
    order[ev.i][ev.j] = k + 1
  })
  return order
}

export function useLoom() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState())

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

  const order = useMemo(() => fillOrder(state.run), [state.run])
  const maxValue = useMemo(() => Math.max(0, ...state.run.table.flat()), [state.run])

  return { state, dispatch, order, maxValue }
}
