
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export enum DocumentType {
    PROJECT = 'PROJECT',
    CONTRACT = 'CONTRACT',
    PROPOSAL = 'PROPOSAL',
    REPORT = 'REPORT',
    OTHER = 'OTHER'
}

export class CreateDocumentDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    reference: string;

    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    type: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    budgetAmount?: any;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    referentId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    departmentId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    responsableId?: string;
}