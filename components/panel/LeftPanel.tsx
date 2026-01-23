'use client'

import { Panel, PanelSection, ResizeHandle } from '.'
import { StatusDot } from '../StatusDot'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import type { FrameWithStatus, TextBlock, ProjectStatus } from '@/lib/types'

interface LeftPanelProps {
  projectName: string
  projectStatus: ProjectStatus
  frames: FrameWithStatus[]
  focusedFrameId: string | null
  focusedFrameBlocks: TextBlock[]
  selectedBlockId: string | null
  leftPanelWidth: number
  thumbnailWidth: number
  pagesHeight: number | null
  isEditingProjectName: boolean
  editedProjectName: string
  loadingFrameIds: Set<string>
  onProjectNameDoubleClick: () => void
  onProjectNameChange: (value: string) => void
  onProjectNameBlur: () => void
  onProjectNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onScrollToFrame: (frameId: string) => void
  onBlockClick: (blockId: string) => void
  onResizeLeft: () => void
  onResizePages: () => void
}

export function LeftPanel({
  projectName,
  projectStatus,
  frames,
  focusedFrameId,
  focusedFrameBlocks,
  selectedBlockId,
  leftPanelWidth,
  thumbnailWidth,
  pagesHeight,
  isEditingProjectName,
  editedProjectName,
  loadingFrameIds,
  onProjectNameDoubleClick,
  onProjectNameChange,
  onProjectNameBlur,
  onProjectNameKeyDown,
  onScrollToFrame,
  onBlockClick,
  onResizeLeft,
  onResizePages,
}: LeftPanelProps) {
  const focusedFrame = frames.find((f) => f.id === focusedFrameId)

  return (
    <Panel width={leftPanelWidth} side="left">
      {/* Project Header */}
      <PanelSection className="border-b border-gray-300 dark:border-[#3e3e3e] space-y-2">
        {/* Home Icon */}
        <a
          href="/"
          className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Home"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </a>

        {/* Project Name */}
        {isEditingProjectName ? (
          <input
            type="text"
            value={editedProjectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onBlur={onProjectNameBlur}
            onKeyDown={onProjectNameKeyDown}
            className="w-full text-sm font-semibold bg-transparent border border-blue-500 rounded px-2 py-1 outline-none"
            autoFocus
          />
        ) : (
          <div
            className="text-sm font-semibold truncate cursor-pointer hover:text-blue-500 transition-colors"
            onDoubleClick={onProjectNameDoubleClick}
            title="Double-click to edit"
          >
            {projectName}
          </div>
        )}

        {/* Version with Indicator */}
        <div className="flex items-center gap-2">
          <StatusDot status={projectStatus} size="sm" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Version 2
          </span>
        </div>
      </PanelSection>

      {/* Pages List */}
      <div className="border-b border-gray-300 dark:border-[#3e3e3e] relative">
        <div className="p-2 text-xs text-gray-600 dark:text-gray-400 font-semibold px-4 py-2">
          PAGES
        </div>
        <ScrollArea
          className="overscroll-contain"
          style={{ height: pagesHeight || 300 }}
        >
          <div className="space-y-3 px-3 pb-3 flex flex-col items-center">
            {frames.map((frame, index) => {
              const aspectRatio = frame.height / frame.width
              const thumbnailHeight = thumbnailWidth * aspectRatio

              return (
                <div
                  key={frame.id}
                  className={`relative rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all ${
                    focusedFrameId === frame.id
                      ? 'ring-2 ring-blue-500'
                      : 'ring-1 ring-gray-300 dark:ring-[#3e3e3e]'
                  }`}
                  style={{ width: thumbnailWidth }}
                  onClick={() => onScrollToFrame(frame.id)}
                >
                  {/* Status indicator */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                    <StatusDot status={frame.status} size="sm" />
                    <span className="text-[10px] text-white font-medium">
                      Page {index + 1}
                    </span>
                    {frame.pendingChangesCount > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                        {frame.pendingChangesCount}
                      </Badge>
                    )}
                  </div>

                  {/* Thumbnail image */}
                  {frame.image_url ? (
                    <img
                      src={frame.image_url}
                      alt={frame.name}
                      className="w-full object-cover rounded"
                      style={{
                        height: `${Math.min(thumbnailHeight, 300)}px`,
                      }}
                    />
                  ) : (
                    <div
                      className="w-full bg-gray-200 dark:bg-[#1e1e1e] rounded flex items-center justify-center text-gray-400 dark:text-gray-500"
                      style={{
                        height: `${Math.min(thumbnailHeight, 300)}px`,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{index + 1}</div>
                        <div className="text-xs">No preview</div>
                      </div>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {loadingFrameIds.has(frame.id) && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white animate-spin"
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
                    </div>
                  )}

                  {/* Page name label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b">
                    <p className="text-xs text-white truncate">{frame.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <ResizeHandle
          direction="horizontal"
          position="bottom"
          onMouseDown={onResizePages}
        />
      </div>

      {/* Layers for focused page */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 text-xs text-gray-600 dark:text-gray-400 font-semibold px-4 py-2 border-b border-gray-300 dark:border-[#3e3e3e]">
          LAYERS{focusedFrame ? ` · ${focusedFrame.name}` : ''}
        </div>
        <ScrollArea className="flex-1 overscroll-contain">
          {focusedFrame && focusedFrameBlocks.length > 0 ? (
            <div className="space-y-0.5 px-2 py-2">
              {focusedFrameBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3e3e3e] transition-colors ${
                    selectedBlockId === block.id ? 'bg-gray-200 dark:bg-[#3e3e3e]' : ''
                  }`}
                  onClick={() => onBlockClick(block.id)}
                >
                  <StatusDot status={block.change_status} size="sm" />
                  <svg
                    className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-xs truncate flex-1">
                    {block.content.substring(0, 25)}
                    {block.content.length > 25 ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              {focusedFrame
                ? 'No text layers in this page'
                : 'Select a page to view layers'}
            </div>
          )}
        </ScrollArea>
      </div>

      <ResizeHandle
        direction="vertical"
        position="right"
        onMouseDown={onResizeLeft}
      />
    </Panel>
  )
}
