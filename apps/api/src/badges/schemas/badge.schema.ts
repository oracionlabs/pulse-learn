import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BadgeDocument = Badge & Document;

@Schema({ timestamps: true })
export class Badge {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  orgId: Types.ObjectId;

  @Prop({ required: true })
  key: string; // e.g. 'first_completion', 'streak_3', 'high_scorer'

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string; // emoji or icon name

  @Prop({ default: Date.now })
  awardedAt: Date;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
BadgeSchema.index({ userId: 1, key: 1 }, { unique: true });
