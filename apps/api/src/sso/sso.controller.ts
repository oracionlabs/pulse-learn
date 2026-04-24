import { Controller, Post, Param } from '@nestjs/common';
import { SsoService } from './sso.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orgs/:orgId/sso')
export class SsoController {
  constructor(private ssoService: SsoService) {}

  @Post('sync/google')
  @Roles('org_admin')
  syncGoogle(@Param('orgId') orgId: string) {
    return this.ssoService.sync(orgId, 'google');
  }

  @Post('sync/microsoft')
  @Roles('org_admin')
  syncMicrosoft(@Param('orgId') orgId: string) {
    return this.ssoService.sync(orgId, 'microsoft');
  }
}
