import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { Workshop, type WorkshopDocument } from './schemas/workshop.schema'

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>,
  ) {}

  async findTemplates() {
    return this.workshopModel
      .find({ isTemplate: true, isPublished: true })
      .sort({ createdAt: -1 })
  }

  async findOrgWorkshops(orgId: string, page = 1, limit = 20) {
    const filter = { orgId: new Types.ObjectId(orgId), isTemplate: false }
    const [data, total] = await Promise.all([
      this.workshopModel
        .find(filter)
        .populate('createdBy', 'name avatar_url')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.workshopModel.countDocuments(filter),
    ])
    return { data, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId)
    if (!workshop) throw new NotFoundException('Workshop not found')
    return workshop
  }

  async create(orgId: string, createdBy: string, dto: Partial<WorkshopDocument>) {
    return this.workshopModel.create({
      ...dto,
      orgId: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(createdBy),
      isTemplate: false,
      isPublished: false,
      version: 1,
    })
  }

  async update(workshopId: string, orgId: string, dto: Partial<WorkshopDocument>) {
    const workshop = await this.workshopModel.findOne({
      _id: workshopId,
      orgId: new Types.ObjectId(orgId),
    })
    if (!workshop) throw new NotFoundException('Workshop not found')

    // Versioning: if published, create a new version doc
    if (workshop.isPublished) {
      const prevId = workshop._id
      const newWorkshop = await this.workshopModel.create({
        ...workshop.toObject(),
        _id: new Types.ObjectId(),
        ...dto,
        version: workshop.version + 1,
        previousVersionId: prevId,
        isPublished: false,
      } as never)
      return newWorkshop
    }

    Object.assign(workshop, dto)
    return workshop.save()
  }

  async remove(workshopId: string, orgId: string) {
    const result = await this.workshopModel.deleteOne({
      _id: workshopId,
      orgId: new Types.ObjectId(orgId),
    })
    if (result.deletedCount === 0) throw new NotFoundException('Workshop not found')
    return { deleted: true }
  }

  async publish(workshopId: string, orgId: string) {
    const workshop = await this.workshopModel.findOneAndUpdate(
      { _id: workshopId, orgId: new Types.ObjectId(orgId) },
      { isPublished: true, publishedAt: new Date() },
      { new: true },
    )
    if (!workshop) throw new NotFoundException('Workshop not found')
    return workshop
  }

  async unpublish(workshopId: string, orgId: string) {
    const workshop = await this.workshopModel.findOneAndUpdate(
      { _id: workshopId, orgId: new Types.ObjectId(orgId) },
      { isPublished: false },
      { new: true },
    )
    if (!workshop) throw new NotFoundException('Workshop not found')
    return workshop
  }

  async cloneTemplate(templateId: string, orgId: string, createdBy: string) {
    const template = await this.workshopModel.findById(templateId)
    if (!template || !template.isTemplate) {
      throw new NotFoundException('Template not found')
    }

    const templateObj = template.toObject() as unknown as Record<string, unknown>

    // Regenerate all step UUIDs and update nextStepId references
    const idMap: Record<string, string> = {}
    const rawSteps = (templateObj.steps as unknown[]).map((s) => s as Record<string, unknown>)
    const newSteps = rawSteps.map((step) => {
      const newId = uuidv4()
      idMap[step.stepId as string] = newId
      return { ...step, stepId: newId }
    })

    // Update scenario nextStepId references
    const relinkedSteps = newSteps.map((step) => {
      const stepScenario = ((step as Record<string, unknown>).scenario as { choices: { nextStepId?: string }[] } | undefined)
      if (stepScenario && stepScenario.choices) {
        return {
          ...step,
          scenario: {
            ...stepScenario,
            choices: stepScenario.choices.map((c) => ({
              ...c,
              nextStepId: c.nextStepId ? idMap[c.nextStepId] ?? c.nextStepId : undefined,
            })),
          },
        }
      }
      return step
    })

    return this.workshopModel.create({
      ...templateObj,
      _id: new Types.ObjectId(),
      orgId: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(createdBy),
      isTemplate: false,
      isPublished: false,
      steps: relinkedSteps,
      version: 1,
      previousVersionId: undefined,
      updatedAt: undefined,
    } as never)
  }

  // --- Step operations ---

  async addStep(workshopId: string, orgId: string, stepDto: Record<string, unknown>) {
    const workshop = await this.findOneOwned(workshopId, orgId)
    const steps = workshop.steps as Record<string, unknown>[]
    const newStep = {
      stepId: uuidv4(),
      order: steps.length,
      animationType: 'slide_up',
      points: 10,
      ...stepDto,
    }
    steps.push(newStep)
    workshop.steps = steps
    this.recalcTotalPoints(workshop)
    return workshop.save()
  }

  async updateStep(workshopId: string, orgId: string, stepId: string, dto: Record<string, unknown>) {
    const workshop = await this.findOneOwned(workshopId, orgId)
    const steps = workshop.steps as Record<string, unknown>[]
    const idx = steps.findIndex((s) => s.stepId === stepId)
    if (idx === -1) throw new NotFoundException('Step not found')
    steps[idx] = { ...steps[idx], ...dto, stepId }
    workshop.steps = steps
    this.recalcTotalPoints(workshop)
    return workshop.save()
  }

  async deleteStep(workshopId: string, orgId: string, stepId: string) {
    const workshop = await this.findOneOwned(workshopId, orgId)
    workshop.steps = (workshop.steps as Record<string, unknown>[])
      .filter((s) => s.stepId !== stepId)
      .map((s, i) => ({ ...s, order: i }))
    this.recalcTotalPoints(workshop)
    return workshop.save()
  }

  async reorderSteps(workshopId: string, orgId: string, orderedStepIds: string[]) {
    const workshop = await this.findOneOwned(workshopId, orgId)
    const stepsMap = new Map(
      (workshop.steps as Record<string, unknown>[]).map((s) => [s.stepId, s]),
    )
    workshop.steps = orderedStepIds
      .map((id, i) => {
        const step = stepsMap.get(id)
        if (!step) throw new NotFoundException(`Step ${id} not found`)
        return { ...step, order: i }
      })
    return workshop.save()
  }

  private async findOneOwned(workshopId: string, orgId: string) {
    const workshop = await this.workshopModel.findOne({
      _id: workshopId,
      orgId: new Types.ObjectId(orgId),
    })
    if (!workshop) throw new NotFoundException('Workshop not found')
    return workshop
  }

  private recalcTotalPoints(workshop: WorkshopDocument) {
    const steps = workshop.steps as { points?: number }[]
    workshop.totalPoints = steps.reduce((sum, s) => sum + (s.points ?? 0), 0)
  }
}
