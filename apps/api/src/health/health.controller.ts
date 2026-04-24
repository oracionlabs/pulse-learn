import { Controller, Get } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: this.connection.readyState === 1 ? 'connected' : 'disconnected',
    }
  }
}
