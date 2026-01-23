interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal'
  position: 'left' | 'right' | 'top' | 'bottom'
  onMouseDown: () => void
}

export function ResizeHandle({ direction, position, onMouseDown }: ResizeHandleProps) {
  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    top: 'top-0',
    bottom: 'bottom-0',
  }

  const sizeClasses =
    direction === 'vertical'
      ? 'w-1 h-full cursor-col-resize'
      : 'h-1 w-full cursor-row-resize'

  return (
    <div
      className={`absolute ${positionClasses[position]} ${sizeClasses} hover:bg-blue-500 transition-colors`}
      onMouseDown={onMouseDown}
    />
  )
}
