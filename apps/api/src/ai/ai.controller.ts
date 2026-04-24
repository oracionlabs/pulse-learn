import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orgs/:orgId/ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-workshop')
  @Roles('org_admin', 'manager')
  generateWorkshop(
    @Body()
    body: {
      topic: string;
      vertical: string;
      difficulty: string;
      stepCount?: number;
      includeQuiz?: boolean;
      includeScenario?: boolean;
    },
  ) {
    return this.aiService.generateWorkshop({
      topic: body.topic,
      vertical: body.vertical,
      difficulty: body.difficulty,
      stepCount: body.stepCount ?? 5,
      includeQuiz: body.includeQuiz ?? true,
      includeScenario: body.includeScenario ?? true,
    });
  }
}
