import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @ApiProperty({ default: 1, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiProperty({ default: 10, minimum: 1, maximum: 50 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number = 10;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}

export class PaginatedResponse<T> {
    @ApiProperty()
    data: T[];

    @ApiProperty()
    currentPage: number;

    @ApiProperty()
    totalPages: number;

    @ApiProperty()
    remainingPages: number;

    @ApiProperty()
    totalItems: number;

    @ApiProperty()
    itemsPerPage: number;

    @ApiProperty()
    hasMore: boolean;

    constructor(data: T[], total: number, dto: PaginationDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 10;

        this.data = data;
        this.currentPage = page;
        this.itemsPerPage = limit;
        this.totalItems = total;

        // Calculate total pages
        this.totalPages = Math.ceil(total / limit);

        // Calculate remaining pages
        this.remainingPages = Math.max(this.totalPages - page, 0);

        // Do we have more pages?
        this.hasMore = page < this.totalPages;
    }
}