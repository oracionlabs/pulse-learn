import { Controller, Get, Param } from '@nestjs/common'
import { BadgesService } from './badges.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'

@Controller()
export class BadgesController {
  constructor(private badgesService: BadgesService) {}

  @Get('users/me/badges')
  getMyBadges(@CurrentUser() user: { _id: string }) {
    return this.badgesService.getMyBadges(user._id)
  }

  @Get('orgs/:orgId/badges')
  @Roles('org_admin', 'manager')
  getOrgBadges(@Param('orgId') orgId: string) {
    return this.badgesService.getOrgBadges(orgId)
  }
}
