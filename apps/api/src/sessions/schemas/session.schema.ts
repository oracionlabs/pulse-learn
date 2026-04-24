import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type WorkshopSessionDocument = WorkshopSession & Document

@Schema({ timestamps: true })
export class WorkshopSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Workshop', required: true })
  workshopId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Assignment' })
  assignmentId?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId

  @Prop({ default: 0 })
  currentStepIndex: number

  @Prop({ enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' })
  status: string

  @Prop({
    type: [
      {
        stepId: String,
        stepType: String,
        answer: Object,
        isCorrect: Boolean,
        points: Number,
        startedAt: Date,
        completedAt: Date,
      },
    ],
    default: [],
  })
  responses: unknown[]

  @Prop({ default: 0 })
  score: number

  @Prop({ default: 0 })
  maxScore: number

  @Prop({ default: 0 })
  scorePercent: number

  @Prop()
  startedAt: Date

  @Prop()
  completedAt?: Date

  @Prop()
  lastActivityAt: Date

  @Prop({ default: 0 })
  timeSpentSeconds: number

  @Prop({ enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' })
  deviceType: string

  @Prop({ default: 0 })
  resumeCount: number
}

export const WorkshopSessionSchema = SchemaFactory.createForClass(WorkshopSession)
WorkshopSessionSchema.index({ userId: 1, workshopId: 1 })
WorkshopSessionSchema.index({ orgId: 1, status: 1 })
