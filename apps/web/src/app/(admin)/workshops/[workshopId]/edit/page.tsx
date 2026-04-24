'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SortableStepCard } from '@/components/workshop/sortable-step-card'
import { StepBuilder } from '@/components/workshop/step-builder'
import { setSelectedStep, setLocalSteps, reorderSteps } from '@/store/slices/workshopSlice'
import type { RootState } from '@/store'
import type { Workshop, WorkshopStep, StepType } from '@pulse/shared'
import {
  ArrowLeft,
  Eye,
  Globe,
  GlobeLock,
  Plus,
  Save,
  ChevronDown,
  Check,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const STEP_TYPES: { type: StepType; label: string }[] = [
  { type: 'content', label: 'Content' },
  { type: 'quiz', label: 'Quiz' },
  { type: 'scenario', label: 'Scenario' },
  { type: 'reflection', label: 'Reflection' },
  { type: 'video', label: 'Video' },
]

export default function WorkshopEditPage({
  params,
}: {
  params: Promise<{ workshopId: string }>
}) {
  const { workshopId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const { selectedStepId, localSteps } = useSelector((s: RootState) => s.workshop)

  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    vertical: 'general',
    difficulty: 'beginner',
    estimatedMinutes: 5,
  })
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const { data: workshop, isLoading } = useQuery<Workshop>({
    queryKey: ['workshop', workshopId],
    queryFn: () => api.get(`/orgs/${orgId}/workshops/${workshopId}`, token),
    enabled: !!orgId,
  })

  useEffect(() => {
    if (workshop) {
      // eslint-disable-next-line
      setMetadata({
        title: workshop.title,
        description: workshop.description,
        vertical: workshop.vertical,
        difficulty: workshop.difficulty,
        estimatedMinutes: workshop.estimatedMinutes,
      })
      dispatch(setLocalSteps(workshop.steps))
    }
  }, [workshop, dispatch])

  const selectedStep = localSteps.find((s) => s.stepId === selectedStepId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localSteps.findIndex((s) => s.stepId === active.id)
    const newIndex = localSteps.findIndex((s) => s.stepId === over.id)
    const reordered = arrayMove(localSteps, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }))

    dispatch(reorderSteps(reordered))

    // Persist reorder
    api.patch(
      `/orgs/${orgId}/workshops/${workshopId}/steps/reorder`,
      { orderedStepIds: reordered.map((s) => s.stepId) },
      token,
    )
  }

  function addStep(type: StepType) {
    const newStep: WorkshopStep = {
      stepId: uuidv4(),
      order: localSteps.length,
      type,
      title: '',
      animationType: 'slide_up',
      points: 10,
    }

    const updated = [...localSteps, newStep]
    dispatch(setLocalSteps(updated))
    dispatch(setSelectedStep(newStep.stepId))
    setShowAddMenu(false)

    api.post(`/orgs/${orgId}/workshops/${workshopId}/steps`, newStep, token).then(() => {
      queryClient.invalidateQueries({ queryKey: ['workshop', workshopId] })
    })
  }

  function updateStep(updated: WorkshopStep) {
    const newSteps = localSteps.map((s) => (s.stepId === updated.stepId ? updated : s))
    dispatch(setLocalSteps(newSteps))

    api.put(
      `/orgs/${orgId}/workshops/${workshopId}/steps/${updated.stepId}`,
      updated,
      token,
    )
  }

  function deleteStep(stepId: string) {
    const newSteps = localSteps
      .filter((s) => s.stepId !== stepId)
      .map((s, i) => ({ ...s, order: i }))
    dispatch(setLocalSteps(newSteps))
    if (selectedStepId === stepId) dispatch(setSelectedStep(null))

    api.delete(`/orgs/${orgId}/workshops/${workshopId}/steps/${stepId}`, token)
  }

  async function saveMetadata() {
    setIsSaving(true)
    await api.put(`/orgs/${orgId}/workshops/${workshopId}`, metadata, token)
    queryClient.invalidateQueries({ queryKey: ['workshop', workshopId] })
    setIsSaving(false)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2000)
  }

  async function togglePublish() {
    if (!workshop) return
    setIsPublishing(true)
    const endpoint = workshop.isPublished ? 'unpublish' : 'publish'
    await api.post(`/orgs/${orgId}/workshops/${workshopId}/${endpoint}`, {}, token)
    queryClient.invalidateQueries({ queryKey: ['workshop', workshopId] })
    setIsPublishing(false)
  }

  const totalPoints = localSteps.reduce((sum, s) => sum + (s.points ?? 0), 0)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workshops')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-semibold text-text-primary">{metadata.title || 'Untitled Workshop'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {workshop?.isPublished ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
              <span className="text-[11px] text-text-muted">{localSteps.length} steps · {totalPoints} pts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workshops/${workshopId}/preview`)}
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={togglePublish} loading={isPublishing}>
            {!isPublishing && (workshop?.isPublished ? (
              <><GlobeLock className="h-4 w-4" /> Unpublish</>
            ) : (
              <><Globe className="h-4 w-4" /> Publish</>
            ))}
          </Button>
          <Button size="sm" onClick={saveMetadata} loading={isSaving} disabled={isSaving || savedOk}>
            {savedOk ? (
              <><Check className="h-4 w-4" /> Saved</>
            ) : (
              <><Save className="h-4 w-4" /> Save</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — metadata */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Workshop info</p>

          <Input
            label="Title"
            value={metadata.title}
            onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
          />
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Description</label>
            <textarea
              rows={3}
              value={metadata.description}
              onChange={(e) => setMetadata((m) => ({ ...m, description: e.target.value }))}
              className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Vertical</label>
            <select
              value={metadata.vertical}
              onChange={(e) => setMetadata((m) => ({ ...m, vertical: e.target.value }))}
              className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {['security', 'compliance', 'onboarding', 'sales', 'customer_ed', 'general'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Difficulty</label>
            <select
              value={metadata.difficulty}
              onChange={(e) => setMetadata((m) => ({ ...m, difficulty: e.target.value }))}
              className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {['beginner', 'intermediate', 'advanced'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Est. minutes</label>
            <input
              type="number"
              min={1}
              value={metadata.estimatedMinutes}
              onChange={(e) => setMetadata((m) => ({ ...m, estimatedMinutes: parseInt(e.target.value) || 5 }))}
              className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        {/* Middle panel — step list */}
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-page overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Steps</p>

            {/* Add step dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMenu((o) => !o)}
              >
                <Plus className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-[var(--radius-md)] border border-border bg-white shadow-lg z-10">
                  {STEP_TYPES.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => addStep(type)}
                      className="flex w-full items-center px-3 py-2 text-sm text-text-primary hover:bg-page transition-colors first:rounded-t-[var(--radius-md)] last:rounded-b-[var(--radius-md)]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localSteps.map((s) => s.stepId)}
                strategy={verticalListSortingStrategy}
              >
                {localSteps.map((step, i) => (
                  <SortableStepCard
                    key={step.stepId}
                    step={step}
                    index={i}
                    isSelected={selectedStepId === step.stepId}
                    onSelect={() => dispatch(setSelectedStep(step.stepId))}
                    onDelete={() => deleteStep(step.stepId)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {localSteps.length === 0 && (
              <p className="text-center text-xs text-text-muted py-8">
                No steps yet. Add your first step.
              </p>
            )}
          </div>
        </div>

        {/* Right panel — step editor */}
        <div className="flex-1 overflow-y-auto bg-page p-6">
          {selectedStep ? (
            <div className="max-w-xl mx-auto">
              <div className="rounded-[var(--radius-lg)] border border-border bg-white p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {selectedStep.type} step
                  </p>
                  <Badge variant="outline">Step {localSteps.findIndex(s => s.stepId === selectedStep.stepId) + 1}</Badge>
                </div>
                <StepBuilder
                  step={selectedStep}
                  onChange={updateStep}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm font-medium text-text-primary">Select a step to edit</p>
              <p className="text-xs text-text-muted mt-1">Or add a new step from the panel on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
