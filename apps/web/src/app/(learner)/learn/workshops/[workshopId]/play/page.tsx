'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { Workshop, WorkshopStep } from '@pulse/shared'
import {
  ArrowRight,
  Check,
  X,
  Zap,
  Clock,
  Star,
  Trophy,
  RotateCcw,
  Home,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionState {
  _id: string
  currentStepIndex: number
  status: string
  score: number
  maxScore: number
  scorePercent: number
  responses: { stepId: string }[]
}

interface RespondResult {
  stepId: string
  isCorrect: boolean | null
  points: number
  score: number
}

// ─── Animations ──────────────────────────────────────────────────────────────

const stepVariants = {
  slide_up: {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15 } },
  },
  fade_in: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.88 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 22 } },
    exit: { opacity: 0, scale: 0.96 },
  },
  typewriter: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
  },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlayPage({ params }: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingSessionId = searchParams.get('session')

  const { data: authSession } = useSession()
  const token = authSession?.user?.accessToken
  const orgId = authSession?.user?.orgId

  const [session, setSession] = useState<SessionState | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [answer, setAnswer] = useState<unknown>(null)
  const [lastResult, setLastResult] = useState<RespondResult | null>(null)
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)
  const stepStartTime = useRef<number>(0)

  // Fetch workshop
  const { data: workshop, isLoading } = useQuery<Workshop>({
    queryKey: ['workshop-play', workshopId],
    queryFn: () => api.get(`/orgs/${orgId}/workshops/${workshopId}`, token),
    enabled: !!orgId && !!token,
  })

  // Start or resume session
  const startMutation = useMutation({
    mutationFn: () =>
      api.post<SessionState>('/sessions/start', { workshopId, orgId }, token),
    onSuccess: (s) => {
      setSession(s)
      setStepIndex(s.currentStepIndex)
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api.get<SessionState>(`/sessions/${sessionId}`, token),
    onSuccess: (s) => {
      setSession(s)
      setStepIndex(s.currentStepIndex)
    },
  })

  useEffect(() => {
    stepStartTime.current = Date.now()
  }, [stepIndex])

  useEffect(() => {
    if (!token || !orgId) return
    if (existingSessionId) {
      resumeMutation.mutate(existingSessionId)
    } else {
      startMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, orgId])

  const respondMutation = useMutation({
    mutationFn: (payload: { stepId: string; stepType: string; answer: unknown }) =>
      api.post<RespondResult>(
        `/sessions/${session!._id}/respond`,
        { ...payload, timeSpentSeconds: Math.round((Date.now() - stepStartTime.current) / 1000) },
        token,
      ),
    onSuccess: (result) => {
      setLastResult(result)
      setAnswered(true)
      setSession((s) => s ? { ...s, score: result.score, currentStepIndex: s.currentStepIndex + 1 } : s)
    },
  })

  const completeMutation = useMutation({
    mutationFn: () =>
      api.post<SessionState>(`/sessions/${session!._id}/complete`, {}, token),
    onSuccess: (s) => {
      setSession(s)
      setDone(true)
    },
  })

  const steps = (workshop?.steps ?? []) as WorkshopStep[]
  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  function submitAnswer(stepAnswer: unknown) {
    if (!currentStep || !session || answered) return
    setAnswer(stepAnswer)
    respondMutation.mutate({
      stepId: currentStep.stepId,
      stepType: currentStep.type,
      answer: stepAnswer,
    })
  }

  function advance() {
    if (isLastStep) {
      completeMutation.mutate()
    } else {
      setStepIndex((i) => i + 1)
      setAnswer(null)
      setLastResult(null)
      setAnswered(false)
      stepStartTime.current = Date.now()
    }
  }

  // Auto-advance content/video steps after respond
  useEffect(() => {
    if (answered && currentStep && (currentStep.type === 'content' || currentStep.type === 'video')) {
      // slight delay to show checkmark
      const t = setTimeout(() => advance(), 600)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered])

  if (isLoading || startMutation.isPending || resumeMutation.isPending) {
    return <LoadingScreen />
  }

  if (!workshop || !session) return null

  if (done) {
    return <CompletionScreen workshop={workshop} session={session} onHome={() => router.push('/learn/dashboard')} onReplay={() => router.push('/learn/dashboard')} />
  }

  if (!currentStep) return null

  const progress = steps.length > 0 ? ((stepIndex) / steps.length) * 100 : 0
  const variants = stepVariants[currentStep.animationType] ?? stepVariants.slide_up

  return (
    <div className="flex flex-col h-full bg-page" role="main">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-border bg-white px-5 flex-shrink-0" aria-label="Workshop progress">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-brand">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-sm font-semibold text-text-primary truncate max-w-[200px]">
            {workshop.title}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {workshop.estimatedMinutes} min
          </span>
          <span className="text-xs font-semibold text-brand flex items-center gap-1">
            <Star className="h-3 w-3" />
            {session.score} pts
          </span>
          <span className="text-xs text-text-muted">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div
        className="h-1 bg-border flex-shrink-0"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Step ${stepIndex + 1} of ${steps.length}`}
      >
        <motion.div
          className="h-full bg-brand"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.stepId}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="space-y-4"
            >
              <StepCard
                step={currentStep}
                answer={answer}
                lastResult={lastResult}
                answered={answered}
                onAnswer={submitAnswer}
              />

              {/* Continue button — shown after answering quiz/scenario/reflection */}
              {answered && currentStep.type !== 'content' && currentStep.type !== 'video' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-end"
                >
                  <Button onClick={advance} loading={completeMutation.isPending}>
                    {isLastStep ? 'Finish' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Step card ───────────────────────────────────────────────────────────────

function StepCard({
  step,
  answer,
  lastResult,
  answered,
  onAnswer,
}: {
  step: WorkshopStep
  answer: unknown
  lastResult: RespondResult | null
  answered: boolean
  onAnswer: (a: unknown) => void
}) {
  if (step.type === 'content') return <ContentStep step={step} onAnswer={onAnswer} answered={answered} />
  if (step.type === 'video') return <VideoStep step={step} onAnswer={onAnswer} answered={answered} />
  if (step.type === 'quiz') return <QuizStep step={step} answer={answer as number | null} lastResult={lastResult} answered={answered} onAnswer={onAnswer} />
  if (step.type === 'scenario') return <ScenarioStep step={step} answer={answer as string | null} lastResult={lastResult} answered={answered} onAnswer={onAnswer} />
  if (step.type === 'reflection') return <ReflectionStep step={step} answered={answered} onAnswer={onAnswer} />
  return null
}

const cardClass = 'rounded-[var(--radius-xl)] border border-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6'

function ContentStep({ step, onAnswer, answered }: { step: WorkshopStep; onAnswer: (a: unknown) => void; answered: boolean }) {
  return (
    <div className={cardClass}>
      {step.title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">{step.title}</p>
      )}
      <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap">
        {step.content?.body}
      </div>
      {step.content?.mediaUrl && step.content.mediaType === 'image' && (
        <img src={step.content.mediaUrl} alt="" className="mt-4 rounded-[var(--radius-md)] w-full" />
      )}
      {!answered && (
        <button
          onClick={() => onAnswer(true)}
          className="mt-5 flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          Got it <ArrowRight className="h-4 w-4" />
        </button>
      )}
      {answered && (
        <div className="mt-4 flex items-center gap-2 text-xs text-success">
          <Check className="h-4 w-4" /> Read
        </div>
      )}
    </div>
  )
}

function VideoStep({ step, onAnswer, answered }: { step: WorkshopStep; onAnswer: (a: unknown) => void; answered: boolean }) {
  return (
    <div className={cardClass}>
      {step.content?.mediaUrl && (
        <iframe
          src={step.content.mediaUrl}
          className="w-full aspect-video rounded-[var(--radius-md)] mb-4"
          allowFullScreen
        />
      )}
      {step.content?.body && <p className="text-sm text-text-secondary mb-4">{step.content.body}</p>}
      {!answered ? (
        <button
          onClick={() => onAnswer(true)}
          className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          I watched this <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2 text-xs text-success">
          <Check className="h-4 w-4" /> Watched
        </div>
      )}
    </div>
  )
}

function QuizStep({
  step, answer, lastResult, answered, onAnswer,
}: {
  step: WorkshopStep
  answer: number | null
  lastResult: RespondResult | null
  answered: boolean
  onAnswer: (a: unknown) => void
}) {
  const quiz = step.quiz!
  return (
    <div className={cardClass}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-3">Quiz</p>
      <p className="text-base font-semibold text-text-primary mb-5 leading-snug">{quiz.question}</p>

      <div className="space-y-2.5" role="radiogroup" aria-label="Answer choices">
        {quiz.options.map((option, i) => {
          const isSelected = answer === i
          const isCorrect = i === quiz.correctAnswerIndex

          let cls = 'border-border text-text-primary hover:border-brand hover:bg-blue-50/50'
          if (answered) {
            if (isCorrect) cls = 'border-success bg-emerald-50 text-emerald-800'
            else if (isSelected) cls = 'border-danger bg-red-50 text-red-800'
            else cls = 'border-border text-text-muted'
          }

          return (
            <button
              key={i}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onAnswer(i)}
              disabled={answered}
              className={`w-full text-left rounded-[var(--radius-md)] border px-4 py-3 text-sm transition-all duration-150 disabled:cursor-default ${cls}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{option}</span>
                {answered && isCorrect && <Check className="h-4 w-4 text-success flex-shrink-0" />}
                {answered && isSelected && !isCorrect && <X className="h-4 w-4 text-danger flex-shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>

      {answered && quiz.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-[var(--radius-md)] bg-slate-100 px-4 py-3 text-sm text-brand"
        >
          <span className="font-semibold">Explanation: </span>{quiz.explanation}
        </motion.div>
      )}

      {answered && lastResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-3 flex items-center gap-2 text-sm font-medium ${lastResult.isCorrect ? 'text-success' : 'text-danger'}`}
        >
          {lastResult.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {lastResult.isCorrect ? `+${lastResult.points} points!` : 'Not quite — check the explanation above'}
        </motion.div>
      )}
    </div>
  )
}

function ScenarioStep({
  step, answer, lastResult, answered, onAnswer,
}: {
  step: WorkshopStep
  answer: string | null
  lastResult: RespondResult | null
  answered: boolean
  onAnswer: (a: unknown) => void
}) {
  const scenario = step.scenario!
  return (
    <div className={cardClass}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-purple-600 mb-3">Scenario</p>
      <p className="text-base font-semibold text-text-primary mb-5 leading-snug">{scenario.prompt}</p>

      <div className="space-y-2.5">
        {scenario.choices.map((choice) => {
          const isSelected = answer === choice.id

          let cls = 'border-border text-text-primary hover:border-brand hover:bg-blue-50/50'
          if (answered) {
            if (isSelected && choice.isCorrect) cls = 'border-success bg-emerald-50 text-emerald-800'
            else if (isSelected && !choice.isCorrect) cls = 'border-danger bg-red-50 text-red-800'
            else cls = 'border-border text-text-muted'
          }

          return (
            <button
              key={choice.id}
              onClick={() => onAnswer(choice.id)}
              disabled={answered}
              className={`w-full text-left rounded-[var(--radius-md)] border px-4 py-3 text-sm transition-all duration-150 disabled:cursor-default ${cls}`}
            >
              <p>{choice.text}</p>
              {answered && isSelected && choice.feedback && (
                <p className="mt-1.5 text-xs opacity-75">{choice.feedback}</p>
              )}
            </button>
          )
        })}
      </div>

      {answered && lastResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-3 flex items-center gap-2 text-sm font-medium ${lastResult.isCorrect ? 'text-success' : 'text-danger'}`}
        >
          {lastResult.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {lastResult.isCorrect ? `+${lastResult.points} points!` : 'Not the best choice — see the feedback above'}
        </motion.div>
      )}
    </div>
  )
}

function ReflectionStep({ step, answered, onAnswer }: { step: WorkshopStep; answered: boolean; onAnswer: (a: unknown) => void }) {
  const reflection = step.reflection!
  const [text, setText] = useState('')
  const tooShort = text.trim().length < reflection.minLength

  return (
    <div className={cardClass}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-3">Reflection</p>
      {step.title && <p className="text-base font-semibold text-text-primary mb-3">{step.title}</p>}
      <p className="text-sm text-text-secondary mb-4 leading-relaxed">{reflection.prompt}</p>

      {!answered ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={reflection.maxLength}
            placeholder="Share your thoughts…"
            className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none transition-colors"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-[11px] ${tooShort ? 'text-text-muted' : 'text-success'}`}>
              {text.trim().length} / {reflection.minLength} min characters
            </span>
            <Button size="sm" disabled={tooShort} onClick={() => onAnswer(text)}>
              Submit <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-[var(--radius-md)] bg-emerald-50 border border-success/20 px-4 py-3">
          <p className="text-sm text-emerald-800 leading-relaxed">{text}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Reflection saved
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({
  workshop,
  session,
  onHome,
  onReplay,
}: {
  workshop: Workshop
  session: SessionState
  onHome: () => void
  onReplay: () => void
}) {
  const pct = session.maxScore > 0
    ? Math.round((session.score / session.maxScore) * 100)
    : 0

  const grade = pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '✨ Great job!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep practicing!'

  return (
    <div className="flex flex-col h-full bg-page items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="w-full max-w-md"
      >
        <div className="rounded-[var(--radius-xl)] border border-border bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 text-center">
          {/* Trophy icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mx-auto mb-4">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>

          <p className="text-xl font-bold text-text-primary">{grade}</p>
          <p className="mt-1 text-sm text-text-secondary">{workshop.title}</p>

          {/* Score */}
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-text-primary">{pct}%</p>
              <p className="text-xs text-text-muted mt-0.5">Score</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-brand">{session.score}</p>
              <p className="text-xs text-text-muted mt-0.5">Points earned</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5 h-2 w-full rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onReplay}>
              <RotateCcw className="h-4 w-4" /> Retry
            </Button>
            <Button className="flex-1" onClick={onHome}>
              <Home className="h-4 w-4" /> Dashboard
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 bg-page">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand">
        <Zap className="h-5 w-5 text-white" />
      </div>
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}
