// // src/audit-log/audit-log.service.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import { AuditAction, AuditEntity } from './entities/audit-log.entity';
// import { SearchAuditLogDto } from './dto/search-audit-log.dto';

// @Injectable()
// export class AuditLogService {
//   constructor(private prisma: PrismaService) {}

//   async createLog(data: {
//     action: AuditAction;
//     entity: AuditEntity;
//     entityId: string;
//     entityName: string;
//     userId: string;
//     oldValues?: Record<string, any>;
//     newValues?: Record<string, any>;
//     description?: string;
//     ipAddress?: string;
//     userAgent?: string;
//     isSensitive?: boolean;
//   }) {
//     return this.prisma.auditLog.create({
//       data: {
//         action: data.action,
//         entity: data.entity,
//         entityId: data.entityId,
//         entityName: data.entityName,
//         userId: data.userId,
//         oldValues: data.oldValues,
//         newValues: data.newValues,
//         ipAddress: data.ipAddress,
//         userAgent: data.userAgent,
//         description: data.description,
//         isSensitive: data.isSensitive || false,
//       },
//     });
//   }

//   async searchLogs(searchDto: SearchAuditLogDto) {
//     const { page = 1, limit = 20, ...filters } = searchDto;
//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (filters.action) {
//       where.action = filters.action;
//     }
//     if (filters.entity) {
//       where.entity = filters.entity;
//     }
//     if (filters.entityId) {
//       where.entityId = filters.entityId;
//     }
//     if (filters.userId) {
//       where.userId = filters.userId;
//     }
//     if (filters.startDate && filters.endDate) {
//       where.createdAt = {
//         gte: new Date(filters.startDate),
//         lte: new Date(filters.endDate),
//       };
//     } else if (filters.startDate) {
//       where.createdAt = {
//         gte: new Date(filters.startDate),
//       };
//     } else if (filters.endDate) {
//       where.createdAt = {
//         lte: new Date(filters.endDate),
//       };
//     }

//     // Exclure les logs sensibles des recherches non-admin
//     where.isSensitive = false;

//     const [data, total] = await Promise.all([
//       this.prisma.auditLog.findMany({
//         where,
//         skip,
//         take: limit,
//         include: {
//           user: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//       }),
//       this.prisma.auditLog.count({ where }),
//     ]);

//     return {
//       data,
//       meta: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   async getLogsByEntity(entity: AuditEntity, entityId: string) {
//     return this.prisma.auditLog.findMany({
//       where: { 
//         entity: entity,
//         entityId: entityId,
//         isSensitive: false 
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async getRecentActivity(userId?: string) {
//     const where: any = { isSensitive: false };
    
//     if (userId) {
//       where.userId = userId;
//     }
    
//     return this.prisma.auditLog.findMany({
//       where,
//       take: 50,
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async getStats(startDate?: Date, endDate?: Date) {
//     const where: any = { isSensitive: false };
    
//     if (startDate && endDate) {
//       where.createdAt = {
//         gte: startDate,
//         lte: endDate,
//       };
//     } else if (startDate) {
//       where.createdAt = {
//         gte: startDate,
//       };
//     } else if (endDate) {
//       where.createdAt = {
//         lte: endDate,
//       };
//     }

//     const total = await this.prisma.auditLog.count({ where });

//     // Stats par action
//     const byAction = await this.prisma.auditLog.groupBy({
//       by: ['action'],
//       _count: {
//         _all: true,
//       },
//       where,
//     });

//     // Stats par entité
//     const byEntity = await this.prisma.auditLog.groupBy({
//       by: ['entity'],
//       _count: {
//         _all: true,
//       },
//       where,
//     });

//     // Stats par utilisateur
//     const byUser = await this.prisma.auditLog.groupBy({
//       by: ['userId'],
//       _count: {
//         _all: true,
//       },
//       where,
//       orderBy: {
//         _count: {
//           userId: 'desc',
//         },
//       },
//       take: 10,
//     });

//     return {
//       total,
//       byAction,
//       byEntity,
//       byUser,
//     };
//   }
// }