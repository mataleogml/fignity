'use client'

import * as React from 'react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SplitButtonProps {
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
  primaryLabel: string
  secondaryLabel?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  className?: string
}

export function SplitButton({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel = 'Accept All',
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: SplitButtonProps) {
  return (
    <div className={cn('flex', className)}>
      {/* Primary button */}
      <Button
        onClick={onPrimaryAction}
        variant={variant}
        size={size}
        disabled={disabled}
        className="rounded-r-none border-r-0 flex-1"
      >
        {primaryLabel}
      </Button>

      {/* Dropdown trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              variant={variant}
              size={size}
              disabled={disabled}
              className="rounded-l-none px-2"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          )}
        />
        <DropdownMenuContent align="end">
          {onSecondaryAction && (
            <DropdownMenuItem onSelect={onSecondaryAction}>
              {secondaryLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
