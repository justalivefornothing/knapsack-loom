import type { Dispatch } from 'react'
import type { Action, LoomState, Speed } from '../state/loom'
import { Button, IconButton, Switch } from './ui'

interface Props {
  state: LoomState
  dispatch: Dispatch<Action>
}

const SPEEDS: Speed[] = ['slow', 'normal', 'fast']

export default function Controls({ state, dispatch }: Props) {
  const total = state.run.events.length
  const done = state.step >= total
  const tracing = state.trace >= 0
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="fill animation">
        <IconButton label="rewind to empty table" onClick={() => dispatch({ type: 'reset' })} disabled={state.step === 0}>
          <Glyph d="M3 2v10M12 2 5 7l7 5z" />
        </IconButton>
        <IconButton label="step back" onClick={() => dispatch({ type: 'stepBy', delta: -1 })} disabled={state.step === 0}>
          <Glyph d="M10 2 4 7l6 5z" />
        </IconButton>
        <Button
          variant="primary"
          className="w-24"
          onClick={() => dispatch({ type: state.playing ? 'pause' : 'play' })}
          aria-label={state.playing ? 'pause' : done ? 'replay the fill' : 'play the fill'}
        >
          {state.playing ? (
            <>
              <Glyph d="M4 2v10M10 2v10" /> Pause
            </>
          ) : (
            <>
              <Glyph d="M3 2l9 5-9 5z" filled /> {done ? 'Replay' : 'Weave'}
            </>
          )}
        </Button>
        <IconButton label="step forward" onClick={() => dispatch({ type: 'stepBy', delta: 1 })} disabled={done}>
          <Glyph d="M4 2l6 5-6 5z" />
        </IconButton>
        <IconButton label="finish the fill" onClick={() => dispatch({ type: 'finish' })} disabled={done}>
          <Glyph d="M11 2v10M2 2l7 5-7 5z" />
        </IconButton>
      </div>

      <div className="flex items-center rounded-md border border-taupe p-0.5" role="radiogroup" aria-label="speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={state.speed === s}
            onClick={() => dispatch({ type: 'speed', speed: s })}
            className={`h-7 rounded px-2 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-walnut ${
              state.speed === s ? 'bg-walnut text-oat' : 'text-ink-soft hover:bg-linen-deep hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Button
        variant="thread"
        onClick={() => dispatch({ type: 'trace' })}
        disabled={tracing && state.tracing}
        className={done && !tracing && !state.playing ? 'animate-pulse' : ''}
        title={done ? 'Walk the reconstruction back from the corner cell' : 'Finishes the fill, then walks back from the corner'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 12 8 8 5 5 2 2" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        {tracing ? 'Retrace' : 'Trace'}
      </Button>

      <span className="ml-auto font-mono text-xs text-ink-soft tabular" aria-live="polite">
        {state.step} / {total} cells
      </span>

      {state.run.kind === 'knapsack' && (
        <div className="basis-full sm:basis-auto">
          <Switch checked={state.rolling} onChange={(rolling) => dispatch({ type: 'rolling', rolling })} label="Rolling 1-D array" />
        </div>
      )}
    </div>
  )
}

function Glyph({ d, filled }: { d: string; filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}
