import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateClientDto {
    @ApiProperty({ description: 'Client full name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Client email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Client phone number', required: false })
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @ApiProperty({ description: 'Company name', required: false })
    @IsOptional()
    @IsString()
    companyName?: string;

    @ApiProperty({ description: 'Client address', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ description: 'Client city', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ description: 'Client country', required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty({ description: 'VAT number', required: false })
    @IsOptional()
    @IsString()
    vatNumber?: string;
}