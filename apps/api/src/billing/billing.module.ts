import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
