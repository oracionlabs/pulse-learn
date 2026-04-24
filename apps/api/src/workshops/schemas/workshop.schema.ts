import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export type WorkshopDocument = Workshop & Document

// --- Subdocuments ---

const ScenarioChoiceSchema = {
  id: { type: String, default: uuidv4 },
  text: String,
  nextStepId: String,
  feedback: String,
  isCorrect: { type: Boolean, default: false },
}

const WorkshopStepSchema = {
  stepId: { type: String, default: uuidv4 },
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ['content', 'quiz', 'scenario', 'reflection', 'video'],
    required: true,
  },
  title: { type: String, default: '' },
  content: {
    body: String,
    mediaUrl: String,
    mediaType: { type: String, enum: ['image', 'video', null] },
  },
  quiz: {
    question: String,
    options: [String],
    correctAnswerIndex: Number,
    explanation: String,
  },
  scenario: {
    prompt: String,
    choices: [ScenarioChoiceSchema],
  },
  reflection: {
    prompt: String,
    minLength: { type: Number, default: 50 },
    maxLength: { type: Number, default: 500 },
  },
  animationType: {
    type: String,
    enum: ['slide_up', 'fade_in', 'bounce', 'typewriter'],
    default: 'slide_up',
  },
  points: { type: Number, default: 10 },
}

// --- Main schema ---

@Schema({ timestamps: true })
export class Workshop {
  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  orgId?: Types.ObjectId

  @Prop({ required: true })
  title: string

  @Prop({ default: '' })
  description: string

  @Prop({ default: '' })
  topic: string

  @Prop({
    enum: ['security', 'compliance', 'onboarding', 'sales', 'customer_ed', 'general'],
    default: 'general',
  })
  vertical: string

  @Prop({
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  })
  difficulty: string

  @Prop({ default: 5 })
  estimatedMinutes: number

  @Prop({ type: [String], default: [] })
  tags: string[]

  @Prop({ type: [WorkshopStepSchema], default: [] })
  steps: unknown[]

  @Prop({ default: 0 })
  totalPoints: number

  @Prop({ default: false })
  isTemplate: boolean

  @Prop({ default: false })
  isPublished: boolean

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId

  @Prop()
  publishedAt?: Date

  @Prop({ default: 1 })
  version: number

  @Prop({ type: Types.ObjectId, ref: 'Workshop' })
  previousVersionId?: Types.ObjectId
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop)

WorkshopSchema.index({ orgId: 1, isPublished: 1 })
WorkshopSchema.index({ isTemplate: 1, isPublished: 1 })
