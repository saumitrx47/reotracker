/**
 * Chart tokens. Categorical slots 1–3 of the validated default palette
 * (blue / orange / aqua) — this ordering clears the CVD and normal-vision
 * separation gates. Series colour follows the entity, never its rank, so these
 * keys stay bound to the measure they name.
 */
export const SERIES = {
  estimated: '#2a78d6',
  ordered: '#eb6834',
  installed: '#1baf7a',
} as const

export const FORECAST_SERIES = {
  installed: '#2a78d6',
  projected: '#eb6834',
  committed: '#1baf7a',
} as const

/** Fixed status palette — never reused for a data series. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
} as const

export const CHROME = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  ink: '#0b0b0b',
  inkSecondary: '#52514e',
  surface: '#ffffff',
} as const

export const axisProps = {
  tick: { fill: CHROME.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHROME.axis },
} as const
