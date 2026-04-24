import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { AssignmentsService, type CreateAssignmentDto } from './assignments.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'

@Controller()
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get('orgs/:orgId/assignments')
  @Roles('org_admin', 'manager')
  findAll(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('workshopId') workshopId?: string,
  ) {
    return this.assignmentsService.findAll(orgId, { status, workshopId })
  }

  @Post('orgs/:orgId/assignments')
  @Roles('org_admin', 'manager')
  create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(orgId, user._id, dto)
  }

  @Put('orgs/:orgId/assignments/:assignmentId')
  @Roles('org_admin', 'manager')
  update(
    @Param('orgId') orgId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.assignmentsService.update(orgId, assignmentId, body as never)
  }

  @Delete('orgs/:orgId/assignments/:assignmentId')
  @Roles('org_admin', 'manager')
  remove(@Param('orgId') orgId: string, @Param('assignmentId') assignmentId: string) {
    return this.assignmentsService.remove(orgId, assignmentId)
  }

  // Learner: get my assignments
  @Get('users/me/assignments')
  getMyAssignments(@CurrentUser() user: { _id: string; orgId: string }) {
    return this.assignmentsService.findMyAssignments(user._id, user.orgId)
  }
}
