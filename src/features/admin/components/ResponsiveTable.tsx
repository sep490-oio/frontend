import { useRef, useState, useEffect, type CSSProperties } from 'react'
import { Table, Card } from 'antd'
import type { TableProps } from 'antd'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SANS_FONT } from '@/styles/tokens'

interface ResponsiveTableProps<T> extends TableProps<T> {
  /**
   * Column keys to display in mobile card mode.
   * If omitted, all columns are shown.
   */
  mobileCardKeys?: string[]
  /**
   * Whether to show the mobile card layout.
   * Defaults to `true` when `isMobile` is detected.
   */
  forceMobileCards?: boolean
}

/**
 * A wrapper around AntD Table that:
 * - Desktop: renders a normal table with `scroll.x` and shadow indicators for horizontal overflow.
 * - Mobile (<768px): renders each row as a vertical card for better readability.
 */
export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  dataSource,
  mobileCardKeys,
  forceMobileCards,
  ...tableProps
}: ResponsiveTableProps<T>) {
  const { isMobile } = useBreakpoint()
  const showCards = forceMobileCards ?? isMobile
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  // Shadow indicators for horizontal scroll
  useEffect(() => {
    if (showCards) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const tableBody = wrapper.querySelector('.ant-table-body, .ant-table-content') as HTMLElement | null
    if (!tableBody) return

    const updateShadows = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tableBody
      setShowLeftShadow(scrollLeft > 2)
      setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 2)
    }

    updateShadows()
    tableBody.addEventListener('scroll', updateShadows)
    const ro = new ResizeObserver(updateShadows)
    ro.observe(tableBody)

    return () => {
      tableBody.removeEventListener('scroll', updateShadows)
      ro.disconnect()
    }
  }, [showCards, dataSource])

  // ── Mobile Card Layout ──
  if (showCards && columns && dataSource) {
    const visibleCols = mobileCardKeys
      ? columns.filter((c: any) => mobileCardKeys.includes(c.dataIndex || c.key))
      : columns

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(dataSource as T[]).map((record, idx) => (
          <Card
            key={(record as any).id || (record as any).key || idx}
            size="small"
            style={{
              borderRadius: 'var(--admin-table-border-radius, 8px)',
              border: '1px solid var(--color-border)',
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            {(visibleCols as any[]).map((col: any) => {
              const dataIndex = col.dataIndex
              const value = dataIndex ? record[dataIndex] : undefined
              const rendered = col.render ? col.render(value, record, idx) : value

              return (
                <div
                  key={col.key || col.dataIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--color-border)',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      flexShrink: 0,
                      minWidth: 80,
                    }}
                  >
                    {typeof col.title === 'string' ? col.title : col.key}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 'var(--admin-body-size, 14px)',
                      color: 'var(--color-text-primary)',
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                  >
                    {rendered ?? '—'}
                  </span>
                </div>
              )
            })}
          </Card>
        ))}
        {(!dataSource || dataSource.length === 0) && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>
            No data
          </div>
        )}
      </div>
    )
  }

  // ── Desktop Table Layout with scroll shadows ──
  const shadowBase: CSSProperties = {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    pointerEvents: 'none',
    zIndex: 2,
    transition: 'opacity 200ms ease',
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Left shadow */}
      <div
        style={{
          ...shadowBase,
          left: 0,
          background: 'linear-gradient(to right, var(--color-bg-card), transparent)',
          opacity: showLeftShadow ? 1 : 0,
        }}
      />
      {/* Right shadow */}
      <div
        style={{
          ...shadowBase,
          right: 0,
          background: 'linear-gradient(to left, var(--color-bg-card), transparent)',
          opacity: showRightShadow ? 1 : 0,
        }}
      />

      <Table<T>
        columns={columns}
        dataSource={dataSource}
        scroll={{ x: 'max-content' }}
        {...tableProps}
      />
    </div>
  )
}
