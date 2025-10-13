import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateDocumentDto, DocumentType } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'] })
  @IsEnum(['ACTIVE', 'ARCHIVED', 'CLOSED'])
  @IsOptional()
  status?: string;
}