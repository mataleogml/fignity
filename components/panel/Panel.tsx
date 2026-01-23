import { ReactNode, forwardRef } from 'react'

interface PanelProps {
  children: ReactNode
  width: number
  side: 'left' | 'right'
  className?: string
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ children, width, side, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-gray-100 dark:bg-[#252525] ${
          side === 'left' ? 'border-r' : 'border-l'
        } border-gray-300 dark:border-[#3e3e3e] flex flex-col relative ${className}`}
        style={{ width }}
      >
        {children}
      </div>
    )
  }
)

Panel.displayName = 'Panel'
