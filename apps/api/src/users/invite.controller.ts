import { Controller, Post, Param, Body } from '@nestjs/common'
import { InviteService } from './invite.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { Public } from '../common/decorators/public.decorator'

@Controller()
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @Post('orgs/:orgId/users/invite')
  @Roles('org_admin')
  invite(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() body: { email: string; name: string; role: string },
  ) {
    return this.inviteService.inviteUser(orgId, user._id, body)
  }

  @Post('auth/accept-invite')
  @Public()
  acceptInvite(@Body() body: { token: string; password: string }) {
    return this.inviteService.acceptInvite(body.token, body.password)
  }
}
