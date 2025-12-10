// // src/audit-log/audit-log.helper.ts
// import { Injectable } from '@nestjs/common';
// // import { AuditLogService } from './audit-log.service';
// import { AuditAction, AuditEntity } from './entities/audit-log.entity';

// @Injectable()
// export class AuditLogHelper {
//   constructor(private readonly auditLogService: AuditLogService) {}

//   async log(
//     action: AuditAction,
//     entity: AuditEntity,
//     entityId: string,
//     entityName: string,
//     userId: string,
//     options?: {
//       oldValues?: Record<string, any>;
//       newValues?: Record<string, any>;
//       description?: string;
//       request?: any;
//       isSensitive?: boolean;
//     },
//   ) {
//     try {
//       const logData = {
//         action,
//         entity,
//         entityId,
//         entityName,
//         userId,
//         oldValues: options?.oldValues,
//         newValues: options?.newValues,
//         description: options?.description,
//         ipAddress: options?.request?.ip 
//           || options?.request?.headers?.['x-forwarded-for']
//           || options?.request?.connection?.remoteAddress
//           || 'unknown',
//         userAgent: options?.request?.headers?.['user-agent'],
//         isSensitive: options?.isSensitive || false,
//       };

//       return await this.auditLogService.createLog(logData);
//     } catch (error) {
//       console.error('Erreur lors de la journalisation:', error);
//       return null;
//     }
//   }

//   // Méthodes spécifiques pour chaque type d'action
//   async logDocumentCreate(userId: string, documentId: string, documentTitle: string, request?: any) {
//     return this.log(
//       AuditAction.CREATE,
//       AuditEntity.DOCUMENT,
//       documentId,
//       documentTitle,
//       userId,
//       { description: 'Création de dossier', request },
//     );
//   }

//   async logDocumentUpdate(
//     userId: string,
//     documentId: string,
//     documentTitle: string,
//     oldValues: Record<string, any>,
//     newValues: Record<string, any>,
//     request?: any,
//   ) {
//     return this.log(
//       AuditAction.UPDATE,
//       AuditEntity.DOCUMENT,
//       documentId,
//       documentTitle,
//       userId,
//       {
//         oldValues,
//         newValues,
//         description: 'Modification de dossier',
//         request,
//       },
//     );
//   }

//   async logTaskStatusChange(
//     userId: string,
//     taskId: string,
//     taskTitle: string,
//     oldStatus: string,
//     newStatus: string,
//     request?: any,
//   ) {
//     return this.log(
//       AuditAction.STATUS_CHANGE,
//       AuditEntity.TASK,
//       taskId,
//       taskTitle,
//       userId,
//       {
//         oldValues: { status: oldStatus },
//         newValues: { status: newStatus },
//         description: `Changement de statut: ${oldStatus} → ${newStatus}`,
//         request,
//       },
//     );
//   }

//   async logTimeEntryAdd(
//     userId: string,
//     timeEntryId: string,
//     taskTitle: string,
//     duration: number,
//     request?: any,
//   ) {
//     return this.log(
//       AuditAction.TIME_ENTRY_ADD,
//       AuditEntity.TIME_ENTRY,
//       timeEntryId,
//       taskTitle,
//       userId,
//       {
//         newValues: { duration },
//         description: `Ajout de ${duration}h`,
//         request,
//       },
//     );
//   }

//   async logInvoiceGenerate(
//     userId: string,
//     invoiceId: string,
//     invoiceReference: string,
//     amount: number,
//     request?: any,
//   ) {
//     return this.log(
//       AuditAction.INVOICE_GENERATE,
//       AuditEntity.INVOICE,
//       invoiceId,
//       invoiceReference,
//       userId,
//       {
//         newValues: { amount },
//         description: `Génération facture: ${amount} FCFA`,
//         request,
//       },
//     );
//   }
// }