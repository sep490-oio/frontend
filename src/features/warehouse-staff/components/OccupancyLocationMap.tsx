import { useEffect, useMemo, useState } from 'react'
import { Empty, Input, Segmented, Skeleton, Tooltip, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { StorageLocationDto } from '@/features/inspector/api'
import type { WarehouseItemDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface OccupancyLocationMapProps {
  locations: StorageLocationDto[]
  itemsByLocationId: Map<string, WarehouseItemDto>
  onOccupiedClick: (warehouseItemId: string) => void
  focusLocationId?: string
  loading?: boolean
}

const CELL_WIDTH = 168
const CELL_HEIGHT = 92
const ACCENT = 'var(--color-accent, #4A7C59)'
const BORDER = 'var(--color-border, #d9d9d9)'

export function OccupancyLocationMap({
  locations,
  itemsByLocationId,
  onOccupiedClick,
  focusLocationId,
  loading,
}: OccupancyLocationMapProps) {
  const { t } = useTranslation('warehouse')
  const [search, setSearch] = useState('')

  const zones = useMemo(() => {
    const set = new Set<string>()
    locations.forEach((l) => set.add(l.zone || '—'))
    return Array.from(set).sort()
  }, [locations])

  const focusZone = useMemo(() => {
    if (!focusLocationId) return undefined
    const focused = locations.find((l) => l.id === focusLocationId)
    return focused?.zone
  }, [focusLocationId, locations])

  const [activeZone, setActiveZone] = useState<string>(focusZone ?? zones[0] ?? '')

  useEffect(() => {
    if (focusZone && focusZone !== activeZone) setActiveZone(focusZone)
  }, [focusZone, activeZone])

  const effectiveZone = zones.includes(activeZone) ? activeZone : (zones[0] ?? '')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return locations.filter((l) => {
      if ((l.zone || '—') !== effectiveZone) return false
      if (!q) return true
      const item = itemsByLocationId.get(l.id)
      return (
        l.label.toLowerCase().includes(q) ||
        (item?.itemTitle ?? '').toLowerCase().includes(q)
      )
    })
  }, [locations, effectiveZone, search, itemsByLocationId])

  const grouped = useMemo(() => {
    const byAisle = new Map<string, Map<string, StorageLocationDto[]>>()
    filtered.forEach((l) => {
      const aisleMap = byAisle.get(l.aisle) ?? new Map<string, StorageLocationDto[]>()
      const shelfArr = aisleMap.get(l.shelf) ?? []
      shelfArr.push(l)
      aisleMap.set(l.shelf, shelfArr)
      byAisle.set(l.aisle, aisleMap)
    })
    return Array.from(byAisle.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([aisle, shelfMap]) => ({
        aisle,
        shelves: Array.from(shelfMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([shelf, bins]) => ({
            shelf,
            bins: bins.slice().sort((a, b) => (a.bin || '').localeCompare(b.bin || '')),
          })),
      }))
  }, [filtered])

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />

  return (
    <div>
      {zones.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Segmented
            value={effectiveZone}
            onChange={(v) => setActiveZone(String(v))}
            options={zones.map((z) => ({ label: z, value: z }))}
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('searchLocationOrItem', 'Search by label or item title')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
          <LegendChip color="var(--color-bg-surface, #fafafa)" borderColor={BORDER} label={t('legendEmpty', 'Empty')} />
          <LegendChip color="#fff" borderColor={ACCENT} label={t('legendOccupied', 'Occupied')} />
          <LegendChip color="#fff" borderColor={ACCENT} ring label={t('legendFocused', 'Focused')} />
        </div>
      </div>

      {grouped.length === 0 ? (
        <Empty description={t('noLocationsInZone', 'No locations in this zone')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(({ aisle, shelves }) => (
            <div key={aisle}>
              <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                {t('aisle', 'Aisle')} {aisle}
              </Typography.Text>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginTop: 6,
                  padding: 8,
                  background: 'var(--color-bg-surface, #fafafa)',
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {shelves.map(({ shelf, bins }) => (
                  <div key={shelf}>
                    <Typography.Text style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {t('shelf', 'Shelf')} {shelf}
                    </Typography.Text>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {bins.map((loc) => {
                        const item = itemsByLocationId.get(loc.id)
                        const isFocused = loc.id === focusLocationId
                        const isOccupied = !!item
                        const tooltip = item
                          ? `${loc.label} • ${item.itemTitle ?? ''} • ${item.status}`
                          : loc.label
                        const baseStyle: React.CSSProperties = {
                          width: CELL_WIDTH,
                          height: CELL_HEIGHT,
                          borderRadius: 8,
                          border: isOccupied ? `1px solid ${ACCENT}` : `1px dashed ${BORDER}`,
                          background: isOccupied ? '#fff' : 'var(--color-bg-surface, #fafafa)',
                          cursor: isOccupied ? 'pointer' : 'default',
                          padding: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          textAlign: 'left',
                          boxShadow: isFocused ? `0 0 0 3px ${ACCENT}` : undefined,
                          transition: 'all 0.15s',
                        }
                        return (
                          <Tooltip key={loc.id} title={tooltip}>
                            <button
                              type="button"
                              disabled={!isOccupied}
                              onClick={() => item && onOccupiedClick(item.id)}
                              style={baseStyle}
                            >
                              {isOccupied ? (
                                <>
                                  {item?.itemImageUrl ? (
                                    <img
                                      src={item.itemImageUrl}
                                      alt=""
                                      style={{
                                        width: 44,
                                        height: 44,
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 4,
                                        background: 'var(--color-bg-surface, #f0f0f0)',
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--color-text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {item?.itemTitle ?? loc.label}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: 2,
                                      }}
                                    >
                                      {loc.label}
                                    </div>
                                    {item?.status && <StatusBadge status={item.status} />}
                                  </div>
                                </>
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    fontSize: 11,
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  <div style={{ fontWeight: 600 }}>{loc.label}</div>
                                  <div style={{ fontSize: 10, opacity: 0.7 }}>{t('legendEmpty', 'Empty')}</div>
                                </div>
                              )}
                            </button>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LegendChip({
  color,
  borderColor,
  label,
  ring,
}: {
  color: string
  borderColor: string
  label: string
  ring?: boolean
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          borderRadius: 4,
          background: color,
          border: `1px solid ${borderColor}`,
          boxShadow: ring ? `0 0 0 2px ${borderColor}` : undefined,
        }}
      />
      <span>{label}</span>
    </span>
  )
}
