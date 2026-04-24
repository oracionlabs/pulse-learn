import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Notification, type NotificationDocument } from './schemas/notification.schema'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
  ) {}

  async create(data: {
    userId: string
    orgId: string
    type: string
    title: string
    body: string
    link?: string
  }) {
    return this.notifModel.create({
      userId: new Types.ObjectId(data.userId),
      orgId: new Types.ObjectId(data.orgId),
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link,
      channel: 'in_app',
    })
  }

  async createForUser(userId: string, orgId: string, type: string, title: string, body: string, link?: string) {
    return this.create({ userId, orgId, type, title, body, link })
  }

  async getMyNotifications(userId: string, limit = 30) {
    return this.notifModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  async getUnreadCount(userId: string) {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    })
  }

  async markRead(userId: string, notifId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: notifId, userId: new Types.ObjectId(userId) },
      { read: true, readAt: new Date() },
      { new: true },
    )
  }

  async markAllRead(userId: string) {
    return this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true, readAt: new Date() },
    )
  }
}
