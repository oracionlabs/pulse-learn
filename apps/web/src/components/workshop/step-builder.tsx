'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WorkshopStep, ScenarioChoice } from '@pulse/shared'
import { Plus, Trash2, Check } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface StepBuilderProps {
  step: WorkshopStep
  onChange: (updated: WorkshopStep) => void
}

export function StepBuilder({ step, onChange }: StepBuilderProps) {
  function update(patch: Partial<WorkshopStep>) {
    onChange({ ...step, ...patch })
  }

  return (
    <div className="space-y-4">
      {/* Common fields */}
      <Input
        label="Step title"
        value={step.title}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Step title (optional)"
      />

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-text-primary block mb-1.5">Points</label>
          <input
            type="number"
            min={0}
            max={100}
            value={step.points}
            onChange={(e) => update({ points: parseInt(e.target.value) || 0 })}
            className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-text-primary block mb-1.5">Animation</label>
          <select
            value={step.animationType}
            onChange={(e) => update({ animationType: e.target.value as WorkshopStep['animationType'] })}
            className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="slide_up">Slide Up</option>
            <option value="fade_in">Fade In</option>
            <option value="bounce">Bounce</option>
            <option value="typewriter">Typewriter</option>
          </select>
        </div>
      </div>

      {/* Type-specific editors */}
      {step.type === 'content' && <ContentEditor step={step} onChange={update} />}
      {step.type === 'quiz' && <QuizEditor step={step} onChange={update} />}
      {step.type === 'scenario' && <ScenarioEditor step={step} onChange={update} />}
      {step.type === 'reflection' && <ReflectionEditor step={step} onChange={update} />}
      {step.type === 'video' && <VideoEditor step={step} onChange={update} />}
    </div>
  )
}

