// // src/audit-log/audit-log.controller.ts
// import {
//   Controller,
//   Get,
//   Query,
//   UseGuards,
//   Req,
//   Post,
//   Body,
//   Param,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiBearerAuth,
//   ApiQuery,
//   ApiResponse,
// } from '@nestjs/swagger';
// import { AuthGuard } from 'src/auth/guards/auth.guard';
// // import { AuditLogService } from './audit-log.service';
// import { SearchAuditLogDto } from './dto/search-audit-log.dto';
// import { AuditEntity, AuditAction } from './entities/audit-log.entity';

// @ApiTags('audit-logs')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard)
// @Controller('audit-logs')
// export class AuditLogController {
//   constructor(private readonly auditLogService: AuditLogService) {}

//   @Get()
//   @ApiOperation({
//     summary: 'Rechercher les logs d\'audit',
//     description: 'Filtrer et paginer les logs d\'audit. Access: ADMIN uniquement.'
//   })
//   @ApiResponse({ status: 200, description: 'Liste des logs d\'audit' })
//   async searchLogs(@Query() searchDto: SearchAuditLogDto) {
//     return await this.auditLogService.searchLogs(searchDto);
//   }

//   @Get('recent')
//   @ApiOperation({
//     summary: 'Obtenir les activités récentes',
//     description: 'Obtenir les 50 dernières activités. Access: ADMIN et BOARD.'
//   })
//   @ApiQuery({ name: 'userId', required: false })
//   async getRecentActivity(@Query('userId') userId?: string) {
//     return await this.auditLogService.getRecentActivity(userId);
//   }

//   @Get('entity/:entity/:entityId')
//   @ApiOperation({
//     summary: 'Obtenir les logs d\'une entité spécifique',
//     description: 'Obtenir tous les logs pour une entité spécifique.'
//   })
//   async getLogsByEntity(
//     @Param('entity') entity: AuditEntity,
//     @Param('entityId') entityId: string,
//   ) {
//     return await this.auditLogService.getLogsByEntity(entity, entityId);
//   }

//   @Get('stats')
//   @ApiOperation({
//     summary: 'Obtenir les statistiques d\'audit',
//     description: 'Statistiques par action, entité et utilisateur.'
//   })
//   @ApiQuery({ name: 'startDate', required: false })
//   @ApiQuery({ name: 'endDate', required: false })
//   async getStats(
//     @Query('startDate') startDate?: string,
//     @Query('endDate') endDate?: string,
//   ) {
//     return await this.auditLogService.getStats(
//       startDate ? new Date(startDate) : undefined,
//       endDate ? new Date(endDate) : undefined,
//     );
//   }

//   @Get('actions')
//   @ApiOperation({
//     summary: 'Obtenir la liste des actions d\'audit',
//     description: 'Liste de toutes les actions possibles.'
//   })
//   getActions() {
//     return Object.values(AuditAction);
//   }

//   @Get('entities')
//   @ApiOperation({
//     summary: 'Obtenir la liste des entités auditées',
//     description: 'Liste de toutes les entités qui peuvent être auditées.'
//   })
//   getEntities() {
//     return Object.values(AuditEntity);
//   }
// }