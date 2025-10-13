import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsNumber()
  hoursSpent: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: Date;
}