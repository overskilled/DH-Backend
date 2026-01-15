// src/audit-log/audit-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditAction, AuditEntity } from './entities/audit-log.entity';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async createLog(data: {
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    entityName: string;
    userId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    isSensitive?: boolean;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        entityName: data.entityName,
        userId: data.userId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        isSensitive: data.isSensitive || false,
      },
    });
  }

  async searchLogs(searchDto: SearchAuditLogDto) {
    try {
      this.logger.log(`Recherche logs avec DTO: ${JSON.stringify(searchDto)}`);

      // Extraire les paramètres avec valeurs par défaut
      const page = searchDto.page ? Number(searchDto.page) : 1;
      const limit = searchDto.limit ? Number(searchDto.limit) : 20;
      const skip = (page - 1) * limit;

      // Construction de la clause WHERE de manière sécurisée
      const where: any = { isSensitive: false };

      // Filtre action
      if (searchDto.action && searchDto.action.trim() !== '') {
        where.action = searchDto.action;
      }

      // Filtre entity
      if (searchDto.entity && searchDto.entity.trim() !== '') {
        where.entity = searchDto.entity;
      }

      // Filtre entityId
      if (searchDto.entityId && searchDto.entityId.trim() !== '') {
        where.entityId = searchDto.entityId;
      }

      // Filtre userId
      if (searchDto.userId && searchDto.userId.trim() !== '') {
        where.userId = searchDto.userId;
      }

      // Filtres de date
      if (searchDto.startDate) {
        const startDate = new Date(searchDto.startDate);
        if (!isNaN(startDate.getTime())) {
          where.createdAt = {
            ...where.createdAt,
            gte: startDate,
          };
        }
      }

      if (searchDto.endDate) {
        const endDate = new Date(searchDto.endDate);
        if (!isNaN(endDate.getTime())) {
          where.createdAt = {
            ...where.createdAt,
            lte: endDate,
          };
        }
      }

      this.logger.log(`Clause WHERE construite: ${JSON.stringify(where)}`);

      // Requête principale avec gestion d'erreur
      const [data, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }).catch(err => {
          this.logger.error(`Erreur findMany: ${err.message}`);
          return [];
        }),
        this.prisma.auditLog.count({ where }).catch(err => {
          this.logger.error(`Erreur count: ${err.message}`);
          return 0;
        }),
      ]);

      this.logger.log(`Résultats: ${data.length} logs, total: ${total}`);

      return {
        data: data || [],
        meta: {
          total: total || 0,
          page,
          limit,
          totalPages: Math.ceil((total || 0) / limit),
        },
      };

    } catch (error) {
      this.logger.error(`Erreur fatale dans searchLogs: ${error.message}`);
      this.logger.error(error.stack);
      
      // Retourner une réponse vide mais valide pour éviter l'erreur 500
      return {
        data: [],
        meta: {
          total: 0,
          page: searchDto.page ? Number(searchDto.page) : 1,
          limit: searchDto.limit ? Number(searchDto.limit) : 20,
          totalPages: 0,
        },
      };
    }
  }

  // Méthode alternative simple sans filtres (pour le frontend)
  async getAllLogsSimple(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where: { isSensitive: false },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.auditLog.count({ where: { isSensitive: false } }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Erreur dans getAllLogsSimple: ${error.message}`);
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }

  async getLogsByEntity(entity: AuditEntity, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { 
        entity: entity,
        entityId: entityId,
        isSensitive: false 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentActivity(userId?: string) {
    const where: any = { isSensitive: false };
    
    if (userId) {
      where.userId = userId;
    }
    
    return this.prisma.auditLog.findMany({
      where,
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const where: any = { isSensitive: false };
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.createdAt = {
        gte: startDate,
      };
    } else if (endDate) {
      where.createdAt = {
        lte: endDate,
      };
    }

    const total = await this.prisma.auditLog.count({ where });

    // Stats par action
    const byAction = await this.prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        _all: true,
      },
      where,
    });

    // Stats par entité
    const byEntity = await this.prisma.auditLog.groupBy({
      by: ['entity'],
      _count: {
        _all: true,
      },
      where,
    });

    // Stats par utilisateur
    const byUser = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      _count: {
        _all: true,
      },
      where,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    return {
      total,
      byAction,
      byEntity,
      byUser,
    };
  }

  async cleanupOldLogs(cutoffDate: Date) {
  const result = await this.prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      },
      isSensitive: false // Ne pas supprimer les logs sensibles
    }
  });
  
  return {
    deleted: result.count,
    cutoffDate
  };
}
}