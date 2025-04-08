import { useEffect, useState } from 'react'
import { Alert, Button, Skeleton, Table, Tag, message } from 'antd'
import { RefreshCw } from 'lucide-react'
import { api } from '../lib/client'
import { formatDateTime } from '../lib/format'
import type { SyncRun } from '../lib/types'

export function SyncRunsPage() {
  const [items, setItems] = useState<SyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const load = async () => {
    setLoading(true)
    try {
      setItems((await api.syncRuns()).data)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '同步记录加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const run = async () => {
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

  return (
    <div className="page page-enter">
      {contextHolder}
      <header className="page-header"><div><div className="eyebrow">DATA PIPELINE</div><h1>同步记录</h1><p>每个批次都有来源、耗时、写入量和错误摘要。</p></div><Button type="primary" icon={<RefreshCw size={16} />} loading={syncing} onClick={() => void run()}>执行同步</Button></header>
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <div className="data-panel table-panel">
        {loading ? <Skeleton active paragraph={{ rows: 7 }} /> : <Table rowKey="id" dataSource={items} pagination={{ pageSize: 10 }} scroll={{ x: 760 }} columns={[
          { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 'succeeded' ? 'green' : value === 'failed' ? 'red' : 'blue'}>{String(value).toUpperCase()}</Tag> },
          { title: '来源', dataIndex: 'source', render: (value) => <code>{String(value).toUpperCase()}</code> },
          { title: '开始时间', dataIndex: 'started_at', render: formatDateTime },
          { title: '读取', dataIndex: 'read_count', align: 'right' },
          { title: '写入', dataIndex: 'written_count', align: 'right' },
          { title: '错误摘要', dataIndex: 'error_summary', ellipsis: true, render: (value) => value || '—' },
        ]} />}
      </div>
    </div>
  )
}