function ContentEditor({ step, onChange }: { step: WorkshopStep; onChange: (p: Partial<WorkshopStep>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-1.5">Content (Markdown)</label>
        <textarea
          value={step.content?.body ?? ''}
          onChange={(e) =>
            onChange({ content: { ...step.content, body: e.target.value } })
          }
          rows={8}
          placeholder="Write your content in Markdown…"
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none font-mono"
        />
      </div>
      <Input
        label="Media URL (optional)"
        value={step.content?.mediaUrl ?? ''}
        onChange={(e) =>
          onChange({ content: { ...step.content, body: step.content?.body ?? '', mediaUrl: e.target.value } })
        }
        placeholder="https://…"
      />
    </div>
  )
}

function QuizEditor({ step, onChange }: { step: WorkshopStep; onChange: (p: Partial<WorkshopStep>) => void }) {
  const quiz = step.quiz ?? { question: '', options: ['', ''], correctAnswerIndex: 0, explanation: '' }

  function updateQuiz(patch: Partial<typeof quiz>) {
    onChange({ quiz: { ...quiz, ...patch } })
  }

  function updateOption(idx: number, value: string) {
    const options = [...quiz.options]
    options[idx] = value
    updateQuiz({ options })
  }

  function addOption() {
    updateQuiz({ options: [...quiz.options, ''] })
  }

  function removeOption(idx: number) {
    const options = quiz.options.filter((_, i) => i !== idx)
    const correctAnswerIndex = quiz.correctAnswerIndex >= options.length
      ? options.length - 1
      : quiz.correctAnswerIndex
    updateQuiz({ options, correctAnswerIndex })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-1.5">Question</label>
        <textarea
          rows={2}
          value={quiz.question}
          onChange={(e) => updateQuiz({ question: e.target.value })}
          placeholder="What is the question?"
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-primary">
            Options <span className="text-text-muted font-normal">(click circle to mark correct)</span>
          </label>
          <Button variant="ghost" size="sm" onClick={addOption}>
            <Plus className="h-3.5 w-3.5" /> Add option
          </Button>
        </div>
        <div className="space-y-2">
          {quiz.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => updateQuiz({ correctAnswerIndex: i })}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  quiz.correctAnswerIndex === i
                    ? 'border-success bg-success text-white'
                    : 'border-border hover:border-brand'
                }`}
              >
                {quiz.correctAnswerIndex === i && <Check className="h-3 w-3" />}
              </button>
              <input
                value={option}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 h-8 rounded-[var(--radius-sm)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <button
                onClick={() => removeOption(i)}
                disabled={quiz.options.length <= 2}
                className="text-text-muted hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-primary block mb-1.5">Explanation (shown after answer)</label>
        <textarea
          rows={2}
          value={quiz.explanation}
          onChange={(e) => updateQuiz({ explanation: e.target.value })}
          placeholder="Explain the correct answer…"
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
      </div>
    </div>
  )
}

function ScenarioEditor({ step, onChange }: { step: WorkshopStep; onChange: (p: Partial<WorkshopStep>) => void }) {
  const scenario = step.scenario ?? { prompt: '', choices: [] }

  function updateScenario(patch: Partial<typeof scenario>) {
    onChange({ scenario: { ...scenario, ...patch } })
  }

  function addChoice() {
    updateScenario({
      choices: [
        ...scenario.choices,
        { id: uuidv4(), text: '', feedback: '', isCorrect: false },
      ],
    })
  }

  function updateChoice(idx: number, patch: Partial<ScenarioChoice>) {
    const choices = [...scenario.choices]
    choices[idx] = { ...choices[idx], ...patch }
    updateScenario({ choices })
  }

  function removeChoice(idx: number) {
    updateScenario({ choices: scenario.choices.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-1.5">Scenario prompt</label>
        <textarea
          rows={3}
          value={scenario.prompt}
          onChange={(e) => updateScenario({ prompt: e.target.value })}
          placeholder="Describe the scenario the learner faces…"
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-primary">Choices</label>
          <Button variant="ghost" size="sm" onClick={addChoice}>
            <Plus className="h-3.5 w-3.5" /> Add choice
          </Button>
        </div>
        <div className="space-y-3">
          {scenario.choices.map((choice, i) => (
            <div key={choice.id} className="rounded-[var(--radius-md)] border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateChoice(i, { isCorrect: !choice.isCorrect })}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    choice.isCorrect ? 'border-success bg-success text-white' : 'border-border hover:border-brand'
                  }`}
                >
                  {choice.isCorrect && <Check className="h-3 w-3" />}
                </button>
                <input
                  value={choice.text}
                  onChange={(e) => updateChoice(i, { text: e.target.value })}
                  placeholder={`Choice ${i + 1} text`}
                  className="flex-1 h-8 rounded-[var(--radius-sm)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <Button variant="ghost" size="sm" onClick={() => removeChoice(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </div>
              <input
                value={choice.feedback}
                onChange={(e) => updateChoice(i, { feedback: e.target.value })}
                placeholder="Feedback shown after choosing this…"
                className="w-full h-8 rounded-[var(--radius-sm)] border border-border bg-white px-3 text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          ))}
          {scenario.choices.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No choices yet. Add at least 2.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReflectionEditor({ step, onChange }: { step: WorkshopStep; onChange: (p: Partial<WorkshopStep>) => void }) {
  const reflection = step.reflection ?? { prompt: '', minLength: 50, maxLength: 500 }

  function updateReflection(patch: Partial<typeof reflection>) {
    onChange({ reflection: { ...reflection, ...patch } })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-1.5">Reflection prompt</label>
        <textarea
          rows={3}
          value={reflection.prompt}
          onChange={(e) => updateReflection({ prompt: e.target.value })}
          placeholder="What would you like the learner to reflect on?"
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-text-primary block mb-1.5">Min length (chars)</label>
          <input
            type="number"
            value={reflection.minLength}
            onChange={(e) => updateReflection({ minLength: parseInt(e.target.value) || 0 })}
            className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-text-primary block mb-1.5">Max length (chars)</label>
          <input
            type="number"
            value={reflection.maxLength}
            onChange={(e) => updateReflection({ maxLength: parseInt(e.target.value) || 0 })}
            className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>
    </div>
  )
}

function VideoEditor({ step, onChange }: { step: WorkshopStep; onChange: (p: Partial<WorkshopStep>) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="Video URL (YouTube / Vimeo embed)"
        value={step.content?.mediaUrl ?? ''}
        onChange={(e) =>
          onChange({ content: { ...step.content, body: step.content?.body ?? '', mediaUrl: e.target.value, mediaType: 'video' } })
        }
        placeholder="https://www.youtube.com/embed/…"
      />
      <Input
        label="Caption / description"
        value={step.content?.body ?? ''}
        onChange={(e) =>
          onChange({ content: { ...step.content, body: e.target.value } })
        }
        placeholder="Brief description of the video"
      />
    </div>
  )
}
