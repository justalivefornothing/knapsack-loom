# Knapsack Loom — plan

Dynamic programming tables woven cell by cell for 0/1 knapsack, edit distance,
and LCS, with backtracking highlighted as a thread through the grid.

## Goal

A small, polished visualiser that makes the *mechanics* of tabular DP legible:
every cell is filled by a visible shuttle, the recurrence that produced it is
spelled out with the real substituted numbers, and the answer is reconstructed
by walking a crimson thread back through the grid.

## Features (all required)

1. Three DP problems implemented from scratch: 0/1 knapsack (with an unbounded
   toggle), Levenshtein edit distance, longest common subsequence.
2. Editable inputs: item weight/value table + capacity; two strings.
3. Step animation with a shuttle cursor; dependency cells outlined per step.
4. Backtrace mode: reconstruction path + chosen items / alignment / subsequence.
5. Space-optimised view: rolling 1-D array for knapsack showing overwrites.
6. Recurrence panel: formula + substituted values for the hovered cell.
7. Seeded random instance generator + "shuffle items" (order invariance).

## Architecture

```
src/dp/
  types.ts        FillEvent { i, j, value, deps[], terms[], op, choice }, PathStep
  knapsack.ts     knapsackSteps() generator · knapsack() · backtrack
  editDistance.ts editDistanceSteps() · editDistance() · backtrack → alignment
  lcs.ts          lcsSteps() · lcs() · backtrack → subsequence
  recurrence.ts   formatEvent(): recurrence text built from the event's own terms
  random.ts       mulberry32 PRNG, instance generator, seeded shuffle
  *.test.ts       vitest (spec assertions + extras)
src/components/
  App.tsx         problem tabs, layout, animation clock
  InputsPanel     items table / strings / capacity / seed / shuffle
  DpGrid          the woven grid, shuttle, dependency outlines, thread overlay
  RollingArray    1-D knapsack array view with overwrite ghosts
  RecurrencePanel formula + substitution for hovered/current cell
  ResultPanel     chosen items · alignment · subsequence
  Controls        play / step / reset / speed / trace
```

Each DP is a generator yielding fill events over a pre-allocated table whose
base cases are filled up front. The animation precomputes all events, records
the fill order of each cell, and derives the visible table from a step index —
no per-step table copies. The backtrace is a separate pure function over the
finished table.

## Milestones

- [ ] chore: plan, license, scaffold
- [ ] feat: DP core (three generators, backtracks, recurrence formatter) + tests
- [ ] feat: grid, shuttle animation, controls
- [ ] feat: inputs, seeded generator, shuffle
- [ ] feat: backtrace thread, recurrence panel, rolling array view
- [ ] fix/docs: smoke screenshot, readme, publish
