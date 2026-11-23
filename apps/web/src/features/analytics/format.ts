import type { Trend } from '@/lib/types'

const MINUS = '−'

/** Metric/post counts: 1.28M · 842K · 64.2K · 5.9K · 612. */
export function compact(n: number) {
  if (n >= 999_500) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 99_950) return `${Math.round(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(Math.round(n))
}

/** Platform comparison views/reach and breakdown values: 612K · 86K. */
export const kWhole = (n: number) => (n >= 999_500 ? `${(n / 1_000_000).toFixed(2)}M` : `${Math.round(n / 1000)}K`)
/** Platform comparison counts: 31.8K · 0.3K. */
export const kOne = (n: number) => `${(n / 1000).toFixed(1)}K`

export const percent = (n: number) => `${n.toFixed(1)}%`

/** +12.4% · −3.1% */
export const signedPct = (n: number) => `${n >= 0 ? '+' : MINUS}${Math.abs(n).toFixed(1)}%`
/** +0.4 pt */
export const signedPt = (n: number) => `${n >= 0 ? '+' : MINUS}${Math.abs(n).toFixed(1)} pt`
/** +18 */
export const signedInt = (n: number) => `${n >= 0 ? '+' : MINUS}${Math.abs(n)}`

/** Rounds first so a −0.04% change reads as neutral rather than "down 0.0%". */
export function trendOf(n: number | null, digits = 1): Trend {
  if (n === null) return 'neutral'
  const r = Number(n.toFixed(digits))
  return r > 0 ? 'up' : r < 0 ? 'down' : 'neutral'
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** "Nov 21" */
export const shortDate = (iso: string) => utc(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** "Oct 23 – Nov 21, 2025" (year shown once when both ends share it). */
export function rangeLabel(from: string, to: string) {
  const a = utc(from)
  const b = utc(to)
  const year = (d: Date) => d.getUTCFullYear()
  if (year(a) === year(b)) return `${shortDate(from)} – ${shortDate(to)}, ${year(b)}`
  return `${shortDate(from)}, ${year(a)} – ${shortDate(to)}, ${year(b)}`
}

/** "14 min ago" · "2h ago" · "just now" */
export function relativeTime(ts: number, now = Date.now()) {
  const mins = Math.floor((now - ts) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}
