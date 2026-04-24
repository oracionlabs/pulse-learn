import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('orgs/:orgId/billing')
  @Roles('org_admin')
  getBillingInfo(@Param('orgId') orgId: string) {
    return this.billingService.getBillingInfo(orgId);
  }

  @Post('orgs/:orgId/billing/checkout')
  @Roles('org_admin')
  createCheckout(
    @Param('orgId') orgId: string,
    @CurrentUser() _user: unknown,
    @Body() body: { plan: string; returnUrl: string },
  ) {
    return this.billingService.createCheckoutSession(
      orgId,
      body.plan,
      body.returnUrl,
    );
  }

  @Post('webhooks/stripe')
  @Public()
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.billingService.handleWebhook(
      req.rawBody ?? Buffer.alloc(0),
      sig,
    );
  }
}
