const MANAGEMENT_TIME_ZONE = 'Asia/Shanghai'

export function parseManagementDate(value: string | Date) {
  if (value instanceof Date) return value
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  return new Date(normalized)
}

export function formatManagementDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  const hasStyleOptions = options.dateStyle !== undefined || options.timeStyle !== undefined
  const formatOptions: Intl.DateTimeFormatOptions = hasStyleOptions
    ? { timeZone: MANAGEMENT_TIME_ZONE, ...options }
    : {
        timeZone: MANAGEMENT_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        ...options,
      }
  return new Intl.DateTimeFormat('zh-CN', formatOptions).format(parseManagementDate(value))
}
