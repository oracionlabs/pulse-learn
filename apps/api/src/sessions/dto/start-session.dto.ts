import { IsString, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsString()
  workshopId: string;

  @IsString()
  @IsOptional()
  assignmentId?: string;
}
