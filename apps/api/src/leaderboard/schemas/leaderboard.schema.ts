import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type LeaderboardEntryDocument = LeaderboardEntry & Document

@Schema({ timestamps: true })
export class LeaderboardEntry {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ default: 0 })
  totalScore: number

  @Prop({ default: 0 })
  workshopsCompleted: number

  @Prop({ default: 0 })
  questionsCorrect: number

  @Prop({ default: 0 })
  questionsTotal: number

  @Prop({ default: 0 })
  currentStreak: number

  @Prop({ default: 0 })
  longestStreak: number

  @Prop()
  lastActivityAt: Date

  @Prop({ default: 0 })
  rank: number

  @Prop({ default: 0 })
  previousRank: number

  @Prop({
    type: [{ type: String, earnedAt: Date }],
    default: [],
  })
  badges: unknown[]
}

export const LeaderboardEntrySchema = SchemaFactory.createForClass(LeaderboardEntry)
LeaderboardEntrySchema.index({ orgId: 1, totalScore: -1 })
LeaderboardEntrySchema.index({ orgId: 1, userId: 1 }, { unique: true })
