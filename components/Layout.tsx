'use client'

import { useState, useEffect, useRef } from 'react'
import { StatusDot } from './StatusDot'
import { getTextBlockChanges } from '@/lib/status'
import type { TextBlock, Frame, FrameWithStatus, ProjectStatus } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { LeftPanel, RightPanel } from './panel'

interface LayoutProps {
  projectId?: string
  projectName?: string
  projectStatus?: ProjectStatus
  frames?: FrameWithStatus[]
  textBlocks?: TextBlock[]
  onAcceptChange?: (blockId: string) => Promise<void>
  onAcceptAllChanges?: () => Promise<void>
  onSync?: (frameId?: string) => Promise<void>
  onExport?: () => void
  onUpdateProjectName?: (newName: string) => Promise<void>
  isSyncing?: boolean
  syncProgress?: { current: number; total: number }
  loadingFrameIds?: Set<string>
  previewMode?: boolean
}

const MIN_LEFT_PANEL_WIDTH = 200
const MAX_LEFT_PANEL_WIDTH = 400
const DEFAULT_LEFT_PANEL_WIDTH = 280

const MIN_RIGHT_PANEL_WIDTH = 250
const MAX_RIGHT_PANEL_WIDTH = 500
const DEFAULT_RIGHT_PANEL_WIDTH = 320

const MIN_THUMBNAIL_WIDTH = 120
const MAX_THUMBNAIL_WIDTH = 180

