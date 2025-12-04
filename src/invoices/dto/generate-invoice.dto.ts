import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'ID du document à facturer' })
  @IsString()
  documentId: string;

  @ApiPropertyOptional({ description: 'IDs spécifiques des entrées de temps à inclure' })
  @IsArray()
  @IsOptional()
  timeEntryIds?: string[];

  @ApiPropertyOptional({ description: 'Période de début pour les entrées de temps' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Période de fin pour les entrées de temps' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Inclure seulement les entrées non facturées' })
  @IsBoolean()
  @IsOptional()
  onlyUninvoiced?: boolean = true;

  @ApiPropertyOptional({ description: 'Taux de taxe personnalisé' })
  @IsString()
  @IsOptional()
  customTaxRate?: string;
}