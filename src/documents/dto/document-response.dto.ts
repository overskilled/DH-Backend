import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    reference: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    creatorId: string;

    @ApiProperty()
    responsableId?: string;

    @ApiProperty()
    clientId?: string;

    @ApiProperty()
    departmentId?: string;

    @ApiProperty()
    creator: any;

    @ApiProperty()
    responsable?: any;

    @ApiProperty()
    client?: any;

    @ApiProperty()
    department?: any;

    @ApiProperty()
    lists?: any[];

    @ApiProperty()
    files?: any[];
}

export class DocumentDetailResponseDto extends DocumentResponseDto {
    @ApiProperty()
    referent?: any;

    @ApiProperty()
    invoices?: any[];

    @ApiProperty()
    reports?: any[];

    @ApiProperty()
    auditLogs?: any[];
}