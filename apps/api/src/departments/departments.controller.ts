import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orgs/:orgId/departments')
export class DepartmentsController {
  constructor(private deptService: DepartmentsService) {}

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.deptService.findAll(orgId);
  }

  @Post()
  @Roles('org_admin', 'manager')
  create(
    @Param('orgId') orgId: string,
    @Body()
    body: { name: string; managerId?: string; parentDepartmentId?: string },
  ) {
    return this.deptService.create(orgId, body);
  }

  @Put(':deptId')
  @Roles('org_admin', 'manager')
  update(
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
    @Body()
    body: { name?: string; managerId?: string; parentDepartmentId?: string },
  ) {
    return this.deptService.update(orgId, deptId, body);
  }

  @Delete(':deptId')
  @Roles('org_admin')
  remove(@Param('orgId') orgId: string, @Param('deptId') deptId: string) {
    return this.deptService.remove(orgId, deptId);
  }
}
