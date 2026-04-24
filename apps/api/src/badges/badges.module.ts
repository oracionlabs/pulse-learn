import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Badge, BadgeSchema } from './schemas/badge.schema'
import { BadgesController } from './badges.controller'
import { BadgesService } from './badges.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: Badge.name, schema: BadgeSchema }])],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
