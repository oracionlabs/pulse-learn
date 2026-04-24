import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import {
  WorkshopSession,
  type WorkshopSessionDocument,
} from './schemas/session.schema'
import { Workshop, type WorkshopDocument } from '../workshops/schemas/workshop.schema'
import { Assignment, type AssignmentDocument } from '../assignments/schemas/assignment.schema'
import { BadgesService } from '../badges/badges.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(WorkshopSession.name)
    private sessionModel: Model<WorkshopSessionDocument>,
    @InjectModel(Workshop.name)
    private workshopModel: Model<WorkshopDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    private badgesService: BadgesService,
    private notifsService: NotificationsService,
  ) {}

  async start(userId: string, orgId: string, workshopId: string, assignmentId?: string) {
    const workshop = await this.workshopModel.findById(workshopId)
    if (!workshop) throw new NotFoundException('Workshop not found')
    if (!workshop.isPublished) throw new BadRequestException('Workshop is not published')

    // Resume existing in-progress session if any
    const existing = await this.sessionModel.findOne({
      userId: new Types.ObjectId(userId),
      workshopId: new Types.ObjectId(workshopId),
      status: 'in_progress',
    })
    if (existing) {
      await this.sessionModel.updateOne(
        { _id: existing._id },
        { $inc: { resumeCount: 1 }, lastActivityAt: new Date() },
      )
      return existing
    }

    const steps = workshop.steps as { points?: number }[]
    const maxScore = steps.reduce((sum, s) => sum + (s.points ?? 0), 0)

    return this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      workshopId: new Types.ObjectId(workshopId),
      assignmentId: assignmentId ? new Types.ObjectId(assignmentId) : undefined,
      orgId: new Types.ObjectId(orgId),
      currentStepIndex: 0,
      status: 'in_progress',
      responses: [],
      score: 0,
      maxScore,
      scorePercent: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      timeSpentSeconds: 0,
      resumeCount: 0,
    })
  }

  async respond(
    sessionId: string,
    userId: string,
    dto: {
      stepId: string
      stepType: string
      answer: unknown
      timeSpentSeconds?: number
    },
  ) {
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      status: 'in_progress',
    })
    if (!session) throw new NotFoundException('Session not found or already completed')

    const workshop = await this.workshopModel.findById(session.workshopId)
    if (!workshop) throw new NotFoundException('Workshop not found')

    const steps = workshop.steps as Record<string, unknown>[]
    const step = steps.find((s) => s.stepId === dto.stepId)
    if (!step) throw new NotFoundException('Step not found')

    // Score the response
    let isCorrect: boolean | null = null
    let points = 0

    if (dto.stepType === 'quiz' && step.quiz) {
      const quiz = step.quiz as { correctAnswerIndex: number }
      isCorrect = dto.answer === quiz.correctAnswerIndex
      points = isCorrect ? (step.points as number ?? 10) : 0
    } else if (dto.stepType === 'scenario' && step.scenario) {
      const scenario = step.scenario as { choices: { id: string; isCorrect: boolean }[] }
      const choice = scenario.choices.find((c) => c.id === dto.answer)
      isCorrect = choice?.isCorrect ?? false
      points = isCorrect ? (step.points as number ?? 10) : 0
    } else if (dto.stepType === 'content' || dto.stepType === 'video') {
      // Always award points for reading/watching
      points = step.points as number ?? 0
    } else if (dto.stepType === 'reflection') {
      // Award points if min length met
      const reflection = step.reflection as { minLength: number }
      const text = dto.answer as string
      points = text && text.length >= reflection.minLength ? (step.points as number ?? 10) : 0
    }

    const response = {
      stepId: dto.stepId,
      stepType: dto.stepType,
      answer: dto.answer,
      isCorrect,
      points,
      startedAt: new Date(),
      completedAt: new Date(),
    }

    const nextIndex = session.currentStepIndex + 1
    const newScore = session.score + points
    const newTimeSpent = (session.timeSpentSeconds ?? 0) + (dto.timeSpentSeconds ?? 0)

    await this.sessionModel.updateOne(
      { _id: sessionId },
      {
        $push: { responses: response },
        $set: {
          currentStepIndex: nextIndex,
          score: newScore,
          scorePercent: session.maxScore > 0 ? Math.round((newScore / session.maxScore) * 100) : 0,
          lastActivityAt: new Date(),
          timeSpentSeconds: newTimeSpent,
        },
      },
    )

    return { stepId: dto.stepId, isCorrect, points, score: newScore }
  }

  async complete(sessionId: string, userId: string) {
    const session = await this.sessionModel.findOneAndUpdate(
      { _id: sessionId, userId: new Types.ObjectId(userId), status: 'in_progress' },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          lastActivityAt: new Date(),
        },
      },
      { new: true },
    )
    if (!session) throw new NotFoundException('Session not found')

    // Mark assignment as completed if linked
    if (session.assignmentId) {
      await this.assignmentModel.updateOne(
        { _id: session.assignmentId },
        { $set: { status: 'completed' } },
      )
    }

    // Post-completion: badges + notifications (fire-and-forget)
    this.postComplete(session).catch(() => {})

    return session
  }

  private async postComplete(session: WorkshopSessionDocument) {
    const userId = session.userId.toString()
    const orgId = session.orgId.toString()

    // Count total completions
    const completionsCount = await this.sessionModel.countDocuments({
      userId: session.userId,
      status: 'completed',
    })

    // Calculate streak (consecutive days with at least one completion)
    const streakDays = await this.calculateStreak(session.userId)

    const newBadges = await this.badgesService.checkAndAwardBadges(userId, orgId, {
      completionsCount,
      scorePercent: session.scorePercent,
      timeSpentSeconds: session.timeSpentSeconds ?? 0,
      streakDays,
    })

    for (const badge of newBadges) {
      await this.notifsService.createForUser(
        userId,
        orgId,
        'badge',
        `Badge earned: ${badge.name}`,
        `${badge.icon} ${badge.description}`,
      )
    }

    // Completion notification
    await this.notifsService.createForUser(
      userId,
      orgId,
      'completion',
      'Workshop completed!',
      `You scored ${session.scorePercent}% and earned ${session.score} points.`,
    )
  }

  private async calculateStreak(userId: Types.ObjectId): Promise<number> {
    const recent = await this.sessionModel
      .find({ userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(90)
      .select('completedAt')
      .lean()

    if (recent.length === 0) return 0

    const days = new Set<string>()
    for (const s of recent) {
      if (s.completedAt) {
        days.add(new Date(s.completedAt as Date).toISOString().slice(0, 10))
      }
    }

    const sorted = [...days].sort().reverse()
    const today = new Date().toISOString().slice(0, 10)
    if (sorted[0] !== today && sorted[0] !== this.yesterday()) return 0

    let streak = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      prev.setDate(prev.getDate() - 1)
      if (prev.toISOString().slice(0, 10) === sorted[i]) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  private yesterday(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.sessionModel
      .findOne({ _id: sessionId, userId: new Types.ObjectId(userId) })
      .populate('workshopId', 'title steps totalPoints estimatedMinutes')
    if (!session) throw new NotFoundException('Session not found')
    return session
  }

  async getMyHistory(userId: string) {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('workshopId', 'title vertical difficulty estimatedMinutes totalPoints')
      .sort({ lastActivityAt: -1 })
      .limit(50)
  }

  async getLeaderboard(orgId: string, limit = 20) {
    const oid = new Types.ObjectId(orgId)
    const rows = await this.sessionModel.aggregate([
      { $match: { orgId: oid, status: 'completed' } },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          sessionsCompleted: { $sum: 1 },
          avgScore: { $avg: '$scorePercent' },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalScore: 1,
          sessionsCompleted: 1,
          avgScore: { $round: ['$avgScore', 0] },
        },
      },
    ])
    return rows
  }
}
