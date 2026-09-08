import { describe, expect, it } from 'vitest'
import { editDistance, editDistanceSteps } from './editDistance'
import { lcs, lcsSteps } from './lcs'
import { countSteps } from './types'

describe('edit distance', () => {
  const r = editDistance('kitten', 'sitting')

  it('computes the Levenshtein distance', () => {
    expect(r.best).toBe(3)
  })

  it('pre-fills the base cases and yields |a|·|b| events', () => {
    expect(r.table[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(r.table.map((row) => row[0])).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(countSteps(editDistanceSteps('kitten', 'sitting'))).toBe(42)
  })

  it('reconstructs an alignment with exactly `best` edits', () => {
    const edits = r.alignment.filter((s) => s.kind !== 'match')
    expect(edits.length).toBe(3)
    expect(r.alignment.map((s) => s.a ?? '-').join('')).toBe('kitten-')
    expect(r.alignment.map((s) => s.b ?? '-').join('')).toBe('sitting')
    expect(r.alignment.map((s) => s.kind)).toEqual(['sub', 'match', 'match', 'match', 'sub', 'match', 'ins'])
  })

  it('walks the path from the corner to (0, 0)', () => {
    expect(r.path[0]).toMatchObject({ i: 6, j: 7, kind: 'ins' })
    expect(r.path.at(-1)).toMatchObject({ i: 0, j: 0, kind: 'start' })
  })

  it('handles empty strings', () => {
    expect(editDistance('', 'abc').best).toBe(3)
    expect(editDistance('abc', '').alignment.map((s) => s.kind)).toEqual(['del', 'del', 'del'])
    expect(editDistance('', '').best).toBe(0)
  })

  it('emits min-of-three events with matching dependencies', () => {
    const ev = r.events.find((e) => e.i === 1 && e.j === 1)!
    expect(ev.op).toBe('min')
    expect(ev.value).toBe(1)
    expect(ev.deps).toEqual([
      { i: 0, j: 0 },
      { i: 0, j: 1 },
      { i: 1, j: 0 },
    ])
  })
})

describe('longest common subsequence', () => {
  it('matches the spec answer', () => {
    expect(lcs('ABCBDAB', 'BDCABA').best).toBe(4)
    expect(lcs('ABCBDAB', 'BDCABA').sequence.length).toBe(4)
  })

  it('returns a genuine common subsequence', () => {
    const { sequence } = lcs('ABCBDAB', 'BDCABA')
    const isSubsequence = (s: string, of: string) => {
      let k = 0
      for (const c of of) if (c === s[k]) k++
      return k === s.length
    }
    expect(isSubsequence(sequence, 'ABCBDAB')).toBe(true)
    expect(isSubsequence(sequence, 'BDCABA')).toBe(true)
  })

  it('yields |a|·|b| events over an all-zero base', () => {
    expect(countSteps(lcsSteps('ABCBDAB', 'BDCABA'))).toBe(42)
    const r = lcs('ACGT', 'TGCA')
    expect(r.table[0]).toEqual([0, 0, 0, 0, 0])
    expect(r.best).toBe(1)
    expect(r.path.at(-1)!.kind).toBe('start')
  })

  it('handles identical and disjoint strings', () => {
    expect(lcs('LOOM', 'LOOM').sequence).toBe('LOOM')
    expect(lcs('AAA', 'BBB').best).toBe(0)
    expect(lcs('AAA', 'BBB').sequence).toBe('')
  })
})
