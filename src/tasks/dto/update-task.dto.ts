import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, IsIn } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ 
    enum: [
      'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'SUSPENDED',
      'todo', 'in_progress', 'review', 'completed', 'suspended', 'cancelled'
    ] 
  })
  @IsIn([
    'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'SUSPENDED',
    'todo', 'in_progress', 'review', 'completed', 'suspended', 'cancelled'
  ])
  @IsOptional()
  status?: string;
}
// ff