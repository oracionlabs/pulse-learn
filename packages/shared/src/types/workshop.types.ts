export type StepType = 'content' | 'quiz' | 'scenario' | 'reflection' | 'video'
export type WorkshopVertical = 'security' | 'compliance' | 'onboarding' | 'sales' | 'customer_ed' | 'general'
export type WorkshopDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type AnimationType = 'slide_up' | 'fade_in' | 'bounce' | 'typewriter'

export interface ScenarioChoice {
  id: string
  text: string
  nextStepId?: string
  feedback: string
  isCorrect: boolean
}

export interface WorkshopStep {
  stepId: string
  order: number
  type: StepType
  title: string
  content?: {
    body: string
    mediaUrl?: string
    mediaType?: 'image' | 'video'
  }
  quiz?: {
    question: string
    options: string[]
    correctAnswerIndex: number
    explanation: string
  }
  scenario?: {
    prompt: string
    choices: ScenarioChoice[]
  }
  reflection?: {
    prompt: string
    minLength: number
    maxLength: number
  }
  animationType: AnimationType
  points: number
}

export interface Workshop {
  _id: string
  orgId?: string
  title: string
  description: string
  topic: string
  vertical: WorkshopVertical
  difficulty: WorkshopDifficulty
  estimatedMinutes: number
  tags: string[]
  steps: WorkshopStep[]
  totalPoints: number
  isTemplate: boolean
  isPublished: boolean
  createdBy: string
  publishedAt?: string
  version: number
  previousVersionId?: string
  createdAt: string
  updatedAt: string
}
