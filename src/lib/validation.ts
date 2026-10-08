/** Input validation for quantity fields: positive, at most two decimals. */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

const MAX_TONNES = 10000

export function parseTonnes(raw: string): Parsed<number> {
  const text = raw.trim()
  if (text === '') return { ok: false, error: 'Enter a quantity in tonnes.' }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { ok: false, error: /^\d*\.\d{3,}$/.test(text) ? 'Use at most 2 decimal places.' : 'Enter a positive number, e.g. 12.5.' }
  }
  const value = Number(text)
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'Quantity must be greater than zero.' }
  if (value > MAX_TONNES) return { ok: false, error: `Quantity must be under ${MAX_TONNES.toLocaleString('en-AU')} t.` }
  return { ok: true, value }
}

/** Rounds to 2 dp so repeated additions don't accumulate float noise. */
export const round2 = (n: number): number => Math.round(n * 100) / 100

/** Compact tonnes for log and notification text: "23.4 t", "16.25 t". */
export const fmtT = (n: number): string => `${Number(n.toFixed(2))} t`

/** "Rev F" → "Rev G"; "Rev Z" → "Rev ZA"; anything else gets a ".1" suffix. */
export function nextRevision(rev: string): string {
  const match = /^(.*?)([A-Y])$/.exec(rev.trim())
  if (match) return `${match[1]}${String.fromCharCode(match[2].charCodeAt(0) + 1)}`
  if (/Z$/.test(rev.trim())) return `${rev.trim()}A`
  return `${rev.trim()}.1`
}
