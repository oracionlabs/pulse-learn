import { Controller, Get, Put, Param, Body } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('orgs')
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get(':orgId')
  findOne(@Param('orgId') orgId: string) {
    return this.orgsService.findOne(orgId)
  }

  @Put(':orgId')
  @Roles('org_admin')
  update(@Param('orgId') orgId: string, @Body() body: Record<string, unknown>) {
    return this.orgsService.update(orgId, body as never)
  }

  @Put(':orgId/settings')
  @Roles('org_admin')
  updateSettings(@Param('orgId') orgId: string, @Body() body: Record<string, unknown>) {
    return this.orgsService.update(orgId, { settings: body } as never)
  }
}
