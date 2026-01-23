'use client'

import React from 'react'
import { Panel, PanelSection, PanelHeader, ResizeHandle } from '.'
import { StatusDot } from '../StatusDot'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'
import { SplitButton } from '../ui/split-button'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import type { TextBlock, FrameWithStatus, ProjectStatus, TextBlockChange } from '@/lib/types'

interface RightPanelProps {
  rightPanelWidth: number
  selectedBlock: TextBlock | undefined
  selectedFrame: FrameWithStatus | undefined
  frames: FrameWithStatus[]
  frameChanges: TextBlock[]
  allChanges: TextBlock[]
  changesToReview: TextBlock[]
  currentChangeIndex: number
  currentChange: TextBlock | null
  currentChangeDetails: TextBlockChange[]
  shouldShowChanges: boolean
  projectStatus: ProjectStatus
  isSyncing: boolean
  syncTooltipText: string
  onResizeRight: () => void
  onSyncClick: () => void
  onExport: () => void
  onCopyValue: (value: string, label: string) => void
  onAcceptChange: (blockId: string) => void
  onAcceptAllChanges: () => void
  onSkipChange: () => void
  onNextChange: () => void
  onPreviousChange: () => void
  onAcceptCurrentChange: () => void
  renderTextDiff: (oldText: string, newText: string) => React.ReactElement
  getTextBlockChanges: (block: TextBlock) => TextBlockChange[]
}

export function RightPanel({
  rightPanelWidth,
  selectedBlock,
  selectedFrame,
  frames,
  frameChanges,
  allChanges,
  changesToReview,
  currentChangeIndex,
  currentChange,
  currentChangeDetails,
  shouldShowChanges,
  projectStatus,
  isSyncing,
  syncTooltipText,
  onResizeRight,
  onSyncClick,
  onExport,
  onCopyValue,
  onAcceptChange,
  onAcceptAllChanges,
  onSkipChange,
  onNextChange,
  onPreviousChange,
  onAcceptCurrentChange,
  renderTextDiff,
  getTextBlockChanges,
}: RightPanelProps) {
  return (
    <Panel width={rightPanelWidth} side="right">
      <ResizeHandle
        direction="vertical"
        position="left"
        onMouseDown={onResizeRight}
      />

      {/* Top Actions Bar */}
      <PanelSection className="border-b border-gray-300 dark:border-[#3e3e3e] flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                size="sm"
                variant="ghost"
                onClick={onSyncClick}
                disabled={isSyncing}
                className="px-2"
              >
                <svg
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
            )}
          />
          <TooltipContent>{syncTooltipText}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} size="sm" variant="ghost" className="px-2">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Button>
            )}
          />
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} size="sm" onClick={onExport} className="px-3">
                Export
              </Button>
            )}
          />
          <TooltipContent>Export to Affinity</TooltipContent>
        </Tooltip>
      </PanelSection>

      {/* Properties Content */}
      <ScrollArea className="flex-1 overscroll-contain">
        {selectedBlock ? (
          <TextBlockProperties
            selectedBlock={selectedBlock}
            changesToReview={changesToReview}
            currentChangeIndex={currentChangeIndex}
            currentChange={currentChange}
            currentChangeDetails={currentChangeDetails}
            shouldShowChanges={shouldShowChanges}
            onCopyValue={onCopyValue}
            onAcceptCurrentChange={onAcceptCurrentChange}
            onAcceptAllChanges={onAcceptAllChanges}
            onSkipChange={onSkipChange}
            onNextChange={onNextChange}
            onPreviousChange={onPreviousChange}
          />
        ) : selectedFrame ? (
          <ArtboardChanges
            selectedFrame={selectedFrame}
            frameChanges={frameChanges}
            changesToReview={changesToReview}
            currentChangeIndex={currentChangeIndex}
            currentChange={currentChange}
            currentChangeDetails={currentChangeDetails}
            onAcceptChange={onAcceptChange}
            onAcceptAllChanges={onAcceptAllChanges}
            onSkipChange={onSkipChange}
            onNextChange={onNextChange}
            onPreviousChange={onPreviousChange}
            onAcceptCurrentChange={onAcceptCurrentChange}
            renderTextDiff={renderTextDiff}
          />
        ) : (
          <DocumentChanges
            projectStatus={projectStatus}
            allChanges={allChanges}
            frames={frames}
            changesToReview={changesToReview}
            currentChangeIndex={currentChangeIndex}
            currentChange={currentChange}
            currentChangeDetails={currentChangeDetails}
            onAcceptChange={onAcceptChange}
            onAcceptAllChanges={onAcceptAllChanges}
            onSkipChange={onSkipChange}
            onNextChange={onNextChange}
            onPreviousChange={onPreviousChange}
            onAcceptCurrentChange={onAcceptCurrentChange}
            renderTextDiff={renderTextDiff}
          />
        )}
      </ScrollArea>
    </Panel>
  )
}

