// // src/audit-log/audit-log.module.ts
// import { Module, Global } from '@nestjs/common';
// import { AuditLogController } from './audit-log.controller';
// import { AuditLogService } from './audit-log.service';
// import { PrismaService } from 'prisma/prisma.service';

// @Global()
// @Module({
//   controllers: [AuditLogController],
//   providers: [AuditLogService, PrismaService],
//   exports: [AuditLogService],
// })
// export class AuditLogModule {}