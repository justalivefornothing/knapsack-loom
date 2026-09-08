/** FNV-1a hash of a seed string into a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: small, fast, deterministic PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

export interface KnapsackInstance {
  weights: number[]
  values: number[]
  capacity: number
}

export function randomKnapsack(seed: string, n = 5): KnapsackInstance {
  const rand = mulberry32(hashSeed(seed))
  const weights = Array.from({ length: n }, () => int(rand, 1, 7))
  const values = weights.map((w) => Math.max(1, w + int(rand, -2, 4)))
  const total = weights.reduce((s, w) => s + w, 0)
  const capacity = Math.max(3, Math.min(14, Math.round(total * (0.4 + rand() * 0.25))))
  return { weights, values, capacity }
}

export function randomString(rand: () => number, length: number, alphabet: string): string {
  return Array.from({ length }, () => alphabet[Math.floor(rand() * alphabet.length)]).join('')
}

export function randomStrings(seed: string): { a: string; b: string } {
  const rand = mulberry32(hashSeed(seed))
  const alphabet = rand() < 0.5 ? 'ACGT' : 'LOOMWARP'
  const a = randomString(rand, int(rand, 5, 8), alphabet)
  // Mutate a copy of `a` so the two strings share structure worth aligning.
  const chars = a.split('')
  const edits = int(rand, 1, 3)
  for (let k = 0; k < edits; k++) {
    const pos = Math.floor(rand() * chars.length)
    const roll = rand()
    if (roll < 0.4) chars[pos] = alphabet[Math.floor(rand() * alphabet.length)]
    else if (roll < 0.7) chars.splice(pos, 1)
    else chars.splice(pos, 0, alphabet[Math.floor(rand() * alphabet.length)])
  }
  return { a, b: chars.join('') || a.slice(1) }
}

/** Seeded Fisher–Yates permutation applied to weights and values together. */
export function shuffleItems(weights: number[], values: number[], seed: string): { weights: number[]; values: number[] } {
  const rand = mulberry32(hashSeed(seed))
  const order = weights.map((_, k) => k)
  for (let k = order.length - 1; k > 0; k--) {
    const r = Math.floor(rand() * (k + 1))
    ;[order[k], order[r]] = [order[r], order[k]]
  }
  return { weights: order.map((k) => weights[k]), values: order.map((k) => values[k]) }
}
