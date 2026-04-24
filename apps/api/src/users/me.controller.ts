import { Controller, Get, Put, Body } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, type UserDocument } from './schemas/user.schema'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('users/me')
export class MeController {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  @Get()
  async getMe(@CurrentUser() user: { _id: string }) {
    return this.userModel.findById(user._id).select('-passwordHash')
  }

  @Put()
  async updateMe(
    @CurrentUser() user: { _id: string },
    @Body() body: { name?: string; preferences?: Record<string, unknown> },
  ) {
    return this.userModel
      .findByIdAndUpdate(user._id, { $set: body }, { new: true })
      .select('-passwordHash')
  }
}
