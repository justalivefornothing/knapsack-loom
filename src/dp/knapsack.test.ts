import { describe, expect, it } from 'vitest'
import { knapsack, knapsackSteps } from './knapsack'
import { countSteps } from './types'
import { shuffleItems } from './random'

describe('0/1 knapsack', () => {
  const r = knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)

  it('finds the optimal value and the items that produce it', () => {
    expect(r.best).toBe(9)
    expect(r.chosen).toEqual([1, 2])
  })

  it('pre-allocates an (n+1) × (capacity+1) table and yields one event per interior cell', () => {
    expect(r.table.length).toBe(5)
    expect(r.table[0].length).toBe(8)
    expect(countSteps(knapsackSteps([1, 3, 4, 5], [1, 4, 5, 7], 7))).toBe(28)
  })

  it('reports the base cases as zero and the corner as the answer', () => {
    expect(r.table[0]).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(r.table.map((row) => row[0])).toEqual([0, 0, 0, 0, 0])
    expect(r.table[4][7]).toBe(9)
  })

  it('walks the path from the corner to row 0 with take/skip decisions', () => {
    expect(r.path[0]).toMatchObject({ i: 4, j: 7, kind: 'skip' })
    expect(r.path.map((p) => p.kind)).toEqual(['skip', 'take', 'take', 'skip', 'start'])
    expect(r.path.at(-1)).toMatchObject({ i: 0, j: 0 })
  })

  it('yields events whose terms agree with the table values', () => {
    for (const ev of r.events) {
      expect(ev.terms[ev.winner].value).toBe(ev.value)
      expect(r.table[ev.i][ev.j]).toBe(ev.value)
      for (const d of ev.deps) expect(d.i).toBeLessThanOrEqual(ev.i)
    }
    const take = r.events.find((e) => e.i === 2 && e.j === 7)!
    expect(take.op).toBe('max')
    expect(take.deps).toEqual([
      { i: 1, j: 7 },
      { i: 1, j: 4 },
    ])
    expect(take.choice).toBe('take item 2')
  })

  it('is invariant under item order', () => {
    let permuted = 0
    for (const seed of ['warp', 'weft', 'shuttle', 'heddle', 'bobbin']) {
      const shuffled = shuffleItems([1, 3, 4, 5], [1, 4, 5, 7], seed)
      if (shuffled.weights.join() !== '1,3,4,5') permuted++
      expect(knapsack(shuffled.weights, shuffled.values, 7).best).toBe(9)
    }
    expect(permuted).toBeGreaterThan(0)
  })
})

describe('unbounded knapsack', () => {
  it('matches the spec answer', () => {
    expect(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7, { unbounded: true }).best).toBe(9)
  })

  it('can take the same item repeatedly', () => {
    const r = knapsack([2, 5], [3, 8], 10, { unbounded: true })
    expect(r.best).toBe(16)
    expect(r.chosen).toEqual([1, 1])
    expect(r.table.length).toBe(3)
    expect(countSteps(knapsackSteps([2, 5], [3, 8], 10, { unbounded: true }))).toBe(20)
  })

  it('reads the take dependency from the current row', () => {
    const r = knapsack([2, 5], [3, 8], 10, { unbounded: true })
    const ev = r.events.find((e) => e.i === 1 && e.j === 4)!
    expect(ev.deps).toEqual([
      { i: 0, j: 4 },
      { i: 1, j: 2 },
    ])
  })
})
