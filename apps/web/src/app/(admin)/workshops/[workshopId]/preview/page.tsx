'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Workshop, WorkshopStep } from '@pulse/shared'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

const animations = {
  slide_up: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  fade_in: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  typewriter: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
  },
}

export default function WorkshopPreviewPage({
  params,
}: {
  params: Promise<{ workshopId: string }>
}) {
  const { workshopId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const orgId = session?.user?.orgId
  const token = session?.user?.accessToken

  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [scenarioChoice, setScenarioChoice] = useState<string | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [score, setScore] = useState(0)

  const { data: workshop, isLoading } = useQuery<Workshop>({
    queryKey: ['workshop', workshopId],
    queryFn: () => api.get(`/orgs/${orgId}/workshops/${workshopId}`, token),
    enabled: !!orgId,
  })

  if (isLoading || !workshop) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  const steps = workshop.steps
  const step = steps[currentIndex] as WorkshopStep | undefined
  const isLast = currentIndex === steps.length - 1
  const progress = steps.length > 0 ? ((currentIndex) / steps.length) * 100 : 0

  function advance() {
    if (isLast) return
    setCurrentIndex((i) => i + 1)
    setQuizAnswer(null)
    setScenarioChoice(null)
    setReflectionText('')
  }

  function handleQuizAnswer(idx: number) {
    if (quizAnswer !== null) return
    setQuizAnswer(idx)
    if (step?.quiz && idx === step.quiz.correctAnswerIndex) {
      setScore((s) => s + (step.points ?? 0))
    }
  }

  function handleScenarioChoice(choiceId: string) {
    if (scenarioChoice) return
    setScenarioChoice(choiceId)
    const choice = step?.scenario?.choices.find((c) => c.id === choiceId)
    if (choice?.isCorrect) setScore((s) => s + (step?.points ?? 0))
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-sm text-text-muted">This workshop has no steps to preview.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-page">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Back to editor
          </Button>
          <Badge variant="warning">Preview Mode</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium text-brand">{score} pts</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step && (
              <motion.div
                key={step.stepId}
                {...(animations[step.animationType] ?? animations.slide_up)}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <StepRenderer
                  step={step}
                  quizAnswer={quizAnswer}
                  scenarioChoice={scenarioChoice}
                  reflectionText={reflectionText}
                  onQuizAnswer={handleQuizAnswer}
                  onScenarioChoice={handleScenarioChoice}
                  onReflectionChange={setReflectionText}
                />

                <div className="mt-6 flex justify-end">
                  {!isLast ? (
                    <Button
                      onClick={advance}
                      disabled={
                        (step.type === 'quiz' && quizAnswer === null) ||
                        (step.type === 'scenario' && !scenarioChoice)
                      }
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="rounded-[var(--radius-lg)] border border-border bg-white p-6 text-center w-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mx-auto mb-3">
                          <Check className="h-6 w-6 text-success" />
                        </div>
                        <p className="text-lg font-bold text-text-primary">Preview complete!</p>
                        <p className="text-sm text-text-muted mt-1">
                          Score: {score} / {workshop.totalPoints} points
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => { setCurrentIndex(0); setScore(0) }}>
                        Restart preview
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function StepRenderer({
  step,
  quizAnswer,
  scenarioChoice,
  reflectionText,
  onQuizAnswer,
  onScenarioChoice,
  onReflectionChange,
}: {
  step: WorkshopStep
  quizAnswer: number | null
  scenarioChoice: string | null
  reflectionText: string
  onQuizAnswer: (idx: number) => void
  onScenarioChoice: (id: string) => void
  onReflectionChange: (t: string) => void
}) {
  const card = 'rounded-[var(--radius-lg)] border border-border bg-white p-5'

  if (step.type === 'content') {
    return (
      <div className={card}>
        {step.title && <h2 className="text-base font-semibold text-text-primary mb-3">{step.title}</h2>}
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {step.content?.body || 'No content yet.'}
        </div>
        {step.content?.mediaUrl && step.content.mediaType === 'image' && (
          <img src={step.content.mediaUrl} alt="" className="mt-4 rounded-[var(--radius-md)] w-full" />
        )}
      </div>
    )
  }

  if (step.type === 'video') {
    return (
      <div className={card}>
        {step.title && <h2 className="text-base font-semibold text-text-primary mb-3">{step.title}</h2>}
        {step.content?.mediaUrl && (
          <iframe
            src={step.content.mediaUrl}
            className="w-full aspect-video rounded-[var(--radius-md)]"
            allowFullScreen
          />
        )}
        {step.content?.body && (
          <p className="mt-3 text-sm text-text-secondary">{step.content.body}</p>
        )}
      </div>
    )
  }

  if (step.type === 'quiz') {
    const quiz = step.quiz!
    return (
      <div className={card}>
        {step.title && <p className="text-xs font-semibold uppercase tracking-wide text-brand mb-3">Quiz</p>}
        <p className="text-base font-medium text-text-primary mb-4">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((option, i) => {
            const isSelected = quizAnswer === i
            const isCorrect = i === quiz.correctAnswerIndex
            const revealed = quizAnswer !== null

            return (
              <button
                key={i}
                onClick={() => onQuizAnswer(i)}
                disabled={revealed}
                className={`w-full text-left rounded-[var(--radius-md)] border px-4 py-3 text-sm transition-all duration-150 ${
                  !revealed
                    ? 'border-border hover:border-brand hover:bg-slate-100 text-text-primary'
                    : isCorrect
                    ? 'border-success bg-emerald-50 text-emerald-800'
                    : isSelected
                    ? 'border-danger bg-red-50 text-red-800'
                    : 'border-border text-text-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {revealed && isCorrect && <Check className="h-4 w-4 text-success" />}
                  {revealed && isSelected && !isCorrect && <X className="h-4 w-4 text-danger" />}
                </div>
              </button>
            )
          })}
        </div>
        {quizAnswer !== null && quiz.explanation && (
          <div className="mt-4 rounded-[var(--radius-md)] bg-slate-100 px-4 py-3 text-xs text-brand">
            <span className="font-semibold">Explanation: </span>{quiz.explanation}
          </div>
        )}
      </div>
    )
  }

  if (step.type === 'scenario') {
    const scenario = step.scenario!
    return (
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-3">Scenario</p>
        <p className="text-base font-medium text-text-primary mb-4">{scenario.prompt}</p>
        <div className="space-y-2">
          {scenario.choices.map((choice) => {
            const isSelected = scenarioChoice === choice.id
            const revealed = !!scenarioChoice

            return (
              <button
                key={choice.id}
                onClick={() => onScenarioChoice(choice.id)}
                disabled={revealed}
                className={`w-full text-left rounded-[var(--radius-md)] border px-4 py-3 text-sm transition-all duration-150 ${
                  !revealed
                    ? 'border-border hover:border-brand hover:bg-slate-100 text-text-primary'
                    : isSelected
                    ? choice.isCorrect
                      ? 'border-success bg-emerald-50 text-emerald-800'
                      : 'border-danger bg-red-50 text-red-800'
                    : 'border-border text-text-muted'
                }`}
              >
                {choice.text}
                {revealed && isSelected && choice.feedback && (
                  <p className="mt-1.5 text-xs opacity-80">{choice.feedback}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step.type === 'reflection') {
    const reflection = step.reflection!
    const len = reflectionText.length
    const tooShort = len < reflection.minLength
    return (
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-3">Reflection</p>
        <p className="text-base font-medium text-text-primary mb-4">{reflection.prompt}</p>
        <textarea
          value={reflectionText}
          onChange={(e) => onReflectionChange(e.target.value)}
          rows={5}
          placeholder="Share your thoughts…"
          maxLength={reflection.maxLength}
          className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
        <p className={`mt-1 text-right text-[11px] ${tooShort ? 'text-text-muted' : 'text-success'}`}>
          {len} / {reflection.minLength} min chars
        </p>
      </div>
    )
  }

  return null
}
