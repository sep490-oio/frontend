import type { MonitoringAlertDto } from '@/types'
import {
  formatAlertType,
  parseAlertPayload,
  type MonitoringEvidenceGroup,
  type MonitoringEvidenceRef,
} from './parseAlertPayload'

export interface MonitoringAlertViewModel {
  title: string
  summary: string
  details: Record<string, string>
  score?: number
  windowLabel?: string
  evidenceRefs: MonitoringEvidenceRef[]
  recommendedNextStep: string
}

export function getMonitoringAlertView(alert: MonitoringAlertDto): MonitoringAlertViewModel {
  const parsed = parseAlertPayload(alert.alertType, alert.payload)
  const serverEvidenceRefs = alert.evidenceRefs?.map(toClientEvidenceRef).filter(Boolean) as MonitoringEvidenceRef[] | undefined

  return {
    title: alert.alertTitle?.trim() || formatAlertType(alert.alertType),
    summary: alert.summary?.trim() || parsed.summary,
    details: parsed.details,
    score: alert.score ?? parsed.score,
    windowLabel: alert.windowLabel || parsed.windowLabel,
    evidenceRefs: serverEvidenceRefs?.length ? serverEvidenceRefs : parsed.evidenceRefs,
    recommendedNextStep: alert.recommendedNextStep?.trim() || parsed.recommendedNextStep,
  }
}

function toClientEvidenceRef(ref: NonNullable<MonitoringAlertDto['evidenceRefs']>[number]): MonitoringEvidenceRef | null {
  const value = ref.copyValue || ref.idOrValue
  if (!value) return null

  return {
    type: ref.type,
    value,
    label: ref.label,
    group: normalizeGroup(ref.group),
    description: ref.description,
  }
}

function normalizeGroup(group: string | undefined): MonitoringEvidenceGroup {
  if (group === 'participants' || group === 'evidence' || group === 'related') return group
  return 'related'
}
