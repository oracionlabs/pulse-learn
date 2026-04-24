import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Organization, type OrganizationDocument } from './schemas/organization.schema'

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
  ) {}

  async findOne(orgId: string) {
    const org = await this.orgModel.findById(orgId)
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async update(orgId: string, dto: Partial<OrganizationDocument>) {
    const org = await this.orgModel.findByIdAndUpdate(
      orgId,
      { $set: dto },
      { new: true },
    )
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }
}
