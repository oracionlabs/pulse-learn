import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { MeController } from './me.controller';
import { InviteController } from './invite.controller';
import { UsersService } from './users.service';
import { InviteService } from './invite.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, MeController, InviteController],
  providers: [UsersService, InviteService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
