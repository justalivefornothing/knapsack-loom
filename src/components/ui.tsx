import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'thread'

const variants: Record<Variant, string> = {
  primary: 'bg-walnut text-oat hover:bg-ink border-walnut disabled:hover:bg-walnut',
  ghost: 'bg-transparent text-ink hover:bg-linen-deep border-taupe',
  thread: 'bg-crimson text-oat hover:bg-[#8d1f24] border-crimson disabled:hover:bg-crimson',
}

export function Button({
  variant = 'ghost',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-walnut focus-visible:ring-offset-2 focus-visible:ring-offset-linen disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}

export function IconButton({ label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-taupe text-ink transition-colors outline-none hover:bg-linen-deep focus-visible:ring-2 focus-visible:ring-walnut focus-visible:ring-offset-2 focus-visible:ring-offset-linen disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      {...rest}
    />
  )
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      onFocus={rest.type === 'number' ? (e) => e.currentTarget.select() : undefined}
      className={`h-9 w-full rounded-md border border-taupe bg-oat px-2.5 font-mono text-sm text-ink tabular outline-none transition-colors placeholder:text-taupe-deep focus:border-walnut focus:ring-2 focus:ring-walnut/30 ${className}`}
      {...rest}
    />
  )
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">
      {children}
    </label>
  )
}

export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-taupe/60 bg-oat/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-slab text-base font-semibold text-walnut">{title}</h2>
        {aside && <div className="text-xs text-ink-soft">{aside}</div>}
      </header>
      {children}
    </section>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 text-sm text-ink outline-none disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span
        className={`relative inline-block h-5 w-9 rounded-full border transition-colors group-focus-visible:ring-2 group-focus-visible:ring-walnut group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-linen ${
          checked ? 'border-walnut bg-walnut' : 'border-taupe bg-linen-deep'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-[left,background-color] ${
            checked ? 'left-[18px] bg-oat' : 'left-0.5 bg-taupe-deep'
          }`}
        />
      </span>
      {label}
    </button>
  )
}
