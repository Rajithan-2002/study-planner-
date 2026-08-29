export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || isNaN(hours)) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '0m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDuration(minutes: number | null | undefined): string {
  return formatMinutes(minutes)
}

export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHrs = Math.round(diffMs / (1000 * 60 * 60))
    if (diffHrs === 0) {
      const diffMins = Math.round(diffMs / (1000 * 60))
      if (diffMins < 0) return `${Math.abs(diffMins)}m ago`
      return `in ${diffMins}m`
    }
    if (diffHrs < 0) return `${Math.abs(diffHrs)}h ago`
    return `in ${diffHrs}h`
  }
  if (diffDays < 0) {
    if (diffDays === -1) return 'yesterday'
    return `${Math.abs(diffDays)} days ago`
  }
  if (diffDays === 1) return 'tomorrow'
  return `in ${diffDays} days`
}
