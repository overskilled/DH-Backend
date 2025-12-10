import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, IsDateString, IsIn } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  listId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxTimeHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn([
    'todo', 'in_progress', 'review', 'completed', 'suspended', 'cancelled',
    'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'SUSPENDED'
  ])
  status?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  createdById?: string;
}