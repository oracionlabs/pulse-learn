import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type AssignmentDocument = Assignment & Document

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Workshop', required: true })
  workshopId: Types.ObjectId

  @Prop({ type: Object, required: true })
  assignedTo: { type: string; id: Types.ObjectId }

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy: Types.ObjectId

  @Prop()
  dueDate?: Date

  @Prop({ enum: ['required', 'recommended', 'optional'], default: 'required' })
  priority: string

  @Prop({
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'pending',
  })
  status: string

  @Prop({ default: 0 })
  completionRate: number
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment)
AssignmentSchema.index({ orgId: 1, status: 1 })
AssignmentSchema.index({ orgId: 1, workshopId: 1 })
