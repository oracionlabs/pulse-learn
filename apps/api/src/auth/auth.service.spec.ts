import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/schemas/user.schema';
import { Organization } from '../organizations/schemas/organization.schema';

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockOrgModel = {
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'jwt.accessExpiresIn') return '15m';
    if (key === 'jwt.secret') return 'test-secret';
    return undefined;
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Organization.name), useValue: mockOrgModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({ email: 'unknown@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          email: 'test@test.com',
          passwordHash: '$2b$12$wronghash',
          role: 'learner',
          orgId: '507f1f77bcf86cd799439012',
          status: 'active',
        }),
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
      });

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'password123',
          name: 'Existing User',
          orgName: 'Test Org',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
