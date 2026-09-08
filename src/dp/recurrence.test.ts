import { describe, expect, it } from 'vitest'
import { knapsack } from './knapsack'
import { editDistance } from './editDistance'
import { lcs } from './lcs'
import { formatEvent, formatEventLine, formulaFor } from './recurrence'
import { hashSeed, mulberry32, randomKnapsack, randomStrings, shuffleItems } from './random'

describe('recurrence text', () => {
  it('spells out a max-of-two knapsack cell with substituted values', () => {
    const r = knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)
    const ev = r.events.find((e) => e.i === 2 && e.j === 7)!
    expect(formatEvent(ev)).toEqual({
      lhs: 'dp[2][7]',
      symbolic: 'max(dp[1][7], dp[1][7 − 3] + 4)',
      substituted: 'max(1, 1 + 4)',
      result: '5',
    })
    expect(formatEventLine(ev)).toBe('dp[2][7] = max(dp[1][7], dp[1][7 − 3] + 4) = max(1, 1 + 4) = 5')
  })

  it('collapses copy events and drops redundant equal steps', () => {
    const r = knapsack([5], [9], 7)
    expect(formatEventLine(r.events.find((e) => e.j === 2)!)).toBe('dp[1][2] = dp[0][2] = 0')
    const ed = editDistance('aa', 'aa')
    expect(formatEventLine(ed.events[0])).toBe('dp[1][1] = dp[0][0] = 0')
    const l = lcs('a', 'a')
    expect(formatEventLine(l.events[0])).toBe('dp[1][1] = dp[0][0] + 1 = 0 + 1 = 1')
  })

  it('renders a min-of-three edit distance cell', () => {
    const ed = editDistance('kitten', 'sitting')
    expect(formatEventLine(ed.events[0])).toBe(
      'dp[1][1] = min(dp[0][0] + 1, dp[0][1] + 1, dp[1][0] + 1) = min(0 + 1, 1 + 1, 1 + 1) = 1',
    )
  })

  it('has a two-case formula for every problem', () => {
    expect(formulaFor('knapsack')).toHaveLength(2)
    expect(formulaFor('knapsack', true)[1]).toContain('dp[i][j − wᵢ]')
    expect(formulaFor('edit')[1]).toContain('min')
    expect(formulaFor('lcs')[1]).toContain('max')
  })
})

describe('seeded randomness', () => {
  it('is deterministic per seed', () => {
    expect(hashSeed('loom')).toBe(hashSeed('loom'))
    expect(hashSeed('loom')).not.toBe(hashSeed('warp'))
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(randomKnapsack('7')).toEqual(randomKnapsack('7'))
    expect(randomStrings('7')).toEqual(randomStrings('7'))
  })

  it('produces well-formed instances', () => {
    for (const seed of ['a', 'b', 'c', 'thread', '2026']) {
      const k = randomKnapsack(seed, 6)
      expect(k.weights).toHaveLength(6)
      expect(k.values).toHaveLength(6)
      expect(k.weights.every((w) => w >= 1)).toBe(true)
      expect(k.values.every((v) => v >= 1)).toBe(true)
      expect(k.capacity).toBeGreaterThanOrEqual(3)
      const s = randomStrings(seed)
      expect(s.a.length).toBeGreaterThan(0)
      expect(s.b.length).toBeGreaterThan(0)
    }
  })

  it('shuffles weights and values as pairs', () => {
    const { weights, values } = shuffleItems([1, 3, 4, 5], [1, 4, 5, 7], 'x')
    const pairs = weights.map((w, k) => `${w}:${values[k]}`).sort()
    expect(pairs).toEqual(['1:1', '3:4', '4:5', '5:7'])
  })
})
