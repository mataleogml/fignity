'use client'

import type { ChangeStatus, ProjectStatus } from '@/lib/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface StatusDotProps {
  status: ChangeStatus | ProjectStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusDot({ status, size = 'md', className = '' }: StatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const colorClasses = {
    clean: 'bg-green-500',
    pending: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    needs_export: 'bg-orange-500',
  }

  const statusLabels = {
    clean: 'No changes',
    pending: 'Has pending changes',
    accepted: 'Changes accepted',
    needs_export: 'Needs export',
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={`rounded-full cursor-help ${sizeClasses[size]} ${colorClasses[status]} ${className}`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>{statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  )
}
