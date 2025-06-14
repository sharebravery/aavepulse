import { useEffect, useRef } from 'react'
import { AreaSeries, ColorType, LineSeries, createChart, type UTCTimestamp } from 'lightweight-charts'
import type { ReserveSnapshot } from '../lib/types'
import { copy } from '../lib/copy'

export function TrendChart({ snapshots, mode }: { snapshots: ReserveSnapshot[]; mode: 'liquidity' | 'rates' }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || snapshots.length === 0) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 360,
      layout: { background: { type: ColorType.Solid, color: '#0b1022' }, textColor: '#8d99b8', fontFamily: 'Fira Code' },
      grid: { vertLines: { color: '#1b2440' }, horzLines: { color: '#1b2440' } },
      rightPriceScale: { borderColor: '#273252' },
      timeScale: { borderColor: '#273252', timeVisible: false },
      crosshair: { vertLine: { color: '#37d7ff' }, horzLine: { color: '#37d7ff' } },
    })

    const first = chart.addSeries(AreaSeries, {
      lineColor: '#37d7ff',
      topColor: 'rgba(55, 215, 255, 0.22)',
      bottomColor: 'rgba(55, 215, 255, 0.01)',
      lineWidth: 2,
      priceFormat: mode === 'rates' ? { type: 'price', precision: 2, minMove: 0.01 } : { type: 'volume' },
    })
    const second = chart.addSeries(LineSeries, { color: '#4ef2c2', lineWidth: 2 })
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

  return <div ref={containerRef} className="h-[360px] w-full" aria-label={mode === 'rates' ? copy.detail.apyChartLabel : copy.detail.liquidityChartLabel} />
}