export function Layout({
  projectId = '',
  projectName = 'Untitled Project',
  projectStatus = 'clean',
  frames = [],
  textBlocks = [],
  onAcceptChange = async () => {},
  onAcceptAllChanges = async () => {},
  onSync = async () => {},
  onExport = () => {},
  onUpdateProjectName = async () => {},
  isSyncing = false,
  syncProgress = { current: 0, total: 0 },
  loadingFrameIds = new Set<string>(),
  previewMode = false,
}: LayoutProps) {
  const [focusedFrameId, setFocusedFrameId] = useState<string | null>(
    frames[0]?.id || null
  )
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH)
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [isEditingProjectName, setIsEditingProjectName] = useState(false)
  const [editedProjectName, setEditedProjectName] = useState(projectName)
  const [pagesHeight, setPagesHeight] = useState<number | null>(null)
  const [isResizingPages, setIsResizingPages] = useState(false)
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)

  const canvasRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const selectedBlock = textBlocks.find((b) => b.id === selectedBlockId)
  const selectedFrame = frames.find((f) => f.id === selectedFrameId)
  const focusedFrameBlocks = textBlocks.filter((b) => b.frame_id === focusedFrameId)
  const selectedFrameBlocks = selectedFrameId ? textBlocks.filter((b) => b.frame_id === selectedFrameId) : []

  const frameChanges = selectedFrameBlocks.filter((b) => b.change_status === 'pending' || b.change_status === 'accepted')
  const allChanges = textBlocks.filter((b) => b.change_status === 'pending' || b.change_status === 'accepted')

  // Calculate thumbnail width based on panel width
  const thumbnailWidth = Math.min(
    MAX_THUMBNAIL_WIDTH,
    Math.max(MIN_THUMBNAIL_WIDTH, leftPanelWidth - 40)
  )

  useEffect(() => {
    if (!focusedFrameId && frames.length > 0) {
      setFocusedFrameId(frames[0].id)
    }
  }, [frames, focusedFrameId])

  useEffect(() => {
    setEditedProjectName(projectName)
  }, [projectName])

  // Initialize pages height to 60% of available height
  useEffect(() => {
    if (pagesHeight === null) {
      const headerHeight = 150
      const availableHeight = window.innerHeight - headerHeight
      setPagesHeight(Math.floor(availableHeight * 0.6))
    }
  }, [pagesHeight])

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.min(
          MAX_LEFT_PANEL_WIDTH,
          Math.max(MIN_LEFT_PANEL_WIDTH, e.clientX)
        )
        setLeftPanelWidth(newWidth)
      } else if (isResizingRight) {
        const newWidth = Math.min(
          MAX_RIGHT_PANEL_WIDTH,
          Math.max(MIN_RIGHT_PANEL_WIDTH, window.innerWidth - e.clientX)
        )
        setRightPanelWidth(newWidth)
      } else if (isResizingPages) {
        const headerHeight = 150
        const minHeight = 150
        const maxHeight = window.innerHeight - headerHeight - 200
        const newHeight = Math.min(
          maxHeight,
          Math.max(minHeight, e.clientY - headerHeight - 150)
        )
        setPagesHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
      setIsResizingPages(false)
    }

    if (isResizingLeft || isResizingRight || isResizingPages) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      if (isResizingPages) {
        document.body.style.cursor = 'row-resize'
      } else {
        document.body.style.cursor = 'col-resize'
      }
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingLeft, isResizingRight, isResizingPages])

  const handleProjectNameDoubleClick = () => {
    setIsEditingProjectName(true)
  }

  const handleProjectNameBlur = async () => {
    if (editedProjectName.trim() && editedProjectName !== projectName) {
      await onUpdateProjectName(editedProjectName.trim())
    }
    setIsEditingProjectName(false)
  }

  const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setEditedProjectName(projectName)
      setIsEditingProjectName(false)
    }
  }

  const handleTextBoxClick = (blockId: string) => {
    setSelectedBlockId(blockId)
    setSelectedFrameId(null)

    // If this block has pending changes, find its index in changesToReview
    const block = textBlocks.find(b => b.id === blockId)
    if (block?.change_status === 'pending') {
      const index = changesToReview.findIndex(c => c.id === blockId)
      if (index !== -1) {
        setCurrentChangeIndex(index)
      }
    }
  }

  const handleTextBoxDoubleClick = async (block: TextBlock, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(block.content)
      toast.success('Text copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy text')
    }
  }

  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleAcceptChange = async (blockId: string) => {
    await onAcceptChange(blockId)
    setSelectedBlockId(null)
    setSelectedFrameId(null)
  }

  const handleSkipChange = () => {
    toast.info('Change kept for later review')
    if (currentChangeIndex < changesToReview.length - 1) {
      setCurrentChangeIndex(currentChangeIndex + 1)
    }
  }

  const handleSyncClick = async () => {
    if (selectedFrameId) {
      await onSync(selectedFrameId)
    } else {
      await onSync()
    }
  }

  const handleNextChange = () => {
    if (currentChangeIndex < changesToReview.length - 1) {
      const nextIndex = currentChangeIndex + 1
      setCurrentChangeIndex(nextIndex)

      // Select and scroll to the next change's text block
      const nextChange = changesToReview[nextIndex]
      if (nextChange) {
        setSelectedBlockId(nextChange.id)
        setFocusedFrameId(nextChange.frame_id)

        // Scroll to the text block position within the frame
        if (nextChange.frame_id) {
          setTimeout(() => {
            const frameElement = frameRefs.current.get(nextChange.frame_id!)
            const frame = frames.find(f => f.id === nextChange.frame_id!)

            if (frameElement && canvasRef.current && frame) {
              const containerHeight = canvasRef.current.clientHeight
              const maxWidth = 1000
              const scale = Math.min(maxWidth / frame.width, 1)

              // Calculate text box position within the scaled frame
              const textBoxTopInFrame = (nextChange.y - frame.y) * scale
              const textBoxHeight = nextChange.height * scale

              // Calculate absolute position: frame top + header + text box position in frame
              const frameHeaderHeight = 60 // Approximate header height
              const textBoxAbsoluteTop = frameElement.offsetTop + frameHeaderHeight + textBoxTopInFrame

              // Center the text box in the viewport
              const scrollTo = textBoxAbsoluteTop - (containerHeight / 2) + (textBoxHeight / 2)

              canvasRef.current.scrollTo({
                top: Math.max(0, scrollTo),
                behavior: 'smooth',
              })
            }
          }, 50)
        }
      }
    }
  }

  const handlePreviousChange = () => {
    if (currentChangeIndex > 0) {
      const prevIndex = currentChangeIndex - 1
      setCurrentChangeIndex(prevIndex)

      // Select and scroll to the previous change's text block
      const prevChange = changesToReview[prevIndex]
      if (prevChange) {
        setSelectedBlockId(prevChange.id)
        setFocusedFrameId(prevChange.frame_id)

        // Scroll to the text block position within the frame
        if (prevChange.frame_id) {
          setTimeout(() => {
            const frameElement = frameRefs.current.get(prevChange.frame_id!)
            const frame = frames.find(f => f.id === prevChange.frame_id!)

            if (frameElement && canvasRef.current && frame) {
              const containerHeight = canvasRef.current.clientHeight
              const maxWidth = 1000
              const scale = Math.min(maxWidth / frame.width, 1)

              // Calculate text box position within the scaled frame
              const textBoxTopInFrame = (prevChange.y - frame.y) * scale
              const textBoxHeight = prevChange.height * scale

              // Calculate absolute position: frame top + header + text box position in frame
              const frameHeaderHeight = 60 // Approximate header height
              const textBoxAbsoluteTop = frameElement.offsetTop + frameHeaderHeight + textBoxTopInFrame

              // Center the text box in the viewport
              const scrollTo = textBoxAbsoluteTop - (containerHeight / 2) + (textBoxHeight / 2)

              canvasRef.current.scrollTo({
                top: Math.max(0, scrollTo),
                behavior: 'smooth',
              })
            }
          }, 50)
        }
      }
    }
  }

  const handleAcceptCurrentChange = async () => {
    const currentChange = changesToReview[currentChangeIndex]
    if (currentChange) {
      await handleAcceptChange(currentChange.id)
      setCurrentChangeIndex(0)
    }
  }

  const handleAcceptAllChangesWrapper = async () => {
    await onAcceptAllChanges()
    setSelectedBlockId(null)
    setSelectedFrameId(null)
    setCurrentChangeIndex(0)
  }

  // Global changes to review - always shows all pending changes across the document
  const changesToReview = allChanges.filter(b => b.change_status === 'pending')

  // Get current change being reviewed from global navigation
  const currentChange = changesToReview[currentChangeIndex] || null
  const currentChangeDetails = currentChange ? getTextBlockChanges(currentChange) : []

  // Only show changes panel if:
  // 1. There are changes to review globally
  // 2. When a text block is selected, only show changes if that block has pending changes
  // 3. When an artboard is selected, only show changes if that artboard has changes (not 'clean')
  // 4. When at document level (nothing selected), always show changes if they exist
  const shouldShowChanges = changesToReview.length > 0 &&
    (!selectedBlockId || selectedBlock?.change_status === 'pending') &&
    (!selectedFrameId || (selectedFrame?.status !== 'clean'))

  // Sync button tooltip text
  const syncTooltipText = () => {
    if (isSyncing) {
      return `Syncing ${syncProgress.current} of ${syncProgress.total} artboards`
    }
    if (selectedFrameId) {
      const frame = frames.find(f => f.id === selectedFrameId)
      return `Sync ${frame?.name || 'this artboard'} only`
    }
    return 'Sync all artboards from Figma'
  }

  // Auto-select and scroll to first change when changes become available
  useEffect(() => {
    if (changesToReview.length > 0 && !selectedBlockId && !selectedFrameId) {
      const firstChange = changesToReview[0]
      if (firstChange) {
        setSelectedBlockId(firstChange.id)
        setFocusedFrameId(firstChange.frame_id)

        // Scroll to the text block position within the frame
        if (firstChange.frame_id && firstChange.frame_y !== null) {
          setTimeout(() => {
            const frameElement = frameRefs.current.get(firstChange.frame_id!)
            const frame = frames.find(f => f.id === firstChange.frame_id!)

            if (frameElement && canvasRef.current && frame) {
              const containerHeight = canvasRef.current.clientHeight
              const maxWidth = 1000
              const scale = Math.min(maxWidth / frame.width, 1)

              // Calculate text box position within the scaled frame
              const textBoxTopInFrame = (firstChange.y - frame.y) * scale
              const textBoxHeight = firstChange.height * scale

              // Calculate absolute position: frame top + header + text box position in frame
              const frameHeaderHeight = 60 // Approximate header height
              const textBoxAbsoluteTop = frameElement.offsetTop + frameHeaderHeight + textBoxTopInFrame

              // Center the text box in the viewport
              const scrollTo = textBoxAbsoluteTop - (containerHeight / 2) + (textBoxHeight / 2)

              canvasRef.current.scrollTo({
                top: scrollTo,
                behavior: 'smooth',
              })
            }
          }, 100)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changesToReview.length])

  // Keep current change index in sync when the current change is no longer in the list
  useEffect(() => {
    if (currentChangeIndex >= changesToReview.length && changesToReview.length > 0) {
      setCurrentChangeIndex(0)
    }
  }, [currentChangeIndex, changesToReview.length])

  const handleCanvasClick = () => {
    setSelectedBlockId(null)
    setSelectedFrameId(null)
  }

  const handleFrameAreaClick = (frameId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (selectedFrameId === frameId) {
      setSelectedBlockId(null)
      setSelectedFrameId(null)
    } else {
      setSelectedBlockId(null)
      setSelectedFrameId(frameId)
      setFocusedFrameId(frameId)
    }
  }

  // Scroll to frame when clicked in sidebar
  const scrollToFrame = (frameId: string) => {
    const frameElement = frameRefs.current.get(frameId)
    if (frameElement && canvasRef.current) {
      const containerTop = canvasRef.current.scrollTop
      const containerHeight = canvasRef.current.clientHeight
      const elementTop = frameElement.offsetTop
      const elementHeight = frameElement.clientHeight

      const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2)

      canvasRef.current.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      })
    }
    setFocusedFrameId(frameId)
    setSelectedFrameId(frameId)
    setSelectedBlockId(null)
  }

  // Detect which frame is in view while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!canvasRef.current) return

      const containerTop = canvasRef.current.scrollTop
      const containerHeight = canvasRef.current.clientHeight
      const viewportCenter = containerTop + containerHeight / 2

      let closestFrame: string | null = null
      let closestDistance = Infinity

      frameRefs.current.forEach((element, frameId) => {
        const elementTop = element.offsetTop
        const elementHeight = element.clientHeight
        const elementCenter = elementTop + elementHeight / 2

        const distance = Math.abs(elementCenter - viewportCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestFrame = frameId
        }
      })

      if (closestFrame && closestFrame !== focusedFrameId) {
        setFocusedFrameId(closestFrame)
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('scroll', handleScroll, { passive: true })
      return () => canvas.removeEventListener('scroll', handleScroll)
    }
  }, [focusedFrameId])

  // Helper function to render diff-style text changes
  const renderTextDiff = (oldText: string, newText: string) => {
    return (
      <div className="font-mono text-xs leading-relaxed">
        <div className="text-red-600 dark:text-red-400 line-through mb-1">
          {oldText}
        </div>
        <div className="text-green-600 dark:text-green-400">
          {newText}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1e1e1e] text-gray-900 dark:text-white">
      {/* Left Panel */}
      <LeftPanel
        projectName={projectName}
        projectStatus={projectStatus}
        frames={frames}
        focusedFrameId={focusedFrameId}
        focusedFrameBlocks={focusedFrameBlocks}
        selectedBlockId={selectedBlockId}
        leftPanelWidth={leftPanelWidth}
        thumbnailWidth={thumbnailWidth}
        pagesHeight={pagesHeight}
        isEditingProjectName={isEditingProjectName}
        editedProjectName={editedProjectName}
        loadingFrameIds={loadingFrameIds}
        onProjectNameDoubleClick={handleProjectNameDoubleClick}
        onProjectNameChange={setEditedProjectName}
        onProjectNameBlur={handleProjectNameBlur}
        onProjectNameKeyDown={handleProjectNameKeyDown}
        onScrollToFrame={scrollToFrame}
        onBlockClick={(blockId) => {
          setSelectedBlockId(blockId)
          setSelectedFrameId(null)
        }}
        onResizeLeft={() => setIsResizingLeft(true)}
        onResizePages={() => setIsResizingPages(true)}
      />

      {/* Center - Scrollable Canvas with All Frames */}
      <ScrollArea ref={canvasRef} className="flex-1 bg-white dark:bg-[#2c2c2c] overscroll-contain">
        {frames.length > 0 ? (
          <div className="py-8 space-y-12 min-h-full" onClick={handleCanvasClick}>
            {frames.map((frame, index) => {
              const frameBlocks = textBlocks.filter((b) => b.frame_id === frame.id)
              const maxWidth = 1000
              const scale = Math.min(maxWidth / frame.width, 1)

              return (
                <div
                  key={frame.id}
                  ref={(el) => {
                    if (el) frameRefs.current.set(frame.id, el)
                  }}
                  className="flex justify-center items-start px-8"
                >
                  <div
                    className="relative w-full max-w-[1200px]"
                    onClick={(e) => handleFrameAreaClick(frame.id, e)}
                  >
                    {/* Frame Header */}
                    <div
                      className="mb-4 flex items-center justify-between mx-auto"
                      style={{
                        width: frame.width * scale,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot status={frame.status} size="md" />
                        <h2 className="text-lg font-semibold">{frame.name}</h2>
                        <span className="text-xs text-gray-500">
                          Page {index + 1} of {frames.length}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {frame.width.toFixed(0)}×{frame.height.toFixed(0)}px
                      </div>
                    </div>

                    {/* Frame Canvas */}
                    <div
                      className={`relative bg-white rounded-lg shadow-2xl overflow-hidden mx-auto transition-all cursor-pointer ${
                        selectedFrameId === frame.id
                          ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-white dark:ring-offset-[#2c2c2c]'
                          : focusedFrameId === frame.id
                          ? 'ring-1 ring-gray-300 ring-offset-2 ring-offset-white dark:ring-offset-[#2c2c2c]'
                          : ''
                      }`}
                      style={{
                        width: frame.width * scale,
                        height: frame.height * scale,
                      }}
                    >
                      {/* Background image */}
                      {frame.image_url ? (
                        <img
                          src={frame.image_url}
                          alt={frame.name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white" />
                      )}

                      {/* Text box overlays */}
                      {frameBlocks.map((block) => {
                        const isSelected = selectedBlockId === block.id
                        const isPending = block.change_status === 'pending'

                        return (
                          <div
                            key={block.id}
                            className={`absolute cursor-pointer transition-all ${
                              isPending
                                ? 'border-2 border-yellow-400 bg-yellow-100/20'
                                : 'border-2 border-blue-400/70 bg-blue-100/20'
                            } ${
                              isSelected
                                ? 'z-10 border-blue-600 bg-blue-200/40 shadow-lg'
                                : 'hover:z-10 hover:border-blue-600 hover:bg-blue-200/40'
                            }`}
                            style={{
                              left: (block.x - frame.x) * scale,
                              top: (block.y - frame.y) * scale,
                              width: block.width * scale,
                              height: block.height * scale,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTextBoxClick(block.id)
                              setFocusedFrameId(frame.id)
                            }}
                            onDoubleClick={(e) => handleTextBoxDoubleClick(block, e)}
                            title="Double-click to copy text"
                          >
                            {isPending && (
                              <div className="absolute -top-2 -right-2">
                                <StatusDot status="pending" size="md" className="border-2 border-white" />
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Loading overlay for artboard */}
                      {loadingFrameIds.has(frame.id) && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                          <div className="text-center">
                            <svg
                              className="w-16 h-16 text-white animate-spin mb-2 mx-auto"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <p className="text-white text-sm font-medium">Syncing...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No frames available</p>
          </div>
        )}
      </ScrollArea>

      {/* Right Panel */}
      <RightPanel
        rightPanelWidth={rightPanelWidth}
        selectedBlock={selectedBlock}
        selectedFrame={selectedFrame}
        frames={frames}
        frameChanges={frameChanges}
        allChanges={allChanges}
        changesToReview={changesToReview}
        currentChangeIndex={currentChangeIndex}
        currentChange={currentChange}
        currentChangeDetails={currentChangeDetails}
        shouldShowChanges={shouldShowChanges}
        projectStatus={projectStatus}
        isSyncing={isSyncing}
        syncTooltipText={syncTooltipText()}
        onResizeRight={() => setIsResizingRight(true)}
        onSyncClick={handleSyncClick}
        onExport={onExport}
        onCopyValue={handleCopyValue}
        onAcceptChange={handleAcceptChange}
        onAcceptAllChanges={handleAcceptAllChangesWrapper}
        onSkipChange={handleSkipChange}
        onNextChange={handleNextChange}
        onPreviousChange={handlePreviousChange}
        onAcceptCurrentChange={handleAcceptCurrentChange}
        renderTextDiff={renderTextDiff}
        getTextBlockChanges={getTextBlockChanges}
      />
    </div>
  )
}
