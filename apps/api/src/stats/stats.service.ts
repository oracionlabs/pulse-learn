import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  Workshop,
  type WorkshopDocument,
} from '../workshops/schemas/workshop.schema';
import {
  WorkshopSession,
  type WorkshopSessionDocument,
} from '../sessions/schemas/session.schema';
import {
  Assignment,
  type AssignmentDocument,
} from '../assignments/schemas/assignment.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>,
    @InjectModel(WorkshopSession.name)
    private sessionModel: Model<WorkshopSessionDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async getOrgStats(orgId: string) {
    const oid = new Types.ObjectId(orgId);

    const [
      totalUsers,
      activeWorkshops,
      overdueCount,
      completedSessions,
      avgScoreResult,
    ] = await Promise.all([
      this.userModel.countDocuments({ orgId: oid, status: 'active' }),
      this.workshopModel.countDocuments({ orgId: oid, isPublished: true }),
      this.assignmentModel.countDocuments({ orgId: oid, status: 'overdue' }),
      this.sessionModel.countDocuments({ orgId: oid, status: 'completed' }),
      this.sessionModel.aggregate([
        { $match: { orgId: oid, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$scorePercent' } } },
      ]),
    ]);

    const avgScore =
      (avgScoreResult[0] as { avg?: number } | undefined)?.avg ?? 0;

    // Recent activity: last 20 completed sessions with user/workshop names
    const recentSessions = await this.sessionModel
      .find({ orgId: oid })
      .sort({ lastActivityAt: -1 })
      .limit(20)
      .populate('userId', 'name email')
      .populate('workshopId', 'title')
      .lean();

    // Overdue assignments with user and workshop info
    const overdueAssignments = await this.assignmentModel
      .find({ orgId: oid, status: 'overdue' })
      .populate('workshopId', 'title')
      .populate({
        path: 'assignedTo.id',
        model: User.name,
        select: 'name email',
      })
      .sort({ dueDate: 1 })
      .limit(10)
      .lean();

    return {
      totalUsers,
      activeWorkshops,
      overdueCount,
      completedSessions,
      avgScore: Math.round(avgScore),
      recentSessions,
      overdueAssignments,
    };
  }

  async exportSessionsCsv(orgId: string): Promise<string> {
    const oid = new Types.ObjectId(orgId);
    const sessions = await this.sessionModel
      .find({ orgId: oid })
      .populate('userId', 'name email')
      .populate('workshopId', 'title')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const rows = [
      [
        'User',
        'Email',
        'Workshop',
        'Status',
        'Score',
        'Max Score',
        'Score %',
        'Started',
        'Completed',
      ],
    ];

    for (const s of sessions) {
      const user = s.userId as unknown as {
        name: string;
        email: string;
      } | null;
      const workshop = s.workshopId as unknown as { title: string } | null;
      rows.push([
        user?.name ?? '',
        user?.email ?? '',
        workshop?.title ?? '',
        s.status,
        String(s.score),
        String(s.maxScore),
        String(s.scorePercent),
        s.startedAt ? new Date(s.startedAt).toISOString() : '',
        s.completedAt ? new Date(s.completedAt).toISOString() : '',
      ]);
    }

    return rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}
