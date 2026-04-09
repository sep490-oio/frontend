import React from 'react'
import { Flex } from 'antd'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface OrderActionRowProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function OrderActionRow({ children, style }: OrderActionRowProps) {
  const { isMobile } = useBreakpoint()

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', ...style }}>
        {React.Children.map(children, (child) =>
          child ? <div style={{ width: '100%' }}>{child}</div> : null,
        )}
      </div>
    )
  }

  return (
    <Flex wrap="wrap" gap={8} style={style}>
      {children}
    </Flex>
  )
}
