import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Workshop, WorkshopSchema } from '../workshops/schemas/workshop.schema';
import {
  WorkshopSession,
  WorkshopSessionSchema,
} from '../sessions/schemas/session.schema';
import {
  Assignment,
  AssignmentSchema,
} from '../assignments/schemas/assignment.schema';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Workshop.name, schema: WorkshopSchema },
      { name: WorkshopSession.name, schema: WorkshopSessionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
