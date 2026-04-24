import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, type DepartmentDocument } from './department.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<DepartmentDocument>,
  ) {}

  findAll(orgId: string) {
    return this.deptModel
      .find({ orgId: new Types.ObjectId(orgId) })
      .populate('managerId', 'name email')
      .sort({ name: 1 });
  }

  async create(
    orgId: string,
    body: { name: string; managerId?: string; parentDepartmentId?: string },
  ) {
    return this.deptModel.create({
      orgId: new Types.ObjectId(orgId),
      name: body.name,
      managerId: body.managerId
        ? new Types.ObjectId(body.managerId)
        : undefined,
      parentDepartmentId: body.parentDepartmentId
        ? new Types.ObjectId(body.parentDepartmentId)
        : undefined,
    });
  }

  async update(
    orgId: string,
    deptId: string,
    body: { name?: string; managerId?: string; parentDepartmentId?: string },
  ) {
    const dept = await this.deptModel.findOneAndUpdate(
      { _id: deptId, orgId: new Types.ObjectId(orgId) },
      {
        ...(body.name && { name: body.name }),
        ...(body.managerId !== undefined && {
          managerId: body.managerId ? new Types.ObjectId(body.managerId) : null,
        }),
        ...(body.parentDepartmentId !== undefined && {
          parentDepartmentId: body.parentDepartmentId
            ? new Types.ObjectId(body.parentDepartmentId)
            : null,
        }),
      },
      { new: true },
    );
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async remove(orgId: string, deptId: string) {
    const result = await this.deptModel.deleteOne({
      _id: deptId,
      orgId: new Types.ObjectId(orgId),
    });
    if (!result.deletedCount)
      throw new NotFoundException('Department not found');
    return { deleted: true };
  }
}
