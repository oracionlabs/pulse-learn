import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, type UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(
    orgId: string,
    query: { search?: string; role?: string; status?: string },
  ) {
    const filter: Record<string, unknown> = {
      orgId: new Types.ObjectId(orgId),
    };

    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });
  }

  async findOne(orgId: string, userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, orgId })
      .select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(orgId: string, userId: string, data: Partial<UserDocument>) {
    const user = await this.userModel
      .findOneAndUpdate({ _id: userId, orgId }, { $set: data }, { new: true })
      .select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deactivate(orgId: string, userId: string) {
    return this.update(orgId, userId, {
      status: 'deactivated',
    });
  }
}
