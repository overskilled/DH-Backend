import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DashboardStatsService } from './dashboard-stats.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dashboard-stats')
@ApiBearerAuth()
@Controller('dashboard-stats')
@UseGuards(AuthGuard)
export class DashboardStatsController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get('department/:id')
  @ApiOperation({ summary: 'Get statistics for a specific department' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({ status: 200, description: 'Returns department statistics' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getDepartmentStats(@Param('id') id: string, @Request() req) {
    const user = req.user;
    
    // Vérifier si l'utilisateur a le droit de voir ces stats
    // Vous pouvez adapter ces permissions selon vos besoins
    const allowedRoles = ['ADMIN', 'ASSOCIATE', 'BOARD', 'SENIOR', 'MID', 'JUNIOR'];
    
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires');
    }
    
    return this.dashboardStatsService.getDepartmentStats(id);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns overview statistics' })
  async getDashboardOverview(@Request() req) {
    const user = req.user;
    
    // Seuls les rôles élevés peuvent voir l'overview
    const allowedRoles = ['ADMIN', 'ASSOCIATE', 'BOARD'];
    
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires');
    }
    
    return this.dashboardStatsService.getDashboardOverview();
  }
}