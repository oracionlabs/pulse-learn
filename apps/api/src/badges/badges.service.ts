import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Badge, type BadgeDocument } from './schemas/badge.schema'

const BADGE_DEFS: Record<string, { name: string; description: string; icon: string }> = {
  first_completion: {
    name: 'First Steps',
    description: 'Completed your first workshop',
    icon: '🎉',
  },
  streak_3: {
    name: 'On a Roll',
    description: 'Completed workshops 3 days in a row',
    icon: '🔥',
  },
  streak_7: {
    name: 'Week Warrior',
    description: '7-day completion streak',
    icon: '⚡',
  },
  streak_30: {
    name: 'Unstoppable',
    description: '30-day completion streak',
    icon: '🏆',
  },
  high_scorer: {
    name: 'High Scorer',
    description: 'Scored 100% on a workshop',
    icon: '⭐',
  },
  speed_learner: {
    name: 'Speed Learner',
    description: 'Completed a workshop in under 5 minutes',
    icon: '🚀',
  },
  completions_5: {
    name: 'Getting Serious',
    description: 'Completed 5 workshops',
    icon: '📚',
  },
  completions_25: {
    name: 'Scholar',
    description: 'Completed 25 workshops',
    icon: '🎓',
  },
  completions_100: {
    name: 'Legend',
    description: 'Completed 100 workshops',
    icon: '👑',
  },
}

@Injectable()
export class BadgesService {
  constructor(@InjectModel(Badge.name) private badgeModel: Model<BadgeDocument>) {}

  async awardBadge(userId: string, orgId: string, key: string): Promise<Badge | null> {
    const def = BADGE_DEFS[key]
    if (!def) return null

    try {
      return await this.badgeModel.create({
        userId: new Types.ObjectId(userId),
        orgId: new Types.ObjectId(orgId),
        key,
        name: def.name,
        description: def.description,
        icon: def.icon,
      })
    } catch {
      // Duplicate (already awarded) — ignore
      return null
    }
  }

  async checkAndAwardBadges(
    userId: string,
    orgId: string,
    context: {
      completionsCount: number
      scorePercent: number
      timeSpentSeconds: number
      streakDays: number
    },
  ): Promise<Badge[]> {
    const awarded: Badge[] = []

    const award = async (key: string) => {
      const b = await this.awardBadge(userId, orgId, key)
      if (b) awarded.push(b)
    }

    // First completion
    if (context.completionsCount === 1) await award('first_completion')

    // Completion milestones
    if (context.completionsCount === 5) await award('completions_5')
    if (context.completionsCount === 25) await award('completions_25')
    if (context.completionsCount === 100) await award('completions_100')

    // Perfect score
    if (context.scorePercent === 100) await award('high_scorer')

    // Speed learner
    if (context.timeSpentSeconds < 300) await award('speed_learner')

    // Streaks
    if (context.streakDays >= 3) await award('streak_3')
    if (context.streakDays >= 7) await award('streak_7')
    if (context.streakDays >= 30) await award('streak_30')

    return awarded
  }

  async getMyBadges(userId: string) {
    return this.badgeModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ awardedAt: -1 })
  }

  async getOrgBadges(orgId: string) {
    return this.badgeModel
      .find({ orgId: new Types.ObjectId(orgId) })
      .populate('userId', 'name email')
      .sort({ awardedAt: -1 })
      .limit(100)
  }
}
