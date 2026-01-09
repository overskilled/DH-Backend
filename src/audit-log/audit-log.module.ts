// src/audit-log/audit-log.module.ts
import { Module } from '@nestjs/common'; // ENLÈVE @Global
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogHelper } from './audit-log.helper';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogHelper,
    AuditInterceptor,
    PrismaService,
  ],
  exports: [
    AuditLogService,
    AuditLogHelper,
    AuditInterceptor,
  ],
})
export class AuditLogModule {}