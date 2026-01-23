import { ReactNode } from 'react'

interface PanelSectionProps {
  children: ReactNode
  className?: string
}

export function PanelSection({ children, className = '' }: PanelSectionProps) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
