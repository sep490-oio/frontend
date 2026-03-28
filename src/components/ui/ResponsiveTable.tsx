import { useState } from 'react'
import { Table, Card, List, Typography, Flex, Pagination, Empty, Spin } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { TableProps, ColumnType } from 'antd/es/table'

interface ResponsiveTableProps<T extends Record<string, any>> extends TableProps<T> {
  /** Mobile display mode: "card" for complex data, "list" for simple data */
  mobileMode?: 'card' | 'list'
  /** Custom mobile row renderer — overrides auto-generated card/list layout */
  mobileRender?: (record: T, index: number) => React.ReactNode
  /** Which column keys to show in mobile card view (defaults to first 4 columns) */
  mobileColumns?: string[]
}

export function ResponsiveTable<T extends Record<string, any>>({
  mobileMode = 'card',
  mobileRender,
  mobileColumns,
  columns,
  dataSource,
  loading,
  pagination,
  rowKey,
  ...tableProps
}: ResponsiveTableProps<T>) {
  const { isMobile } = useBreakpoint()

  if (!isMobile) {
    return (
      <Table<T>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        rowKey={rowKey}
        {...tableProps}
      />
    )
  }

  // Mobile view
  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const data = dataSource ?? []
  if (data.length === 0) {
    return <Empty style={{ padding: 32 }} />
  }

  const cols = (columns ?? []) as ColumnType<T>[]
  const visibleCols = mobileColumns
    ? cols.filter((c) => mobileColumns.includes(String(c.key ?? c.dataIndex)))
    : cols.slice(0, 4)

  if (mobileMode === 'card') {
    return (
      <MobileCardView<T>
        data={data}
        columns={visibleCols}
        mobileRender={mobileRender}
        pagination={pagination}
        rowKey={rowKey}
      />
    )
  }

  return (
    <MobileListView<T>
      data={data}
      columns={visibleCols}
      allColumns={cols}
      mobileRender={mobileRender}
      pagination={pagination}
      rowKey={rowKey}
    />
  )
}

// --- Card Mode ---

interface MobileCardViewProps<T> {
  data: readonly T[]
  columns: ColumnType<T>[]
  mobileRender?: (record: T, index: number) => React.ReactNode
  pagination: TableProps<T>['pagination']
  rowKey: TableProps<T>['rowKey']
}

