import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type NotificationDocument = Notification & Document

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId

  @Prop({
    enum: ['assignment', 'reminder', 'completion', 'streak', 'badge', 'system'],
    required: true,
  })
  type: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  body: string

  @Prop()
  link?: string

  @Prop({ enum: ['in_app', 'email', 'both'], default: 'both' })
  channel: string

  @Prop({ default: false })
  read: boolean

  @Prop()
  readAt?: Date

  @Prop({ default: false })
  emailSent: boolean

  @Prop()
  emailSentAt?: Date
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
NotificationSchema.index({ userId: 1, read: 1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })
