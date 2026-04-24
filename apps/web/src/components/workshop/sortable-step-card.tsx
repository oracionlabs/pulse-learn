'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { WorkshopStep } from '@pulse/shared'
import {
  GripVertical,
  FileText,
  HelpCircle,
  GitBranch,
  MessageSquare,
  Play,
  Trash2,
} from 'lucide-react'

const stepIcons: Record<string, React.ElementType> = {
  content: FileText,
  quiz: HelpCircle,
  scenario: GitBranch,
  reflection: MessageSquare,
  video: Play,
}

const stepColors: Record<string, string> = {
  content: 'bg-blue-50 text-blue-600',
  quiz: 'bg-amber-50 text-amber-600',
  scenario: 'bg-purple-50 text-purple-600',
  reflection: 'bg-emerald-50 text-emerald-600',
  video: 'bg-rose-50 text-rose-600',
}

interface SortableStepCardProps {
  step: WorkshopStep
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SortableStepCard({
  step,
  index,
  isSelected,
  onSelect,
  onDelete,
}: SortableStepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.stepId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = stepIcons[step.type] ?? FileText
  const colorClass = stepColors[step.type] ?? 'bg-gray-50 text-gray-600'

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-md)] border bg-white px-3 py-3 cursor-pointer transition-all duration-150',
        isSelected
          ? 'border-brand shadow-[0_0_0_2px_rgba(99,102,241,0.15)]'
          : 'border-border hover:border-brand/40',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Step number */}
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-600">
        {index + 1}
      </span>

      {/* Icon */}
      <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px]', colorClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">
          {step.title || `${step.type.charAt(0).toUpperCase() + step.type.slice(1)} step`}
        </p>
        <p className="text-[10px] text-text-muted capitalize">{step.type}</p>
      </div>

      {/* Points */}
      <span className="text-[10px] font-medium text-text-muted">{step.points}pt</span>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="text-text-muted hover:text-danger transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
