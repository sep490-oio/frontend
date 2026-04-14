import { useTranslation } from 'react-i18next'
import { ItemCondition, AuctionType } from '@/types/enums'

// Reuses common.statusLabel.* which already has translations for every
// ItemCondition and AuctionType value in both locales.
export function useConditionOptions() {
  const { t } = useTranslation('common')
  return Object.values(ItemCondition).map((value) => ({
    value,
    label: t(`statusLabel.${value}`, value),
  }))
}

export function useAuctionTypeOptions() {
  const { t } = useTranslation('common')
  return Object.values(AuctionType).map((value) => ({
    value,
    label: t(`statusLabel.${value}`, value),
  }))
}
