import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AiService {
  private client: Anthropic
  private configured: boolean

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('anthropic.apiKey')
    this.configured = !!apiKey
    this.client = new Anthropic({ apiKey: apiKey ?? 'placeholder' })
  }

  async generateWorkshop(prompt: {
    topic: string
    vertical: string
    difficulty: string
    stepCount: number
    includeQuiz: boolean
    includeScenario: boolean
  }) {
    if (!this.configured) throw new BadRequestException('Anthropic API key not configured')

    const stepTypes = ['content']
    if (prompt.includeQuiz) stepTypes.push('quiz')
    if (prompt.includeScenario) stepTypes.push('scenario')
    stepTypes.push('reflection')

    const response = await this.client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: `You are an expert instructional designer creating micro-learning workshops.
Return ONLY valid JSON with no markdown fences, no explanation, and no trailing text.`,
      messages: [
        {
          role: 'user',
          content: `Create a micro-learning workshop about: "${prompt.topic}"
Vertical: ${prompt.vertical}
Difficulty: ${prompt.difficulty}
Target steps: ${prompt.stepCount}
Include these step types where appropriate: ${stepTypes.join(', ')}

Return ONLY valid JSON exactly matching this schema:
{
  "title": "string",
  "description": "string",
  "steps": [
    {
      "type": "content",
      "title": "string",
      "content": { "body": "string (2-3 paragraphs of markdown)" },
      "animationType": "slide_up",
      "points": 0
    },
    {
      "type": "quiz",
      "title": "string",
      "quiz": {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswerIndex": 0,
        "explanation": "string"
      },
      "animationType": "slide_up",
      "points": 20
    },
    {
      "type": "scenario",
      "title": "string",
      "scenario": {
        "prompt": "string",
        "choices": [
          { "id": "a", "text": "string", "isCorrect": true, "feedback": "string" },
          { "id": "b", "text": "string", "isCorrect": false, "feedback": "string" },
          { "id": "c", "text": "string", "isCorrect": false, "feedback": "string" }
        ]
      },
      "animationType": "fade_in",
      "points": 30
    },
    {
      "type": "reflection",
      "title": "string",
      "reflection": { "prompt": "string", "minLength": 50, "maxLength": 300 },
      "animationType": "slide_up",
      "points": 10
    }
  ]
}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const parsed = JSON.parse(textBlock.text) as {
      title: string
      description: string
      steps: Record<string, unknown>[]
    }

    const steps = (parsed.steps ?? []).map((s, i) => ({
      ...s,
      stepId: uuidv4(),
      order: i,
    }))

    return {
      title: parsed.title ?? prompt.topic,
      description: parsed.description ?? '',
      vertical: prompt.vertical,
      difficulty: prompt.difficulty,
      steps,
      totalPoints: steps.reduce(
        (sum, s) => sum + (((s as Record<string, unknown>).points as number) ?? 0),
        0,
      ),
    }
  }
}
