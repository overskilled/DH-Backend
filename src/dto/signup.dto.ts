import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsEnum, IsNumber, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SignupDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        required: true
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;
    
    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;
    
    @ApiProperty({
        description: 'User position at the company',
        example: 'Stagaire',
        required: false
    })
    @IsString()
    @IsNotEmpty()
    position: string;

    @ApiProperty({
        description: 'User password (minimum 6 characters)',
        example: 'securePassword123',
        minLength: 6,
        required: true
    })
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({
        description: 'User role',
        example: Role.JUNIOR,
        enum: Role,
        required: false
    })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional({
        description: 'Department ID',
        example: 'dept-12345',
        required: false
    })
    @IsOptional()
    @IsString()
    departmentId?: string;

    @ApiPropertyOptional({
        description: 'Pricing per hour',
        example: 50.00,
        required: false
    })
    @IsOptional()
    @IsNumber()
    pricingPerHour?: number;

    // Optional profile fields that might be useful for user management
    @ApiPropertyOptional({ 
        description: 'Phone number', 
        example: '+237 6XX XXX XXX' 
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ 
        description: 'Professional title', 
        example: 'Senior Software Engineer' 
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ 
        description: 'Bio or description', 
        example: 'Experienced software developer with 5+ years in web development' 
    })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ 
        description: 'Profile picture URL', 
        example: 'https://example.com/profile.jpg' 
    })
    @IsOptional()
    @IsString()
    profilePicture?: string;

    // Contact information
    @ApiPropertyOptional({ 
        description: 'Office address', 
        example: '123 Tech Street, Silicon Valley' 
    })
    @IsOptional()
    @IsString()
    officeAddress?: string;

    @ApiPropertyOptional({ 
        description: 'Personal website or portfolio', 
        example: 'https://johndoe.dev' 
    })
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional({ 
        description: 'LinkedIn profile URL', 
        example: 'https://linkedin.com/in/johndoe' 
    })
    @IsOptional()
    @IsString()
    linkedIn?: string;

    @ApiPropertyOptional({ 
        description: 'GitHub profile URL', 
        example: 'https://github.com/johndoe' 
    })
    @IsOptional()
    @IsString()
    github?: string;

    // Work-related information
    @ApiPropertyOptional({ 
        description: 'Years of experience', 
        example: 5,
        minimum: 0 
    })
    @IsOptional()
    @IsNumber()
    yearsOfExperience?: number;

    @ApiPropertyOptional({ 
        description: 'Skills (comma-separated)', 
        example: 'JavaScript,TypeScript,NestJS,React' 
    })
    @IsOptional()
    @IsString()
    skills?: string;

    @ApiPropertyOptional({ 
        description: 'Certifications (comma-separated)', 
        example: 'AWS Certified,Scrum Master' 
    })
    @IsOptional()
    @IsString()
    certifications?: string;

    @ApiPropertyOptional({ 
        description: 'Languages spoken (comma-separated)', 
        example: 'English,French,Spanish' 
    })
    @IsOptional()
    @IsString()
    languages?: string;

    // Availability and preferences
    @ApiPropertyOptional({ 
        description: 'Is user available for new projects?', 
        example: true 
    })
    @IsOptional()
    availableForProjects?: boolean;

    @ApiPropertyOptional({ 
        description: 'Preferred working hours per week', 
        example: 40 
    })
    @IsOptional()
    @IsNumber()
    preferredHoursPerWeek?: number;

    @ApiPropertyOptional({ 
        description: 'Minimum acceptable hourly rate', 
        example: 45.00 
    })
    @IsOptional()
    @IsNumber()
    minimumHourlyRate?: number;

    // Emergency contact (simplified from your original)
    @ApiPropertyOptional({ 
        description: 'Emergency contact name', 
        example: 'Jane Smith' 
    })
    @IsOptional()
    @IsString()
    emergencyContactName?: string;

    @ApiPropertyOptional({ 
        description: 'Emergency contact phone', 
        example: '+237 6XX XXX XXX' 
    })
    @IsOptional()
    @IsString()
    emergencyContactPhone?: string;

    @ApiPropertyOptional({ 
        description: 'Emergency contact relationship', 
        example: 'Spouse' 
    })
    @IsOptional()
    @IsString()
    emergencyContactRelationship?: string;

    // Additional metadata
    @ApiPropertyOptional({ 
        description: 'User timezone', 
        example: 'Africa/Douala' 
    })
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiPropertyOptional({ 
        description: 'Preferred communication method', 
        example: 'email',
        enum: ['email', 'slack', 'teams', 'whatsapp'] 
    })
    @IsOptional()
    @IsString()
    preferredCommunication?: string;

    @ApiPropertyOptional({ 
        description: 'Notes or additional information', 
        example: 'Specializes in backend development and system architecture' 
    })
    @IsOptional()
    @IsString()
    notes?: string;
}