import { IsString, IsOptional, IsNumber } from 'class-validator';

export class RespondDto {
  @IsString()
  stepId: string;

  @IsString()
  stepType: string;

  answer: unknown;

  @IsNumber()
  @IsOptional()
  timeSpentSeconds?: number;
}
