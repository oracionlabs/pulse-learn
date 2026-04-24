import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { WorkshopSession, WorkshopSessionSchema } from './schemas/session.schema'
import { Workshop, WorkshopSchema } from '../workshops/schemas/workshop.schema'
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema'
import { SessionsController } from './sessions.controller'
import { SessionsService } from './sessions.service'
import { BadgesModule } from '../badges/badges.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkshopSession.name, schema: WorkshopSessionSchema },
      { name: Workshop.name, schema: WorkshopSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    BadgesModule,
    NotificationsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
