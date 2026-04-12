import { useMemo, useState } from 'react'
import { Empty, Input, Segmented, Skeleton, Tooltip, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { StorageLocationDto } from '@/features/inspector/api'

interface StorageLocationMapProps {
  locations: StorageLocationDto[]
  selectedId?: string
  onSelect: (id: string) => void
  loading?: boolean
}

const CELL_SIZE = 56
const ACCENT = 'var(--color-accent, #4A7C59)'
const BORDER = 'var(--color-border, #d9d9d9)'

export function StorageLocationMap({ locations, selectedId, onSelect, loading }: StorageLocationMapProps) {
  const { t } = useTranslation('warehouse')
  const [search, setSearch] = useState('')

  const zones = useMemo(() => {
    const set = new Set<string>()
    locations.forEach((l) => set.add(l.zone || '—'))
    return Array.from(set).sort()
  }, [locations])

  const [activeZone, setActiveZone] = useState<string>(zones[0] ?? '')

  // Reset active zone if the zone list changes and current isn't present
  const effectiveZone = zones.includes(activeZone) ? activeZone : (zones[0] ?? '')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return locations.filter((l) => {
      if ((l.zone || '—') !== effectiveZone) return false
      if (!q) return true
      return l.label.toLowerCase().includes(q)
    })
  }, [locations, effectiveZone, search])

  // Group by aisle -> shelf
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

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  const renderLegend = () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
      <LegendChip
        color="var(--color-bg-surface, #fafafa)"
        borderColor={BORDER}
        label={t('legendAvailable', 'Available')}
      />
      <LegendChip color={ACCENT} borderColor={ACCENT} textColor="#fff" label={t('legendSelected', 'Selected')} />
    </div>
  )

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
          placeholder={t('searchLocation', 'Search by label')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {renderLegend()}
      </div>

      {grouped.length === 0 ? (
        <Empty description={t('noVacantInZone', 'No available locations in this zone')} />
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
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {bins.map((loc) => {
                        const isSelected = loc.id === selectedId
                        const display = loc.bin || loc.label.split('-').pop() || '?'
                        return (
                          <Tooltip key={loc.id} title={loc.label}>
                            <button
                              type="button"
                              onClick={() => onSelect(loc.id)}
                              style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                borderRadius: 6,
                                border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                                background: isSelected ? ACCENT : '#fff',
                                color: isSelected ? '#fff' : 'var(--color-text-primary, #262626)',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                padding: 0,
                              }}
                            >
                              {display}
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
  textColor,
}: {
  color: string
  borderColor: string
  label: string
  textColor?: string
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
          color: textColor,
        }}
      />
      <span>{label}</span>
    </span>
  )
}
