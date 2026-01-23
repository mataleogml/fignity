import { ReactNode } from 'react'

interface PanelHeaderProps {
  children: ReactNode
  className?: string
}

export function PanelHeader({ children, className = '' }: PanelHeaderProps) {
  return (
    <h4 className={`text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 ${className}`}>
      {children}
    </h4>
  )
}
