import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Référence de la facture' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'ID du document' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'ID du client' })
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'Montant total' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Taux de taxe' })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

   @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date d\'échéance' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Statut de la facture' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur émetteur' })
  @IsString()
  @IsOptional()
  issuedById?: string;
}