import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1, { message: 'Le temps passé doit être supérieur à 0' })
  hoursSpent: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

}