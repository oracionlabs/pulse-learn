import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { User, type UserDocument } from './schemas/user.schema'

@Injectable()
export class InviteService {
  private resend: Resend

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {
    // Resend requires a non-empty key; use a placeholder so it constructs OK
    // Actual sends are gated on the key being a real value later
    const apiKey = config.get<string>('resend.apiKey') || 're_dev_placeholder_key'
    this.resend = new Resend(apiKey)
  }

  async inviteUser(orgId: string, invitedBy: string, data: { email: string; name: string; role: string }) {
    const existing = await this.userModel.findOne({
      email: data.email.toLowerCase(),
      orgId: new Types.ObjectId(orgId),
    })
    if (existing) throw new BadRequestException('User already exists in this organization')

    const token = crypto.randomBytes(32).toString('hex')

    const user = await this.userModel.create({
      orgId: new Types.ObjectId(orgId),
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      status: 'invited',
      inviteToken: token,
      passwordHash: 'PENDING',
    })

    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000'
    const inviteLink = `${frontendUrl}/invite?token=${token}`

    // Send email if Resend key is configured
    const apiKey = this.config.get<string>('resend.apiKey')
    if (apiKey && !apiKey.startsWith('re_placeholder')) {
      await this.resend.emails.send({
        from: this.config.get<string>('resend.from') ?? 'noreply@pulse.app',
        to: data.email,
        subject: `You've been invited to Pulse`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>You're invited to Pulse!</h2>
            <p>Hi ${data.name},</p>
            <p>You've been invited to join your organization's learning platform.</p>
            <a href="${inviteLink}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Accept Invitation
            </a>
            <p style="color:#666;font-size:12px">Link expires in 72 hours.</p>
          </div>
        `,
      })
    }

    return { _id: user._id, email: user.email, name: user.name, status: user.status, inviteLink }
  }

  async acceptInvite(token: string, password: string) {
    const user = await this.userModel.findOne({ inviteToken: token, status: 'invited' })
    if (!user) throw new BadRequestException('Invalid or expired invite token')

    const hash = await bcrypt.hash(password, 12)

    user.passwordHash = hash
    user.status = 'active'
    user.inviteToken = undefined as unknown as string
    await user.save()

    return { message: 'Account activated successfully' }
  }
}
