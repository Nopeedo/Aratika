/**
 * Format a date string to a human-readable NZ format
 * e.g. "2024-03-15" → "15 March 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a date string to a short NZ format
 * e.g. "2024-03-15" → "15 Mar 2024"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Return a relative time string
 * e.g. "2 days ago", "3 hours ago"
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000,  'month'],
    [86400,    'day'],
    [3600,     'hour'],
    [60,       'minute'],
  ]

  for (const [secs, unit] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) {
      return `${count} ${unit}${count !== 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

/**
 * Format a currency amount in NZD
 * e.g. 2000 cents → "$20.00"
 */
export function formatNZD(cents: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Format a percentage
 * e.g. 0.456 → "45.6%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a large number with commas
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-NZ').format(value)
}

/**
 * Convert a string to a URL-safe slug
 * e.g. "Christopher Luxon" → "christopher-luxon"
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[āàáâ]/g, 'a')
    .replace(/[ēèéê]/g, 'e')
    .replace(/[īìíî]/g, 'i')
    .replace(/[ōòóô]/g, 'o')
    .replace(/[ūùúû]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Capitalise the first letter of a string
 */
export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
