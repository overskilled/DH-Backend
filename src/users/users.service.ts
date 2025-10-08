// src/users/users.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SignupDto } from 'src/dto/signup.dto';
import { Role, TaskStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PaginatedResponse, PaginationDto } from 'src/dto/pagination.dto';
import { MailerService } from 'src/mailer/mailer.service';

interface CreateUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: Role;
    departmentId?: string;
    pricingPerHour?: number;
}
 

interface UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
    departmentId?: string;
    pricingPerHour?: number;
}

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService
    ) { }

    // =====================
    // USER MANAGEMENT
    // =====================

    async createUserAccount(dto: CreateUserDto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });
        if (existingUser) throw new ConflictException('Email already exists');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user with fields from schema - name is required
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role || Role.JUNIOR,
                departmentId: dto.departmentId,
                pricingPerHour: dto.pricingPerHour,
                password: hashedPassword,
            },
            include: {
                department: true,
                managedDepartments: true,
                assignedTasks: true
            },
        });


        const { password, ...safeUser } = user;

        // Send welcome email - provide all required arguments
        await this.mailerService.sendUserCreationMail(
            user.email, 
            `${process.env.FRONTEND_URL}/reset-password`,
            user.firstName
        );

        return {
            message: 'User created successfully and welcome email sent',
            user: safeUser
        };
    }

    async createUser(dto: CreateUserDto) {
        return this.createUserAccount(dto);
    }

    async getUsers(
        pagination: PaginationDto = { page: 1, limit: 10 }, 
        departmentId?: string, 
        role?: Role
    ) {
        const page = Number(pagination.page) || 1;
        const limit = Number(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (role) where.role = role;
        if (departmentId) where.departmentId = departmentId;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    department: true,
                    managedDepartments: true,
                    assignedTasks: {
                        where: {
                            status: {
                                in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
                            }
                        }
                    },
                    _count: {
                        select: {
                            timeEntries: true,
                            assignedTasks: true,
                            createdDocuments: true,
                            responsibleDocuments: true
                        }
                    }
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        // Strip password hashes safely
        const safeUsers = users.map(({ password, ...rest }) => rest);

        return new PaginatedResponse(safeUsers, total, pagination);
    }

    async getUserById(id: string) {
        console.log("Fetching user by ID:", id);

        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                department: true,
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
                createdDocuments: {
                    include: {
                        department: true,
                        referent: true,
                        lists: {
                            include: {
                                tasks: true
                            }
                        }
                    }
                },
                responsibleDocuments: {
                    include: {
                        department: true,
                        referent: true,
                        lists: {
                            include: {
                                tasks: true
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
                        },
                        invoice: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: {
                        createdDocuments: true,
                        responsibleDocuments: true,
                        timeEntries: true,
                        assignedTasks: true,
                        managedDepartments: true
                    }
                }
            },
        });

        if (!user) throw new NotFoundException("User not found");

        const { password, ...safeUser } = user;
        return safeUser;
    }

    async getUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                department: true,
                managedDepartments: true,
                assignedTasks: true
            },
        });

        if (!user) throw new NotFoundException("User not found");

        const { password, ...safeUser } = user;
        return safeUser;
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        console.log('=== UPDATE USER STARTED ===');
        console.log('User ID:', id);
        console.log('Received DTO keys:', Object.keys(dto));

        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            console.log('❌ User not found');
            throw new NotFoundException('User not found');
        }

        console.log('✅ Current user found:', { 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName 
        });

        // Prepare update data
        const updateData: Prisma.UserUpdateInput = {};

        if (dto.email !== undefined && dto.email !== user.email) {
            // Check if new email is already taken
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email }
            });
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('Email already exists');
            }
            updateData.email = dto.email;
            console.log('📝 Email will be updated');
        }

        if (dto.firstName !== undefined && dto.firstName !== user.firstName) {
            updateData.firstName = dto.firstName;
            console.log('📝 First name will be updated');
        }
        
        if (dto.lastName !== undefined && dto.lastName !== user.lastName) {
            updateData.lastName = dto.lastName;
            console.log('📝 Last name will be updated');
        }

        if (dto.role !== undefined && dto.role !== user.role) {
            updateData.role = dto.role;
            console.log('📝 Role will be updated:', dto.role);
        }

        if (dto.departmentId !== undefined && dto.departmentId !== user.departmentId) {
            // Verify department exists if provided
            if (dto.departmentId) {
                const department = await this.prisma.department.findUnique({
                    where: { id: dto.departmentId }
                });
                if (!department) {
                    throw new NotFoundException('Department not found');
                }
            }
            // Use department connect/disconnect instead of departmentId
            if (dto.departmentId) {
                updateData.department = { connect: { id: dto.departmentId } };
            } else {
                updateData.department = { disconnect: true };
            }
            console.log('📝 Department will be updated');
        }

        if (dto.pricingPerHour !== undefined) {
            // Convert to Decimal for comparison
            const currentPricing = user.pricingPerHour ? Number(user.pricingPerHour) : null;
            const newPricing = dto.pricingPerHour;
            
            if (currentPricing !== newPricing) {
                updateData.pricingPerHour = newPricing;
                console.log('📝 Pricing per hour will be updated:', newPricing);
            }
        }

        if (Object.keys(updateData).length === 0) {
            console.log('ℹ️ No fields to update');
            return this.getUserById(id);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                department: true,
                managedDepartments: true,
                assignedTasks: {
                    where: {
                        status: {
                            in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
                        }
                    }
                },
                _count: {
                    select: {
                        createdDocuments: true,
                        responsibleDocuments: true,
                        timeEntries: true,
                        assignedTasks: true
                    }
                }
            },
        });

        console.log('=== UPDATE USER COMPLETED ===');

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async updateUserRole(userId: string, role: Role) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { role },
            include: {
                department: true,
                managedDepartments: true
            },
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async updateUserDepartment(userId: string, departmentId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        // Verify department exists
        const department = await this.prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) throw new NotFoundException('Department not found');

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                department: { connect: { id: departmentId } }
            },
            include: {
                department: true,
                managedDepartments: true
            },
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async updateUserPricing(userId: string, pricingPerHour: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { pricingPerHour },
            include: {
                department: true
            },
        });

        const { password, ...safeUser } = updatedUser;
        return safeUser;
    }

    async addDepartmentManager(userId: string, departmentId: string) {
        const [user, department] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.department.findUnique({ where: { id: departmentId } })
        ]);

        if (!user) throw new NotFoundException('User not found');
        if (!department) throw new NotFoundException('Department not found');

        // Add user to department managers (many-to-many relation)
        const updatedDepartment = await this.prisma.department.update({
            where: { id: departmentId },
            data: {
                managers: {
                    connect: { id: userId }
                }
            },
            include: {
                managers: true,
                users: true
            }
        });

        return updatedDepartment;
    }

    async removeDepartmentManager(userId: string, departmentId: string) {
        const [user, department] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.department.findUnique({ where: { id: departmentId } })
        ]);

        if (!user) throw new NotFoundException('User not found');
        if (!department) throw new NotFoundException('Department not found');

        // Remove user from department managers
        const updatedDepartment = await this.prisma.department.update({
            where: { id: departmentId },
            data: {
                managers: {
                    disconnect: { id: userId }
                }
            },
            include: {
                managers: true,
                users: true
            }
        });

        return updatedDepartment;
    }

    async deleteUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        createdDocuments: true,
                        responsibleDocuments: true,
                        timeEntries: true,
                        managedDepartments: true,
                        assignedTasks: true
                    }
                }
            }
        });

        if (!user) throw new NotFoundException('User not found');

        // Check if user has any related data that might prevent deletion
        if (user._count.createdDocuments > 0 || user._count.responsibleDocuments > 0) {
            throw new BadRequestException('Cannot delete user with assigned documents');
        }

        if (user._count.timeEntries > 0) {
            throw new BadRequestException('Cannot delete user with time entries');
        }

        if (user._count.managedDepartments > 0) {
            throw new BadRequestException('Cannot delete user who manages departments');
        }

        if (user._count.assignedTasks > 0) {
            throw new BadRequestException('Cannot delete user with assigned tasks');
        }

        // Handle referent relations in document
        await this.prisma.document.updateMany({
            where: { referentId: id },
            data: { referentId: null }
        });

        // Delete the user
        await this.prisma.user.delete({
            where: { id }
        });

        return { message: 'User deleted successfully' };
    }

    async getUserStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        const [
            documentCount,
            timeEntryCount,
            totalHours,
            activeTasks
        ] = await Promise.all([
            this.prisma.document.count({
                where: { 
                    OR: [
                        { referentId: userId },
                        { responsableId: userId },
                        { creatorId: userId }
                    ]
                }
            }),
            this.prisma.timeEntry.count({
                where: { collaboratorId: userId }
            }),
            this.prisma.timeEntry.aggregate({
                where: { collaboratorId: userId },
                _sum: { hoursSpent: true }
            }),
            this.prisma.task.count({
                where: {
                    assigneeId: userId,
                    status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] }
                }
            })
        ]);

        const totalHoursWorked = totalHours._sum.hoursSpent || 0;

        return {
            documentCount,
            timeEntryCount,
            totalHoursWorked: Number(totalHoursWorked),
            activeTasks
        };
    }

    async getUserTimeEntries(userId: string, pagination: PaginationDto = { page: 1, limit: 10 }) {
        const page = Number(pagination.page) || 1;
        const limit = Number(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const [timeEntries, total] = await Promise.all([
            this.prisma.timeEntry.findMany({
                where: { collaboratorId: userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    task: {
                        include: {
                            list: {
                                include: {
                                    document: true
                                }
                            }
                        }
                    },
                    invoice: true
                },
            }),
            this.prisma.timeEntry.count({ where: { collaboratorId: userId } }),
        ]);

        return new PaginatedResponse(timeEntries, total, pagination);
    }

    async getUserAssignedTasks(userId: string, pagination: PaginationDto = { page: 1, limit: 10 }) {
        const page = Number(pagination.page) || 1;
        const limit = Number(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where: { assigneeId: userId },
                skip,
                take: limit,
                orderBy: { dueDate: 'asc' },
                include: {
                    list: {
                        include: {
                            document: true
                        }
                    },
                    timeEntries: true
                },
            }),
            this.prisma.task.count({ where: { assigneeId: userId } }),
        ]);

        return new PaginatedResponse(tasks, total, pagination);
    }

    async searchUsers(query: string, pagination: PaginationDto = { page: 1, limit: 10 }) {
        const page = Number(pagination.page) || 1;
        const limit = Number(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Use proper Prisma types for the where clause
        const where: Prisma.UserWhereInput = {
            OR: [
                { email: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
                { firstName: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
                { lastName: { contains: query, mode: 'insensitive' as Prisma.QueryMode } }
            ]
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { firstName: 'asc' },
                include: {
                    department: true,
                    managedDepartments: true
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        const safeUsers = users.map(({ password, ...rest }) => rest);
        return new PaginatedResponse(safeUsers, total, pagination);
    }
}