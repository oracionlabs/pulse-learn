/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');

type StripeInstance = Record<string, unknown> & {
  checkout: {
    sessions: { create: (p: unknown) => Promise<{ url: string | null }> };
  };
  webhooks: {
    constructEvent: (
      p: Buffer,
      s: string,
      sec: string,
    ) => { type: string; data: { object: unknown } };
  };
};
import {
  Organization,
  type OrganizationDocument,
} from '../organizations/schemas/organization.schema';

const PLAN_PRICES: Record<string, string> = {
  starter: 'price_starter_monthly', // Replace with real Stripe price IDs
  growth: 'price_growth_monthly',
  enterprise: 'price_enterprise_monthly',
};

@Injectable()
export class BillingService {
  private stripe: StripeInstance | null = null;

  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private config: ConfigService,
  ) {
    const key = config.get<string>('stripe.secretKey') ?? '';
    if (key && key.startsWith('sk_')) {
      this.stripe = new StripeLib(key) as StripeInstance;
    }
  }

  async createCheckoutSession(orgId: string, plan: string, returnUrl: string) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new BadRequestException('Organization not found');

    const priceId = PLAN_PRICES[plan];
    if (!priceId) throw new BadRequestException('Invalid plan');

    if (!this.stripe) {
      return { url: `${returnUrl}?success=true&plan=${plan}`, mock: true };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { orgId, plan },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      client_reference_id: orgId,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret') ?? '';
    if (!webhookSecret || !this.stripe) return { received: true };

    let event: { type: string; data: { object: unknown } };
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { orgId?: string; plan?: string };
        customer?: string;
        subscription?: string;
      };
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan;
      if (orgId && plan) {
        await this.orgModel.updateOne(
          { _id: new Types.ObjectId(orgId) },
          {
            $set: {
              plan,
              'subscription.stripeCustomerId': session.customer,
              'subscription.stripeSubscriptionId': session.subscription,
              'subscription.status': 'active',
              'subscription.currentPeriodEnd': null,
            },
          },
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { id: string };
      await this.orgModel.updateOne(
        { 'subscription.stripeSubscriptionId': sub.id },
        { $set: { plan: 'free', 'subscription.status': 'canceled' } },
      );
    }

    return { received: true };
  }

  async getBillingInfo(orgId: string) {
    const org = await this.orgModel
      .findById(orgId)
      .select('plan subscription name');
    return {
      plan: org?.plan ?? 'free',
      subscription: org?.subscription ?? null,
    };
  }
}
