import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from 'src/dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { MailerService } from 'src/mailer/mailer.service';
import { Role, Prisma } from '@prisma/client';

type AuthInput = {
    email: string
    password: string
}

type signInData = {
    userId: string
    username: string
}

type AuthResult = {
    accessToken: string
    userId: string
    username: string
    user: any
}

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        username: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailerService: MailerService,
        private prismaService: PrismaService
    ) { }

    async validateUser(input: AuthInput): Promise<signInData | null> {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: input.email,
                isActive: true,
            }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) return null;

        return {
            userId: user.id,
            username: user.email,
        };
    }

    async authenticate(input: AuthInput): Promise<AuthResult> {
        const user = await this.validateUser(input);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.signIn(user);
    }

    async signIn(user: signInData): Promise<AuthResult> {
        const tokenPayload = {
            sub: user.userId,
            username: user.username,
        };

        const accessToken = await this.jwtService.signAsync(tokenPayload);

        const dbUser = await this.prismaService.user.findUnique({
            where: { id: user.userId },
            include: {
                department: true,
                // Core relations
                createdDocuments: {
                    include: {
                        client: true,
                        referent: true
                    }
                },
                responsibleDocuments: {
                    include: {
                        client: true,
                        referent: true
                    }
                },
                issuedInvoices: {
                    include: {
                        client: true,
                        document: true
                    }
                },
                uploadedFiles: true,
                generatedReports: true,
                notifications: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                // Task management relations
                managedDepartments: true,
                assignedTasks: {
                    include: {
                        list: {
                            include: {
                                document: true
                            }
                        },
                        timeEntries: true
                    }
                },
                timeEntries: {
                    include: {
                        task: {
                            include: {
                                list: {
                                    include: {
                                        document: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { date: 'desc' },
                    take: 20
                }
            },
        });

        if (!dbUser) {
            throw new NotFoundException("User not found");
        }

        const { password, ...safeUser } = dbUser;

        
        return {
            accessToken,
            userId: dbUser.id,
            username: dbUser.email,
            user: safeUser,
        }
    }

    async signup(dto: SignupDto) {
        const existingUser = await this.prismaService.user.findUnique({
            where: { email: dto.email }
        });
        if (existingUser) throw new ConflictException('Email already exists');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prismaService.user.create({
            data: {
                firstName: dto.firstName || '',
                lastName: dto.lastName || '',
                email: dto.email,
                password: hashedPassword,
                role: Role.JUNIOR,
                phone: dto.phone,
                position: dto.position,
                pricingPerHour: dto.pricingPerHour ? new Prisma.Decimal(dto.pricingPerHour) : null,
                isActive: true,
            },
            include: {
                department: true,
            },
        });

        const { password: _, ...safeUser } = user;

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            username: user.email,
        });

        // Send welcome email
        await this.mailerService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);

        // Notify admin users about new signup
        const adminUsers = await this.prismaService.user.findMany({
            where: {
                role: Role.ADMIN
            },
            select: { email: true }
        });

        if (adminUsers.length > 0) {
            const adminEmails = adminUsers.map(admin => admin.email);
            // await this.mailerService.sendNewSignupNotificationToAdmins(
            //     adminEmails,
            //     {
            //         name: `${user.firstName} ${user.lastName}`,
            //         email: user.email,
            //         signupDate: new Date().toLocaleDateString(),
            //         userId: user.id
            //     }
            // );
        }

        return {
            accessToken,
            userId: user.id,
            username: user.email,
            user: safeUser
        };
    }

    async sendPasswordResetLink(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email }
        });
        if (!user) throw new NotFoundException('User not found');

        const resetToken = await this.jwtService.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '1h' }
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await this.mailerService.sendResetPasswordMail(email, resetLink);

        return { message: 'Password reset link sent successfully' };
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await this.prismaService.user.update({
                where: { id: payload.sub },
                data: { password: hashedPassword },
            });

            return { message: 'Password reset successful' };
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }
    }

    async deleteUser(userId: string): Promise<{ message: string }> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            include: {
                // Check all relations that might prevent deletion
                createdDocuments: true,
                responsibleDocuments: true,
                issuedInvoices: true,
                uploadedFiles: true,
                generatedReports: true,
                notifications: true,
                // Task management relations
                managedDepartments: true,
                assignedTasks: true,
                timeEntries: true
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user has any related data that might prevent deletion
        if (user.createdDocuments.length > 0) {
            throw new ConflictException('Cannot delete user with created documents');
        }

        if (user.responsibleDocuments.length > 0) {
            throw new ConflictException('Cannot delete user with responsible documents');
        }

        if (user.managedDepartments.length > 0) {
            throw new ConflictException('Cannot delete user who manages departments');
        }

        if (user.assignedTasks.length > 0) {
            throw new ConflictException('Cannot delete user with assigned tasks');
        }

        // Use transaction to ensure all updates succeed or none do
        return await this.prismaService.$transaction(async (prisma) => {
            // Handle document relations
            await prisma.document.updateMany({
                where: { creatorId: userId },
                data: { creatorId: undefined }
            });

            await prisma.document.updateMany({
                where: { responsableId: userId },
                data: { responsableId: null }
            });

            // Handle invoice relations
            await prisma.invoice.updateMany({
                where: { issuedById: userId },
                data: { issuedById: null }
            });

            // Handle task relations
            await prisma.task.updateMany({
                where: { assigneeId: userId },
                data: { assigneeId: null }
            });

            // Handle time entries
            await prisma.timeEntry.updateMany({
                where: { collaboratorId: userId },
                data: { collaboratorId: undefined }
            });

            // Handle file relations
            await prisma.file.deleteMany({
                where: { uploadedById: userId }
            });
            

            // Handle report relations
            await prisma.report.updateMany({
                where: { generatedById: userId },
                data: { generatedById: null }
            });

            // Handle notification relations
            await prisma.notification.deleteMany({
                where: { userId: userId }
            });

            // Soft delete by setting isActive to false
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false }
            });

            return { message: 'User deactivated successfully' };
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await this.prismaService.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return { message: 'Password changed successfully' };
    }

    async getUserProfile(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            include: {
                department: true,
                // Core relations
                createdDocuments: {
                    include: {
                        client: true,
                        referent: true,
                        invoices: true,
                        reports: true,
                        lists: {
                            include: {
                                tasks: true
                            }
                        }
                    }
                },
                responsibleDocuments: {
                    include: {
                        client: true,
                        referent: true,
                        invoices: true
                    }
                },
                issuedInvoices: {
                    include: {
                        client: true,
                        document: true
                    }
                },
                uploadedFiles: true,
                generatedReports: {
                    include: {
                        document: true
                    }
                },
                notifications: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                // Task management relations
                managedDepartments: true,
                assignedTasks: {
                    include: {
                        list: {
                            include: {
                                document: true
                            }
                        },
                        timeEntries: {
                            include: {
                                collaborator: true
                            }
                        }
                    }
                },
                timeEntries: {
                    include: {
                        task: {
                            include: {
                                list: {
                                    include: {
                                        document: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { date: 'desc' },
                    take: 50
                }
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...safeUser } = user;
        return safeUser;
    }

    async updateUserProfile(userId: string, updateData: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        position?: string;
        departmentId?: string;
        pricingPerHour?: Prisma.Decimal;
    }) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                department: true,
                managedDepartments: true
            }
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async updateUserRole(userId: string, role: Role) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { role },
            include: {
                department: true,
                managedDepartments: true
            }
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async updateUserStatus(userId: string, isActive: boolean) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { isActive },
            include: {
                department: true
            }
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    // Additional methods for task management
    async getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            collaboratorId: userId
        };

        if (startDate && endDate) {
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        const timeEntries = await this.prismaService.timeEntry.findMany({
            where,
            include: {
                task: {
                    include: {
                        list: {
                            include: {
                                document: {
                                    include: {
                                        client: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return timeEntries;
    }

    async getUserRevenue(userId: string, startDate?: Date, endDate?: Date) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { pricingPerHour: true }
        });

        if (!user || !user.pricingPerHour) {
            return { totalHours: 0, totalRevenue: 0 };
        }

        const where: any = {
            collaboratorId: userId
        };

        if (startDate && endDate) {
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        const timeEntries = await this.prismaService.timeEntry.findMany({
            where,
            select: {
                hoursSpent: true
            }
        });

        const totalHours = timeEntries.reduce((sum, entry) => {
            return sum + Number(entry.hoursSpent);
        }, 0);

        const totalRevenue = totalHours * Number(user.pricingPerHour);

        return {
            totalHours,
            totalRevenue,
            hourlyRate: user.pricingPerHour
        };
    }
}