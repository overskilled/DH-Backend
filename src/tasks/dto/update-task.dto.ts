import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'] })
  @IsEnum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  @IsOptional()
  status?: string;
}