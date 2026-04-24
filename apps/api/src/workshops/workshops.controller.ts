import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class WorkshopsController {
  constructor(private workshopsService: WorkshopsService) {}

  // Global templates (public for browsing)
  @Get('workshops')
  @Public()
  getTemplates() {
    return this.workshopsService.findTemplates();
  }

  // Org workshops
  @Get('orgs/:orgId/workshops')
  getOrgWorkshops(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workshopsService.findOrgWorkshops(
      orgId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('orgs/:orgId/workshops')
  @Roles('org_admin', 'manager')
  create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: Record<string, unknown>,
  ) {
    return this.workshopsService.create(orgId, user._id, dto);
  }

  @Get('orgs/:orgId/workshops/:workshopId')
  findOne(@Param('workshopId') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Put('orgs/:orgId/workshops/:workshopId')
  @Roles('org_admin', 'manager')
  update(
    @Param('orgId') orgId: string,
    @Param('workshopId') id: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.workshopsService.update(id, orgId, dto);
  }

  @Delete('orgs/:orgId/workshops/:workshopId')
  @Roles('org_admin', 'manager')
  remove(@Param('orgId') orgId: string, @Param('workshopId') id: string) {
    return this.workshopsService.remove(id, orgId);
  }

  @Post('orgs/:orgId/workshops/:workshopId/publish')
  @Roles('org_admin', 'manager')
  publish(@Param('orgId') orgId: string, @Param('workshopId') id: string) {
    return this.workshopsService.publish(id, orgId);
  }

  @Post('orgs/:orgId/workshops/:workshopId/unpublish')
  @Roles('org_admin', 'manager')
  unpublish(@Param('orgId') orgId: string, @Param('workshopId') id: string) {
    return this.workshopsService.unpublish(id, orgId);
  }

  @Post('orgs/:orgId/workshops/:workshopId/clone')
  @Roles('org_admin', 'manager')
  clone(
    @Param('orgId') orgId: string,
    @Param('workshopId') templateId: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.workshopsService.cloneTemplate(templateId, orgId, user._id);
  }

  // Steps
  @Post('orgs/:orgId/workshops/:workshopId/steps')
  @Roles('org_admin', 'manager')
  addStep(
    @Param('orgId') orgId: string,
    @Param('workshopId') workshopId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.workshopsService.addStep(workshopId, orgId, dto);
  }

  @Put('orgs/:orgId/workshops/:workshopId/steps/:stepId')
  @Roles('org_admin', 'manager')
  updateStep(
    @Param('orgId') orgId: string,
    @Param('workshopId') workshopId: string,
    @Param('stepId') stepId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.workshopsService.updateStep(workshopId, orgId, stepId, dto);
  }

  @Delete('orgs/:orgId/workshops/:workshopId/steps/:stepId')
  @Roles('org_admin', 'manager')
  deleteStep(
    @Param('orgId') orgId: string,
    @Param('workshopId') workshopId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.workshopsService.deleteStep(workshopId, orgId, stepId);
  }

  @Patch('orgs/:orgId/workshops/:workshopId/steps/reorder')
  @Roles('org_admin', 'manager')
  reorderSteps(
    @Param('orgId') orgId: string,
    @Param('workshopId') workshopId: string,
    @Body() body: { orderedStepIds: string[] },
  ) {
    return this.workshopsService.reorderSteps(
      workshopId,
      orgId,
      body.orderedStepIds,
    );
  }
}
