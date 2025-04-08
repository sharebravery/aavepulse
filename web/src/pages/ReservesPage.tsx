import { useDeferredValue, useEffect, useState } from 'react'
import { Alert, Input, Select, Skeleton, Table, Tag } from 'antd'
import { Search } from 'lucide-react'
import { api } from '../lib/client'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Reserve } from '../lib/types'

export function ReservesPage({ onOpenReserve }: { onOpenReserve: (reserve: Reserve) => void }) {
  const [items, setItems] = useState<Reserve[]>([])
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState('total_supplied_usd')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const query = new URLSearchParams({ page: '1', page_size: '100', order_by: orderBy, order: 'desc' })
    if (deferredSearch) query.set('symbol', deferredSearch)
    setLoading(true)
    api.reserves(`?${query}`).then((result) => {
      setItems(result.data)
      setError('')
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : '市场数据加载失败')
    }).finally(() => setLoading(false))
  }, [deferredSearch, orderBy])

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div><div className="eyebrow">RESERVE DIRECTORY</div><h1>储备市场</h1><p>比较流动性、资金效率和借贷成本。</p></div>
      </header>
      <div className="filter-bar">
        <Input prefix={<Search size={16} />} placeholder="搜索资产符号" value={search} onChange={(event) => setSearch(event.target.value)} allowClear />
        <Select value={orderBy} onChange={setOrderBy} options={[
          { value: 'total_supplied_usd', label: '按供应量排序' },
          { value: 'total_borrowed_usd', label: '按借款量排序' },
          { value: 'utilization_rate', label: '按利用率排序' },
          { value: 'supply_apy', label: '按供应 APY 排序' },
        ]} />
      </div>
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <div className="data-panel table-panel">
        {loading ? <Skeleton active paragraph={{ rows: 7 }} /> : (
          <Table rowKey="id" dataSource={items} pagination={{ pageSize: 10 }} scroll={{ x: 960 }} onRow={(record) => ({ onClick: () => onOpenReserve(record) })} columns={[
            { title: '资产', fixed: 'left', dataIndex: 'symbol', width: 170, render: (value, row) => <div className="asset-cell"><b>{value}</b><span>{row.name}</span></div> },
            { title: '供应量', dataIndex: 'total_supplied_usd', align: 'right', render: formatCurrency },
            { title: '借款量', dataIndex: 'total_borrowed_usd', align: 'right', render: formatCurrency },
            { title: '可用流动性', dataIndex: 'available_liquidity_usd', align: 'right', render: formatCurrency },
            { title: '利用率', dataIndex: 'utilization_rate', align: 'right', render: (value) => <Tag color={Number(value) > 0.8 ? 'orange' : 'blue'}>{formatPercent(value)}</Tag> },
            { title: '供应 APY', dataIndex: 'supply_apy', align: 'right', render: formatPercent },
            { title: '借款 APY', dataIndex: 'variable_borrow_apy', align: 'right', render: formatPercent },
          ]} />
        )}
      </div>
    </div>
  )
}
