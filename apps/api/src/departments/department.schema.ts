import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  parentDepartmentId?: Types.ObjectId;

  @Prop({ default: 0 })
  memberCount: number;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
DepartmentSchema.index({ orgId: 1 });
