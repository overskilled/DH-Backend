import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, IsArray, IsEnum } from 'class-validator';

export class CreateTaskDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'] })
    @IsEnum(['ACTIVE', 'ARCHIVED', 'CLOSED'])
    @IsOptional()
    status?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsString()
    listId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    requestedAssignees?: string[];

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    maxTimeHours?: number;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dueDate?: Date;
}