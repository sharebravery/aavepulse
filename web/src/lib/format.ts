import { copy } from './copy'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatCurrency(value: string | number): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '$0.00'
  return currencyFormatter.format(amount)
}

export function formatNumber(value: string | number): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0'
  return numberFormatter.format(amount)
}

export function formatPercent(value: string | number): string {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return '0.00%'
  return percentFormatter.format(ratio)
}

export function formatDateTime(value?: string): string {
  if (!value) return copy.common.notSynced
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return copy.common.unknownTime
  return dateFormatter.format(date)
}
