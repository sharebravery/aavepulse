import { useEffect, useRef } from 'react'
import { AreaSeries, ColorType, LineSeries, createChart, type UTCTimestamp } from 'lightweight-charts'
import type { ReserveSnapshot } from '../lib/types'

export function TrendChart({ snapshots, mode }: { snapshots: ReserveSnapshot[]; mode: 'liquidity' | 'rates' }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || snapshots.length === 0) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 360,
      layout: { background: { type: ColorType.Solid, color: '#fbfaf6' }, textColor: '#536079', fontFamily: 'Fira Code' },
      grid: { vertLines: { color: '#e5e1d7' }, horzLines: { color: '#e5e1d7' } },
      rightPriceScale: { borderColor: '#cfc9bb' },
      timeScale: { borderColor: '#cfc9bb', timeVisible: false },
      crosshair: { vertLine: { color: '#1649d8' }, horzLine: { color: '#1649d8' } },
    })

    const first = chart.addSeries(AreaSeries, {
      lineColor: '#1649d8',
      topColor: 'rgba(22, 73, 216, 0.24)',
      bottomColor: 'rgba(22, 73, 216, 0.02)',
      lineWidth: 2,
      priceFormat: mode === 'rates' ? { type: 'price', precision: 2, minMove: 0.01 } : { type: 'volume' },
    })
    const second = chart.addSeries(LineSeries, { color: '#d98b15', lineWidth: 2 })
    const toTime = (value: string) => Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp
    first.setData(snapshots.map((item) => ({ time: toTime(item.snapshot_at), value: mode === 'rates' ? Number(item.supply_apy) * 100 : Number(item.total_supplied_usd) })))
    second.setData(snapshots.map((item) => ({ time: toTime(item.snapshot_at), value: mode === 'rates' ? Number(item.variable_borrow_apy) * 100 : Number(item.total_borrowed_usd) })))
    chart.timeScale().fitContent()

    const observer = new ResizeObserver(([entry]) => chart.applyOptions({ width: entry.contentRect.width }))
    observer.observe(container)
    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [snapshots, mode])

  return <div ref={containerRef} className="trend-chart" aria-label={mode === 'rates' ? 'APY 历史趋势图' : '供应借款历史趋势图'} />
}
