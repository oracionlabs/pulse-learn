import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  domain?: string;

  @Prop()
  logo_url?: string;

  @Prop({ enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' })
  plan: string;

  @Prop({ type: [String], default: [] })
  verticals: string[];

  @Prop({
    type: {
      ssoProvider: { type: String, default: 'none' },
      defaultTimezone: { type: String, default: 'UTC' },
      brandColor: { type: String, default: '#6366f1' },
      customDomain: String,
      workshopReminders: { type: Boolean, default: true },
      leaderboardEnabled: { type: Boolean, default: true },
    },
    default: {},
  })
  settings: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  subscription: Record<string, unknown>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
