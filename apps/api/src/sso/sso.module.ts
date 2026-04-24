import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SsoController } from './sso.controller'
import { SsoService } from './sso.service'
import { User, UserSchema } from '../users/schemas/user.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [SsoController],
  providers: [SsoService],
})
export class SsoModule {}
