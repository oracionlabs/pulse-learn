import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { BadgesService } from './badges.service'
import { Badge } from './schemas/badge.schema'

const mockBadgeModel = {
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}

describe('BadgesService', () => {
  let service: BadgesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        { provide: getModelToken(Badge.name), useValue: mockBadgeModel },
      ],
    }).compile()

    service = module.get<BadgesService>(BadgesService)
    jest.clearAllMocks()
  })

  describe('awardBadge', () => {
    it('creates a badge for a valid key', async () => {
      const mockBadge = { key: 'first_completion', name: 'First Steps' }
      mockBadgeModel.create.mockResolvedValue(mockBadge)

      const result = await service.awardBadge('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'first_completion')
      expect(result).toEqual(mockBadge)
      expect(mockBadgeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'first_completion' }),
      )
    })

    it('returns null for unknown badge key', async () => {
      const result = await service.awardBadge('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'unknown_badge')
      expect(result).toBeNull()
      expect(mockBadgeModel.create).not.toHaveBeenCalled()
    })

    it('returns null silently on duplicate (already awarded)', async () => {
      mockBadgeModel.create.mockRejectedValue({ code: 11000 })
      const result = await service.awardBadge('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'first_completion')
      expect(result).toBeNull()
    })
  })

  describe('checkAndAwardBadges', () => {
    it('awards first_completion badge on first session', async () => {
      mockBadgeModel.create.mockResolvedValue({ key: 'first_completion', name: 'First Steps', icon: '🎉', description: 'test' })

      const awarded = await service.checkAndAwardBadges('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
        completionsCount: 1,
        scorePercent: 80,
        timeSpentSeconds: 600,
        streakDays: 1,
      })

      expect(awarded.some(b => b.key === 'first_completion')).toBe(true)
    })

    it('awards high_scorer badge for 100% score', async () => {
      mockBadgeModel.create.mockResolvedValue({ key: 'high_scorer', name: 'High Scorer', icon: '⭐', description: 'test' })

      const awarded = await service.checkAndAwardBadges('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
        completionsCount: 3,
        scorePercent: 100,
        timeSpentSeconds: 300,
        streakDays: 1,
      })

      expect(awarded.some(b => b.key === 'high_scorer')).toBe(true)
    })

    it('awards speed_learner badge for sub-5-minute completion', async () => {
      mockBadgeModel.create.mockResolvedValue({ key: 'speed_learner', name: 'Speed Learner', icon: '🚀', description: 'test' })

      const awarded = await service.checkAndAwardBadges('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
        completionsCount: 2,
        scorePercent: 75,
        timeSpentSeconds: 200,
        streakDays: 1,
      })

      expect(awarded.some(b => b.key === 'speed_learner')).toBe(true)
    })
  })
})
