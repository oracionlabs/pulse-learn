// uuid is ESM-only; mock it so Jest (CJS) can handle the import
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { Workshop } from './schemas/workshop.schema';

const mockWorkshop = {
  _id: 'workshop-id',
  orgId: 'org-id',
  title: 'Test Workshop',
  isTemplate: false,
  isPublished: false,
  steps: [],
  totalPoints: 0,
  save: jest.fn().mockResolvedValue(undefined),
  toObject: jest.fn().mockReturnValue({
    _id: 'workshop-id',
    title: 'Test Workshop',
    steps: [],
    isTemplate: false,
  }),
};

const mockWorkshopModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
};

describe('WorkshopsService', () => {
  let service: WorkshopsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        { provide: getModelToken(Workshop.name), useValue: mockWorkshopModel },
      ],
    }).compile();

    service = module.get<WorkshopsService>(WorkshopsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns workshop when found', async () => {
      mockWorkshopModel.findById.mockResolvedValue(mockWorkshop);
      const result = await service.findOne('workshop-id');
      expect(result).toEqual(mockWorkshop);
    });

    it('throws NotFoundException when workshop not found', async () => {
      mockWorkshopModel.findById.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recalcTotalPoints', () => {
    it('sums points from all steps and sets workshop.totalPoints', () => {
      const workshop = {
        steps: [{ points: 10 }, { points: 15 }, { points: 20 }],
        totalPoints: 0,
      } as never;
      service['recalcTotalPoints'](workshop);
      expect(workshop.totalPoints).toBe(45);
    });

    it('sets 0 for empty steps', () => {
      const workshop = { steps: [], totalPoints: 99 } as never;
      service['recalcTotalPoints'](workshop);
      expect(workshop.totalPoints).toBe(0);
    });
  });

  describe('findTemplates', () => {
    it('queries for published templates', async () => {
      const mockChain = { sort: jest.fn().mockResolvedValue([]) };
      mockWorkshopModel.find.mockReturnValue(mockChain);

      await service.findTemplates();

      expect(mockWorkshopModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isTemplate: true, isPublished: true }),
      );
    });
  });
});
