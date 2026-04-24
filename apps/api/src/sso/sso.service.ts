import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, type UserDocument } from '../users/schemas/user.schema';

/**
 * Mock SSO importer — simulates reading from Google Workspace / Microsoft 365 APIs.
 * Real OAuth integration swaps out `fetchProviderUsers()` per provider;
 * the diff-sync logic below remains unchanged.
 *
 * Swap path:
 *   Google: replace mock data with calls to Admin SDK people.list / directory.users.list
 *   Microsoft: replace with Microsoft Graph /users endpoint
 *   Okta: replace with Okta Users API /api/v1/users
 */

interface ProviderUser {
  email: string;
  name: string;
  department?: string;
  title?: string;
  externalId: string;
}

const MOCK_GOOGLE_USERS: ProviderUser[] = [
  {
    email: 'alice.wonder@acme.com',
    name: 'Alice Wonder',
    department: 'Engineering',
    externalId: 'g_001',
  },
  {
    email: 'bob.builder@acme.com',
    name: 'Bob Builder',
    department: 'Product',
    externalId: 'g_002',
  },
  {
    email: 'carol.danvers@acme.com',
    name: 'Carol Danvers',
    department: 'Design',
    externalId: 'g_003',
  },
];

const MOCK_MICROSOFT_USERS: ProviderUser[] = [
  {
    email: 'dave.rogers@acme.com',
    name: 'Dave Rogers',
    department: 'Sales',
    externalId: 'ms_001',
  },
  {
    email: 'eve.summers@acme.com',
    name: 'Eve Summers',
    department: 'HR',
    externalId: 'ms_002',
  },
];

@Injectable()
export class SsoService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private fetchProviderUsers(
    provider: 'google' | 'microsoft',
  ): ProviderUser[] {
    // In production: call real API here and map to ProviderUser[]
    return provider === 'google' ? MOCK_GOOGLE_USERS : MOCK_MICROSOFT_USERS;
  }

  async sync(orgId: string, provider: 'google' | 'microsoft') {
    const providerUsers = this.fetchProviderUsers(provider);
    const orgObjectId = new Types.ObjectId(orgId);

    const existing = await this.userModel.find({
      orgId: orgObjectId,
      ssoProvider: provider,
    });
    const existingByExtId = new Map(existing.map((u) => [u.ssoId, u]));
    const existingEmails = new Set(existing.map((u) => u.email));
    const incomingExtIds = new Set(providerUsers.map((u) => u.externalId));

    const added: string[] = [];
    const updated: string[] = [];
    const deactivated: string[] = [];

    // Add or update
    for (const pu of providerUsers) {
      const existingUser = existingByExtId.get(pu.externalId);
      if (existingUser) {
        const changed =
          existingUser.name !== pu.name ||
          existingUser.email !== pu.email.toLowerCase();
        if (changed) {
          await this.userModel.updateOne(
            { _id: existingUser._id },
            {
              name: pu.name,
              email: pu.email.toLowerCase(),
              department: pu.department,
            },
          );
          updated.push(pu.email);
        }
      } else if (!existingEmails.has(pu.email.toLowerCase())) {
        const hash = await bcrypt.hash(Math.random().toString(36), 10);
        await this.userModel.create({
          orgId: orgObjectId,
          email: pu.email.toLowerCase(),
          name: pu.name,
          role: 'learner',
          status: 'active',
          ssoProvider: provider,
          ssoId: pu.externalId,
          department: pu.department,
          title: pu.title,
          passwordHash: hash,
        });
        added.push(pu.email);
      }
    }

    // Deactivate removed users
    for (const user of existing) {
      if (
        !incomingExtIds.has(user.ssoId ?? '') &&
        user.status !== 'deactivated'
      ) {
        await this.userModel.updateOne(
          { _id: user._id },
          { status: 'deactivated' },
        );
        deactivated.push(user.email);
      }
    }

    return {
      provider,
      added,
      updated,
      deactivated,
      total: providerUsers.length,
    };
  }
}
