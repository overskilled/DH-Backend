import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateListDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  documentId: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}