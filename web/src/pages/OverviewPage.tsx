import { useEffect, useState } from 'react'
import { Alert, Button, Skeleton, Table, Tag, message } from 'antd'
import { ArrowUpRight, DatabaseZap, RefreshCw } from 'lucide-react'
import { api } from '../lib/client'
import { formatCurrency, formatDateTime, formatPercent } from '../lib/format'
import type { Overview, Reserve, SyncRun } from '../lib/types'

export function OverviewPage({ onOpenReserve }: { onOpenReserve: (reserve: Reserve) => void }) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [reserves, setReserves] = useState<Reserve[]>([])
  const [latestRun, setLatestRun] = useState<SyncRun | null>(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const load = async () => {
    setError('')
    try {
      const [overviewData, reserveData, runData] = await Promise.all([
        api.overview(),
        api.reserves('?page=1&page_size=6'),
        api.syncRuns(),
      ])
      setOverview(overviewData)
      setReserves(reserveData.data)
      setLatestRun(runData.data[0] || null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '数据加载失败')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const runSync = async () => {
    setSyncing(true)
    try {
      await api.runSync()
      await load()
      messageApi.success('同步完成')
    } catch (cause) {
      messageApi.error(cause instanceof Error ? cause.message : '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  if (error) return <PageState><Alert type="error" message="无法读取协议数据" description={error} showIcon /><Button onClick={() => void load()}>重试</Button></PageState>
  if (!overview) return <PageState><Skeleton active paragraph={{ rows: 8 }} /></PageState>

  const metrics = [
    { index: '01', label: '总供应量', value: formatCurrency(overview.total_supplied_usd), note: 'TOTAL SUPPLIED' },
    { index: '02', label: '总借款量', value: formatCurrency(overview.total_borrowed_usd), note: 'TOTAL BORROWED' },
    { index: '03', label: '可用流动性', value: formatCurrency(overview.available_liquidity_usd), note: 'AVAILABLE' },
    { index: '04', label: '资金利用率', value: formatPercent(overview.utilization_rate), note: 'UTILIZATION' },
  ]

  return (
    <div className="page page-enter">
      {contextHolder}
      <header className="page-header">
        <div>
          <div className="eyebrow">AAVE V3 / ETHEREUM</div>
          <h1>协议概览</h1>
          <p>最后同步 {formatDateTime(overview.last_synced_at)} · {overview.reserve_count} 个储备市场</p>
        </div>
        <div className="header-actions">
          {overview.demo ? <Tag color="gold">DEMO DATA</Tag> : <Tag color="blue">THE GRAPH</Tag>}
          <Button type="primary" icon={<RefreshCw size={16} />} loading={syncing} onClick={() => void runSync()}>
            执行同步
          </Button>
        </div>
      </header>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.index}>
            <span className="metric-index">{metric.index}</span>
            <span className="metric-note">{metric.note}</span>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <article className="data-panel reserve-panel">
          <div className="panel-heading">
            <div><span>MARKETS</span><h2>核心储备市场</h2></div>
            <DatabaseZap size={22} />
          </div>
          <Table
            rowKey="id"
            dataSource={reserves}
            pagination={false}
            onRow={(record) => ({ onClick: () => onOpenReserve(record) })}
            columns={[
              { title: '资产', dataIndex: 'symbol', render: (value, row) => <div className="asset-cell"><b>{value}</b><span>{row.name}</span></div> },
              { title: '供应量', dataIndex: 'total_supplied_usd', align: 'right', render: formatCurrency },
              { title: '利用率', dataIndex: 'utilization_rate', align: 'right', render: formatPercent },
              { title: '', width: 36, render: () => <ArrowUpRight size={16} /> },
            ]}
          />
        </article>

        <article className="data-panel sync-signal">
          <div className="panel-heading"><div><span>PIPELINE</span><h2>同步信号</h2></div></div>
          <div className={`signal-orbit ${latestRun?.status || 'idle'}`}><span /></div>
          <strong>{latestRun?.status === 'succeeded' ? '数据管道正常' : '等待同步记录'}</strong>
          <p>{latestRun ? `${latestRun.source.toUpperCase()} · 写入 ${latestRun.written_count} 个市场` : '执行首次同步后显示状态'}</p>
          <dl>
            <div><dt>最近执行</dt><dd>{formatDateTime(latestRun?.started_at)}</dd></div>
            <div><dt>数据来源</dt><dd>{latestRun?.source.toUpperCase() || 'N/A'}</dd></div>
          </dl>
        </article>
      </section>
    </div>
  )
}

function PageState({ children }: { children: React.ReactNode }) {
  return <div className="page-state">{children}</div>
}
