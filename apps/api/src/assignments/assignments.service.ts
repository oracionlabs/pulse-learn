import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Assignment, type AssignmentDocument } from './schemas/assignment.schema'

export interface CreateAssignmentDto {
  workshopId: string
  assignedTo: { type: 'user' | 'department' | 'org'; id?: string }
  dueDate?: string
  priority?: 'required' | 'recommended' | 'optional'
}

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async findAll(orgId: string, query: { status?: string; workshopId?: string }) {
    const filter: Record<string, unknown> = { orgId: new Types.ObjectId(orgId) }
    if (query.status) filter.status = query.status
    if (query.workshopId) filter.workshopId = new Types.ObjectId(query.workshopId)

    return this.assignmentModel
      .find(filter)
      .populate('workshopId', 'title vertical estimatedMinutes')
      .populate('assignedBy', 'name avatar_url')
      .sort({ createdAt: -1 })
  }

  async findMyAssignments(userId: string, orgId: string) {
    return this.assignmentModel
      .find({
        orgId: new Types.ObjectId(orgId),
        $or: [
          { 'assignedTo.type': 'user', 'assignedTo.id': new Types.ObjectId(userId) },
          { 'assignedTo.type': 'org' },
        ],
        status: { $in: ['pending', 'in_progress', 'overdue'] },
      })
      .populate('workshopId', 'title vertical difficulty estimatedMinutes totalPoints isPublished')
      .sort({ dueDate: 1, createdAt: -1 })
  }

  async create(orgId: string, assignedBy: string, dto: CreateAssignmentDto) {
    return this.assignmentModel.create({
      orgId: new Types.ObjectId(orgId),
      workshopId: new Types.ObjectId(dto.workshopId),
      assignedTo: {
        type: dto.assignedTo.type,
        id: dto.assignedTo.id ? new Types.ObjectId(dto.assignedTo.id) : undefined,
      },
      assignedBy: new Types.ObjectId(assignedBy),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority ?? 'required',
      status: 'pending',
      completionRate: 0,
    })
  }

  async update(orgId: string, assignmentId: string, dto: Partial<AssignmentDocument>) {
    const assignment = await this.assignmentModel.findOneAndUpdate(
      { _id: assignmentId, orgId: new Types.ObjectId(orgId) },
      { $set: dto },
      { new: true },
    )
    if (!assignment) throw new NotFoundException('Assignment not found')
    return assignment
  }

  async remove(orgId: string, assignmentId: string) {
    const result = await this.assignmentModel.deleteOne({
      _id: assignmentId,
      orgId: new Types.ObjectId(orgId),
    })
    if (result.deletedCount === 0) throw new NotFoundException('Assignment not found')
    return { deleted: true }
  }

  // Runs every day at 6am — marks past-due assignments as overdue
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async detectOverdue() {
    const result = await this.assignmentModel.updateMany(
      {
        status: { $in: ['pending', 'in_progress'] },
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } },
    )
    if (result.modifiedCount > 0) {
      console.log(`[Assignments] Marked ${result.modifiedCount} assignments as overdue`)
    }
  }
}