// Text Block Properties Component
function TextBlockProperties({
  selectedBlock,
  changesToReview,
  currentChangeIndex,
  currentChange,
  currentChangeDetails,
  shouldShowChanges,
  onCopyValue,
  onAcceptCurrentChange,
  onAcceptAllChanges,
  onSkipChange,
  onNextChange,
  onPreviousChange,
}: {
  selectedBlock: TextBlock
  changesToReview: TextBlock[]
  currentChangeIndex: number
  currentChange: TextBlock | null
  currentChangeDetails: TextBlockChange[]
  shouldShowChanges: boolean
  onCopyValue: (value: string, label: string) => void
  onAcceptCurrentChange: () => void
  onAcceptAllChanges: () => void
  onSkipChange: () => void
  onNextChange: () => void
  onPreviousChange: () => void
}) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <PanelSection>
        <div className="flex items-center gap-2 mb-2">
          <StatusDot status={selectedBlock.change_status} size="md" />
          <h3 className="font-semibold">Text Block</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {selectedBlock.content}
        </p>
      </PanelSection>

      <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />

      {/* Layout */}
      <PanelSection>
        <PanelHeader>LAYOUT</PanelHeader>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'X', value: selectedBlock.x.toFixed(0) },
              { label: 'Y', value: selectedBlock.y.toFixed(0) },
            ].map(({ label, value }) => (
              <PropertyField
                key={label}
                label={label}
                value={value}
                onCopy={() => onCopyValue(value, label)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'W', value: selectedBlock.width.toFixed(0) },
              { label: 'H', value: selectedBlock.height.toFixed(0) },
            ].map(({ label, value }) => (
              <PropertyField
                key={label}
                label={label}
                value={value}
                onCopy={() => onCopyValue(value, label)}
              />
            ))}
          </div>
        </div>
      </PanelSection>

      <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />

      {/* Style */}
      <PanelSection>
        <PanelHeader>STYLE</PanelHeader>
        <div className="group flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#3e3e3e] rounded text-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <span className="text-gray-900 dark:text-white">{selectedBlock.style}</span>
          <button
            onClick={() => onCopyValue(selectedBlock.style, 'Style')}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded"
            title="Copy style"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </PanelSection>

      {/* Change Review Section */}
      {shouldShowChanges && changesToReview.length > 0 && currentChange && (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection>
            <PanelHeader className="mb-3">CHANGES</PanelHeader>

            {currentChangeDetails.length > 0 && (
              <div className="space-y-3">
                {currentChangeDetails.map((change, index) => (
                  <div key={index}>
                    {/* Counter and navigation buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {currentChangeIndex + 1} of {changesToReview.length} Changes
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={onPreviousChange}
                          disabled={currentChangeIndex === 0}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Previous change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={onNextChange}
                          disabled={currentChangeIndex === changesToReview.length - 1}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Next change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {change.type === 'content' ? (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3 space-y-1">
                        <div className="text-red-600 dark:text-red-400 line-through">
                          {change.oldValue}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {change.newValue}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {change.label}: {change.oldValue} → {change.newValue}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={onSkipChange}
                className="flex-1"
              >
                Later
              </Button>
              <SplitButton
                onPrimaryAction={onAcceptCurrentChange}
                onSecondaryAction={onAcceptAllChanges}
                primaryLabel="Accept"
                secondaryLabel="Accept All"
                className="flex-1"
              />
            </div>
          </PanelSection>
        </>
      )}

      {changesToReview.length === 0 && selectedBlock.change_status === 'clean' && (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection className="text-xs text-gray-500 dark:text-gray-400">
            No changes detected for this text block.
          </PanelSection>
        </>
      )}
    </div>
  )
}

// Artboard Changes Component
function ArtboardChanges({
  selectedFrame,
  frameChanges,
  changesToReview,
  currentChangeIndex,
  currentChange,
  currentChangeDetails,
  onAcceptChange,
  onAcceptAllChanges,
  onSkipChange,
  onNextChange,
  onPreviousChange,
  onAcceptCurrentChange,
  renderTextDiff,
}: {
  selectedFrame: FrameWithStatus
  frameChanges: TextBlock[]
  changesToReview: TextBlock[]
  currentChangeIndex: number
  currentChange: TextBlock | null
  currentChangeDetails: TextBlockChange[]
  onAcceptChange: (blockId: string) => void
  onAcceptAllChanges: () => void
  onSkipChange: () => void
  onNextChange: () => void
  onPreviousChange: () => void
  onAcceptCurrentChange: () => void
  renderTextDiff: (oldText: string, newText: string) => React.ReactElement
}) {
  const pendingChanges = frameChanges.filter(b => b.change_status === 'pending')

  return (
    <div className="space-y-0">
      <PanelSection>
        <div className="flex items-center gap-2 mb-2">
          <StatusDot status={selectedFrame.status} size="md" />
          <h3 className="font-semibold">Artboard Changes</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedFrame.name}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {pendingChanges.length} {pendingChanges.length === 1 ? 'change' : 'changes'} in this artboard
        </p>
      </PanelSection>

      {pendingChanges.length > 0 && currentChange ? (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection>
            <PanelHeader className="mb-3">CHANGES</PanelHeader>

            {currentChangeDetails.length > 0 && (
              <div className="space-y-3">
                {currentChangeDetails.map((change, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {currentChangeIndex + 1} of {changesToReview.length} Changes
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={onPreviousChange}
                          disabled={currentChangeIndex === 0}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Previous change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={onNextChange}
                          disabled={currentChangeIndex === changesToReview.length - 1}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Next change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {currentChange.content}
                    </div>

                    {change.type === 'content' ? (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3 space-y-1">
                        <div className="text-red-600 dark:text-red-400 line-through">
                          {change.oldValue}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {change.newValue}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {change.label}: {change.oldValue} → {change.newValue}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={onSkipChange}
                className="flex-1"
              >
                Later
              </Button>
              <SplitButton
                onPrimaryAction={onAcceptCurrentChange}
                onSecondaryAction={onAcceptAllChanges}
                primaryLabel="Accept"
                secondaryLabel="Accept All"
                className="flex-1"
              />
            </div>
          </PanelSection>
        </>
      ) : (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection className="text-xs text-gray-500 dark:text-gray-400 text-center">
            No pending changes in this artboard.
          </PanelSection>
        </>
      )}
    </div>
  )
}

// Document Changes Component
function DocumentChanges({
  projectStatus,
  allChanges,
  frames,
  changesToReview,
  currentChangeIndex,
  currentChange,
  currentChangeDetails,
  onAcceptChange,
  onAcceptAllChanges,
  onSkipChange,
  onNextChange,
  onPreviousChange,
  onAcceptCurrentChange,
  renderTextDiff,
}: {
  projectStatus: ProjectStatus
  allChanges: TextBlock[]
  frames: FrameWithStatus[]
  changesToReview: TextBlock[]
  currentChangeIndex: number
  currentChange: TextBlock | null
  currentChangeDetails: TextBlockChange[]
  onAcceptChange: (blockId: string) => void
  onAcceptAllChanges: () => void
  onSkipChange: () => void
  onNextChange: () => void
  onPreviousChange: () => void
  onAcceptCurrentChange: () => void
  renderTextDiff: (oldText: string, newText: string) => React.ReactElement
}) {
  const currentBlockFrame = currentChange ? frames.find((f) => f.id === currentChange.frame_id) : null

  return (
    <div className="space-y-0">
      <PanelSection>
        <div className="flex items-center gap-2 mb-2">
          <StatusDot status={projectStatus} size="md" />
          <h3 className="font-semibold">Document Changes</h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {changesToReview.length} {changesToReview.length === 1 ? 'change' : 'changes'} to review across all artboards
        </p>
      </PanelSection>

      {changesToReview.length > 0 && currentChange ? (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection>
            <PanelHeader className="mb-3">CHANGES</PanelHeader>

            {currentChangeDetails.length > 0 && (
              <div className="space-y-3">
                {currentChangeDetails.map((change, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {currentChangeIndex + 1} of {changesToReview.length} Changes
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={onPreviousChange}
                          disabled={currentChangeIndex === 0}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Previous change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={onNextChange}
                          disabled={currentChangeIndex === changesToReview.length - 1}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Next change"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {currentBlockFrame && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        {currentBlockFrame.name}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {currentChange.content}
                    </div>

                    {change.type === 'content' ? (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3 space-y-1">
                        <div className="text-red-600 dark:text-red-400 line-through">
                          {change.oldValue}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {change.newValue}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {change.label}: {change.oldValue} → {change.newValue}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={onSkipChange}
                className="flex-1"
              >
                Later
              </Button>
              <SplitButton
                onPrimaryAction={onAcceptCurrentChange}
                onSecondaryAction={onAcceptAllChanges}
                primaryLabel="Accept"
                secondaryLabel="Accept All"
                className="flex-1"
              />
            </div>
          </PanelSection>
        </>
      ) : (
        <>
          <Separator className="bg-gray-300 dark:bg-[#3e3e3e]" />
          <PanelSection className="text-xs text-gray-500 dark:text-gray-400 text-center">
            No pending changes in this document.
          </PanelSection>
        </>
      )}
    </div>
  )
}

// Property Field Component
function PropertyField({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy: () => void
}) {
  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#3e3e3e] rounded text-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
        {label}
      </span>
      <span className="text-gray-900 dark:text-white flex-1">{value}</span>
      <button
        onClick={onCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded flex-shrink-0"
        title="Copy value"
      >
        <svg
          className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  )
}
