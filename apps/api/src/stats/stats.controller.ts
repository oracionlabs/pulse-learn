import { Controller, Get, Param, Res } from '@nestjs/common'
import type { Response } from 'express'
import { StatsService } from './stats.service'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('orgs/:orgId/stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get()
  @Roles('org_admin', 'manager')
  getOrgStats(@Param('orgId') orgId: string) {
    return this.statsService.getOrgStats(orgId)
  }

  @Get('export/sessions.csv')
  @Roles('org_admin', 'manager')
  async exportCsv(@Param('orgId') orgId: string, @Res() res: Response) {
    const csv = await this.statsService.exportSessionsCsv(orgId)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"')
    res.send(csv)
  }
}
