import { Controller, Get, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('orgs/:orgId/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('org_admin', 'manager')
  findAll(
    @Param('orgId') orgId: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll(orgId, { search, role, status })
  }

  @Get(':userId')
  @Roles('org_admin', 'manager')
  findOne(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.usersService.findOne(orgId, userId)
  }

  @Put(':userId')
  @Roles('org_admin')
  update(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.usersService.update(orgId, userId, body as never)
  }

  @Delete(':userId')
  @Roles('org_admin')
  deactivate(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.usersService.deactivate(orgId, userId)
  }
}
