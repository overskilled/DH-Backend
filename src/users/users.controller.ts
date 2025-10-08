import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Patch,
  ForbiddenException,
  Req,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from 'src/dto/signup.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PaginationDto } from 'src/dto/pagination.dto';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from 'src/auth/auth.service';

@ApiTags('Users')
@ApiBearerAuth()
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token for authentication',
  required: true,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Unauthorized - Invalid or missing token',
})
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // Helper method to check admin/board permissions
  private isAdminOrBoard(role: Role): boolean {
    return role === Role.ADMIN || role === Role.BOARD;
  }

  // =====================
  // GET ENDPOINTS
  // =====================

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users with optional filtering by department and role. Admin/Board access required for full user data.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter users by department ID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filter users by role',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'user-123',
            email: 'user@example.com',
            name: 'John Doe',
            role: Role.JUNIOR,
            departmentId: 'dept-123',
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
  })
  async findAll(
    @Query() pagination: PaginationDto = { page: 1, limit: 10 },
    @Query('departmentId') departmentId?: string,
    @Query('role') role?: Role,
  ) {
    return this.usersService.getUsers(pagination, departmentId, role);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'user-12345',
    type: String,
  })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.SENIOR,
        departmentId: 'dept-123',
        pricingPerHour: 50.0,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the currently authenticated user',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.SENIOR,
        departmentId: 'dept-123',
        pricingPerHour: 50.0,
        phone: '+237 6XX XXX XXX',
        title: 'Senior Software Engineer',
        bio: 'Experienced developer with 5+ years',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
    },
  })
  async profile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getUserById(req.user.userId);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve statistics and metrics for a specific user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'user-12345',
    type: String,
  })
  @ApiOkResponse({
    description: 'User statistics retrieved successfully',
    schema: {
      example: {
        totalTasks: 15,
        completedTasks: 12,
        pendingTasks: 3,
        totalHours: 120.5,
        averageRating: 4.5,
        currentProjects: 3,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get(':id/time-entries')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user time entries',
    description: 'Retrieve time entries for a specific user with pagination',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'user-12345',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'Time entries retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'time-123',
            taskId: 'task-123',
            hours: 4.5,
            date: '2023-01-01',
            description: 'Development work',
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 45,
          totalPages: 5,
        },
      },
    },
  })
  async getUserTimeEntries(
    @Param('id') id: string,
    @Query() pagination: PaginationDto = { page: 1, limit: 10 }
  ) {
    return this.usersService.getUserTimeEntries(id, pagination);
  }

  @Get(':id/assigned-tasks')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user assigned tasks',
    description: 'Retrieve tasks assigned to a specific user with pagination',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'user-12345',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'Assigned tasks retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'task-123',
            title: 'Implement authentication',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: '2023-12-31',
            project: 'Project Alpha',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      },
    },
  })
  async getUserAssignedTasks(
    @Param('id') id: string,
    @Query() pagination: PaginationDto = { page: 1, limit: 10 }
  ) {
    return this.usersService.getUserAssignedTasks(id, pagination);
  }

  @Get('search/:query')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Search users',
    description: 'Search users by name, email, or other criteria with pagination',
  })
  @ApiParam({
    name: 'query',
    description: 'Search query string',
    example: 'john',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'Users search results retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            role: Role.SENIOR,
            department: 'Engineering',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
        },
      },
    },
  })
  async searchUsers(
    @Param('query') query: string,
    @Query() pagination: PaginationDto = { page: 1, limit: 10 }
  ) {
    return this.usersService.searchUsers(query, pagination);
  }

  // =====================
  // POST ENDPOINTS
  // =====================

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account. Requires admin or board member privileges.',
  })
  @ApiBody({
    type: SignupDto,
    description: 'User creation data',
    examples: {
      minimal: {
        summary: 'Minimal data',
        value: {
          email: 'user@example.com',
          name: 'John Doe',
          password: 'securePassword123',
        },
      },
      full: {
        summary: 'Full data',
        value: {
          email: 'senior.dev@example.com',
          name: 'Jane Smith',
          password: 'securePassword123',
          role: Role.SENIOR,
          departmentId: 'dept-12345',
          pricingPerHour: 75.0,
          phone: '+237 6XX XXX XXX',
          title: 'Senior Software Engineer',
          bio: 'Experienced full-stack developer',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    schema: {
      example: {
        id: 'user-12345',
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.JUNIOR,
        departmentId: 'dept-12345',
        createdAt: '2023-01-01T00:00:00.000Z',
        message: 'User created successfully',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiConflictResponse({
    description: 'Conflict - Email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data',
  })
  async create(
    @Body() createUserDto: SignupDto,
    @Req() req: AuthenticatedRequest
  ) {
    // Check if user has admin privileges
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can create users');
    }
    
    // Convert SignupDto to CreateUserDto with required name
    const createUserData = {
      email: createUserDto.email,
      firstName: createUserDto.firstName || 'New User',
      lastName: createUserDto.lastName || 'New User',
      password: createUserDto.password,
      role: createUserDto.role || Role.JUNIOR,
      departmentId: createUserDto.departmentId,
      pricingPerHour: createUserDto.pricingPerHour,
    };
    
    return this.usersService.createUser(createUserData);
  }

  @Post(':id/manage-departments')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Add user as department manager',
    description: 'Assign a user as manager of a specific department. Requires admin or board member privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to assign as manager',
    example: 'user-12345',
    type: String,
  })
  @ApiBody({
    description: 'Department assignment data',
    schema: {
      type: 'object',
      properties: {
        departmentId: {
          type: 'string',
          example: 'dept-12345',
          description: 'ID of the department to manage',
        },
      },
      required: ['departmentId'],
    },
  })
  @ApiOkResponse({
    description: 'User added as department manager successfully',
    schema: {
      example: {
        success: true,
        message: 'User assigned as department manager',
        data: {
          userId: 'user-12345',
          departmentId: 'dept-12345',
          role: 'MANAGER',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiNotFoundResponse({
    description: 'User or department not found',
  })
  async addDepartmentManager(
    @Param('id') userId: string,
    @Body() body: { departmentId: string },
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can assign department managers');
    }

    return this.usersService.addDepartmentManager(userId, body.departmentId);
  }

  // =====================
  // PUT/PATCH ENDPOINTS
  // =====================

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user details. Users can update their own information, admins can update any user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update',
    example: 'user-12345',
    type: String,
  })
  @ApiBody({
    description: 'User update data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Smith',
          description: 'Updated user name',
        },
        email: {
          type: 'string',
          example: 'john.smith@example.com',
          description: 'Updated email address',
        },
        departmentId: {
          type: 'string',
          example: 'dept-12345',
          description: 'Updated department ID',
        },
        pricingPerHour: {
          type: 'number',
          example: 65.0,
          description: 'Updated pricing per hour',
        },
        role: {
          type: 'string',
          enum: Role as any,
          example: Role.SENIOR,
          description: 'Updated user role (admin only)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      example: {
        id: 'user-12345',
        email: 'updated@example.com',
        name: 'Updated Name',
        role: Role.SENIOR,
        departmentId: 'dept-12345',
        pricingPerHour: 65.0,
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Cannot update other users without admin privileges',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: {
      name?: string;
      email?: string;
      departmentId?: string;
      pricingPerHour?: number;
      role?: Role;
    }
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update user role',
    description: 'Update user role. Requires admin or board member privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update role',
    example: 'user-12345',
    type: String,
  })
  @ApiBody({
    description: 'Role update data',
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: Role as any,
          example: Role.SENIOR,
          description: 'New user role',
        },
      },
      required: ['role'],
    },
  })
  @ApiOkResponse({
    description: 'User role updated successfully',
    schema: {
      example: {
        id: 'user-12345',
        role: Role.SENIOR,
        updatedAt: '2023-01-01T00:00:00.000Z',
        message: 'User role updated successfully',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async updateRole(
    @Param('id') userId: string, 
    @Body() body: { role: Role },
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    return this.usersService.updateUserRole(userId, body.role);
  }

  @Patch(':id/department')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update user department',
    description: 'Update user department assignment. Requires admin or board member privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update department',
    example: 'user-12345',
    type: String,
  })
  @ApiBody({
    description: 'Department update data',
    schema: {
      type: 'object',
      properties: {
        departmentId: {
          type: 'string',
          example: 'dept-12345',
          description: 'New department ID',
        },
      },
      required: ['departmentId'],
    },
  })
  @ApiOkResponse({
    description: 'User department updated successfully',
    schema: {
      example: {
        id: 'user-12345',
        departmentId: 'dept-12345',
        updatedAt: '2023-01-01T00:00:00.000Z',
        message: 'User department updated successfully',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiNotFoundResponse({
    description: 'User or department not found',
  })
  async updateDepartment(
    @Param('id') userId: string,
    @Body() body: { departmentId: string },
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can update user departments');
    }

    return this.usersService.updateUserDepartment(userId, body.departmentId);
  }

  @Patch(':id/pricing')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update user pricing per hour',
    description: 'Update user pricing per hour. Users can update their own pricing, admins can update any user pricing.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update pricing',
    example: 'user-12345',
    type: String,
  })
  @ApiBody({
    description: 'Pricing update data',
    schema: {
      type: 'object',
      properties: {
        pricingPerHour: {
          type: 'number',
          example: 75.5,
          description: 'New pricing per hour',
          minimum: 0,
        },
      },
      required: ['pricingPerHour'],
    },
  })
  @ApiOkResponse({
    description: 'User pricing updated successfully',
    schema: {
      example: {
        id: 'user-12345',
        pricingPerHour: 75.5,
        updatedAt: '2023-01-01T00:00:00.000Z',
        message: 'Pricing updated successfully',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Cannot update other users pricing without admin privileges',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async updatePricing(
    @Param('id') userId: string,
    @Body() body: { pricingPerHour: number },
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (userId !== req.user.userId && !this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('You can only update your own pricing');
    }

    return this.usersService.updateUserPricing(userId, body.pricingPerHour);
  }

  // =====================
  // DELETE ENDPOINTS
  // =====================

  @Delete(':id/manage-departments/:departmentId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Remove user as department manager',
    description: 'Remove a user as manager of a specific department. Requires admin or board member privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to remove as manager',
    example: 'user-12345',
    type: String,
  })
  @ApiParam({
    name: 'departmentId',
    description: 'Department ID to remove management from',
    example: 'dept-12345',
    type: String,
  })
  @ApiOkResponse({
    description: 'User removed as department manager successfully',
    schema: {
      example: {
        success: true,
        message: 'User removed as department manager',
        data: {
          userId: 'user-12345',
          departmentId: 'dept-12345',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiNotFoundResponse({
    description: 'User or department not found',
  })
  async removeDepartmentManager(
    @Param('id') userId: string,
    @Param('departmentId') departmentId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can remove department managers');
    }

    return this.usersService.removeDepartmentManager(userId, departmentId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently delete a user account. Requires admin or board member privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to delete',
    example: 'user-12345',
    type: String,
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
        data: {
          id: 'user-12345',
          email: 'deleted@example.com',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiConflictResponse({
    description: 'Conflict - User has related data that prevents deletion',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const currentUser = await this.usersService.getUserById(req.user.userId);
    if (!this.isAdminOrBoard(currentUser.role)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    return this.usersService.deleteUser(id);
  }

  // =====================
  // ADDITIONAL ENDPOINTS
  // =====================

  @Get('email/:email')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user by email',
    description: 'Retrieve user information by email address',
  })
  @ApiParam({
    name: 'email',
    description: 'User email address',
    example: 'user@example.com',
    type: String,
  })
  @ApiOkResponse({
    description: 'User found by email',
    schema: {
      example: {
        id: 'user-12345',
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.SENIOR,
        departmentId: 'dept-12345',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found with the provided email',
  })
  async findByEmail(@Param('email') email: string) {
    return this.usersService.getUserByEmail(email);
  }
}