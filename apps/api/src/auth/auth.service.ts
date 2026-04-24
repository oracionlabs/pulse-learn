import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  Organization,
  type OrganizationDocument,
} from '../organizations/schemas/organization.schema';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (exists) throw new ConflictException('Email already in use');

    // Auto-create org
    const slug =
      dto.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);

    const org = await this.orgModel.create({ name: dto.orgName, slug });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      orgId: org._id,
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
      role: 'org_admin',
      status: 'active',
    });

    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+passwordHash');

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'deactivated') {
      throw new UnauthorizedException('Account deactivated');
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() },
    );

    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      orgId: user.orgId.toString(),
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: (this.config.get<string>('jwt.accessExpiresIn') ??
        '15m') as never,
    });

    return {
      access_token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        avatar_url: user.avatar_url,
      },
    };
  }
}
