import { ApiProperty } from '@nestjs/swagger';

export class Invoice {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  issueDate: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  paid: boolean;

  @ApiProperty()
  paymentDate?: Date;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  issuedById: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  exportPdfPath?: string;

  @ApiProperty()
  exportExcelPath?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}