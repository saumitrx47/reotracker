/** Shared formatting helpers — quantities are metric tonnes throughout. */

export const tonnes = (value: number, digits = 1): string =>
  `${value.toLocaleString('en-AU', { minimumFractionDigits: digits, maximumFractionDigits: digits })} t`

export const percent = (value: number, digits = 1): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`

export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })

export const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