function MobileCardView<T extends Record<string, any>>({
  data,
  columns,
  mobileRender,
  pagination,
  rowKey,
}: MobileCardViewProps<T>) {
  const [page, setPage] = useState(1)
  const pageSize = typeof pagination === 'object' ? (pagination.pageSize ?? 10) : 10
  const showPagination = pagination !== false && data.length > pageSize

  const paginatedData = showPagination
    ? data.slice((page - 1) * pageSize, page * pageSize)
    : data

  return (
    <Flex vertical gap={12}>
      {paginatedData.map((record, index) => {
        const key = getRowKey(record, index, rowKey)
        return (
          <Card key={key} size="small" style={{ borderRadius: 8 }}>
            {mobileRender ? (
              mobileRender(record as T, index)
            ) : (
              <Flex vertical gap={6}>
                {columns.map((col) => {
                  const value = col.dataIndex ? (record as Record<string, any>)[String(col.dataIndex)] : undefined
                  const rendered = col.render
                    ? col.render(value, record as T, index)
                    : value
                  return (
                    <Flex key={String(col.key ?? col.dataIndex)} justify="space-between" align="start" gap={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                        {String(col.title ?? '')}
                      </Typography.Text>
                      <div style={{ textAlign: 'right', fontSize: 13 }}>{rendered as React.ReactNode}</div>
                    </Flex>
                  )
                })}
              </Flex>
            )}
          </Card>
        )
      })}
      {showPagination && (
        <Flex justify="center" style={{ marginTop: 8 }}>
          <Pagination
            current={page}
            total={data.length}
            pageSize={pageSize}
            onChange={setPage}
            size="small"
            simple
          />
        </Flex>
      )}
    </Flex>
  )
}

// --- List Mode ---

interface MobileListViewProps<T> {
  data: readonly T[]
  columns: ColumnType<T>[]
  allColumns: ColumnType<T>[]
  mobileRender?: (record: T, index: number) => React.ReactNode
  pagination: TableProps<T>['pagination']
  rowKey: TableProps<T>['rowKey']
}

function MobileListView<T extends Record<string, any>>({
  data,
  columns,
  allColumns,
  mobileRender,
  pagination,
  rowKey,
}: MobileListViewProps<T>) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = typeof pagination === 'object' ? (pagination.pageSize ?? 10) : 10
  const showPagination = pagination !== false && data.length > pageSize

  const paginatedData = showPagination
    ? data.slice((page - 1) * pageSize, page * pageSize)
    : data

  return (
    <Flex vertical>
      <List
        dataSource={paginatedData as T[]}
        renderItem={(record, index) => {
          const key = getRowKey(record, index, rowKey)
          const isExpanded = expandedKey === key

          if (mobileRender) {
            return (
              <List.Item style={{ padding: '12px 0' }}>
                {mobileRender(record, index)}
              </List.Item>
            )
          }

          // Primary line: first 2 columns
          const primary = columns.slice(0, 2)
          // Detail: remaining columns shown on expand
          const detail = allColumns.filter(
            (c) => !primary.some((p) => (p.key ?? p.dataIndex) === (c.key ?? c.dataIndex)),
          )

          return (
            <List.Item
              style={{ padding: '10px 0', cursor: detail.length > 0 ? 'pointer' : 'default' }}
              onClick={() => detail.length > 0 && setExpandedKey(isExpanded ? null : key)}
            >
              <Flex vertical style={{ width: '100%' }} gap={4}>
                <Flex justify="space-between" align="center">
                  {primary.map((col) => {
                    const value = col.dataIndex
                      ? (record as Record<string, any>)[String(col.dataIndex)]
                      : undefined
                    const rendered = col.render
                      ? col.render(value, record, index)
                      : value
                    return (
                      <span key={String(col.key ?? col.dataIndex)} style={{ fontSize: 13 }}>
                        {rendered as React.ReactNode}
                      </span>
                    )
                  })}
                  {detail.length > 0 && (
                    isExpanded ? <UpOutlined style={{ fontSize: 10, color: '#999' }} /> : <DownOutlined style={{ fontSize: 10, color: '#999' }} />
                  )}
                </Flex>
                {isExpanded && (
                  <Flex vertical gap={4} style={{ paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                    {detail.map((col) => {
                      const value = col.dataIndex
                        ? (record as Record<string, any>)[String(col.dataIndex)]
                        : undefined
                      const rendered = col.render
                        ? col.render(value, record, index)
                        : value
                      return (
                        <Flex key={String(col.key ?? col.dataIndex)} justify="space-between" gap={8}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {String(col.title ?? '')}
                          </Typography.Text>
                          <span style={{ fontSize: 12 }}>{rendered as React.ReactNode}</span>
                        </Flex>
                      )
                    })}
                  </Flex>
                )}
              </Flex>
            </List.Item>
          )
        }}
      />
      {showPagination && (
        <Flex justify="center" style={{ marginTop: 8 }}>
          <Pagination
            current={page}
            total={data.length}
            pageSize={pageSize}
            onChange={setPage}
            size="small"
            simple
          />
        </Flex>
      )}
    </Flex>
  )
}

// --- Helpers ---

function getRowKey<T extends Record<string, any>>(
  record: T,
  index: number,
  rowKey: TableProps<T>['rowKey'],
): string {
  if (typeof rowKey === 'function') return String(rowKey(record))
  if (typeof rowKey === 'string') return String(record[rowKey] ?? index)
  return String((record as Record<string, any>).id ?? (record as Record<string, any>).key ?? index)
}
