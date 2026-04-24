import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string

  @Prop({ select: false })
  passwordHash?: string

  @Prop({ required: true })
  name: string

  @Prop()
  avatar_url?: string

  @Prop({
    enum: ['super_admin', 'org_admin', 'manager', 'learner'],
    default: 'learner',
  })
  role: string

  @Prop()
  department?: string

  @Prop()
  title?: string

  @Prop()
  ssoId?: string

  @Prop({ enum: ['none', 'google', 'microsoft', 'okta'], default: 'none' })
  ssoProvider: string

  @Prop({
    type: {
      timezone: { type: String, default: 'UTC' },
      emailNotifications: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
    default: {},
  })
  preferences: Record<string, unknown>

  @Prop({ enum: ['active', 'invited', 'deactivated'], default: 'active' })
  status: string

  @Prop()
  lastLoginAt?: Date

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId

  @Prop()
  invitedAt?: Date

  @Prop()
  inviteToken?: string
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.index({ orgId: 1, email: 1 })
UserSchema.index({ orgId: 1, status: 1 })
