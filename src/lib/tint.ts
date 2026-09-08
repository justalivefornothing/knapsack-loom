/** Background tint for a filled cell: oat (0) → walnut (max), one hue light to dark. */
export function tint(value: number, maxValue: number): { background: string; color: string } {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  return {
    background: `color-mix(in oklab, var(--color-oat), var(--color-walnut) ${pct}%)`,
    color: pct > 55 ? 'var(--color-oat)' : 'var(--color-ink)',
  }
}
