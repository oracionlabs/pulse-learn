import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common'
import { SessionsService } from './sessions.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { StartSessionDto } from './dto/start-session.dto'
import { RespondDto } from './dto/respond.dto'

@Controller()
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post('sessions/start')
  start(
    @CurrentUser() user: { _id: string; orgId: string },
    @Body() dto: StartSessionDto,
  ) {
    return this.sessionsService.start(user._id, user.orgId, dto.workshopId, dto.assignmentId)
  }

  @Post('sessions/:sessionId/respond')
  respond(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: RespondDto,
  ) {
    return this.sessionsService.respond(sessionId, user._id, dto)
  }

  @Post('sessions/:sessionId/complete')
  complete(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.sessionsService.complete(sessionId, user._id)
  }

  @Get('sessions/:sessionId')
  getSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.sessionsService.getSession(sessionId, user._id)
  }

  @Get('users/me/sessions')
  getMyHistory(@CurrentUser() user: { _id: string }) {
    return this.sessionsService.getMyHistory(user._id)
  }

  @Get('orgs/:orgId/leaderboard')
  @Roles('org_admin', 'manager', 'learner')
  getLeaderboard(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.getLeaderboard(orgId, limit ? parseInt(limit, 10) : 20)
  }
}
