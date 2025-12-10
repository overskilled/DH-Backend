// src/audit-log/entities/audit-log.entity.ts
// Fichier TypeScript uniquement pour définir les enums, pas d'entité TypeORM

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  TIME_ENTRY_ADD = 'TIME_ENTRY_ADD',
  INVOICE_GENERATE = 'INVOICE_GENERATE',
  ASSIGN = 'ASSIGN',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}

export enum AuditEntity {
  DOCUMENT = 'DOCUMENT',
  TASK = 'TASK',
  LIST = 'LIST',
  TIME_ENTRY = 'TIME_ENTRY',
  INVOICE = 'INVOICE',
  USER = 'USER',
  CLIENT = 'CLIENT',
  DEPARTMENT = 'DEPARTMENT',
}

// Interface pour Typer les logs
export interface IAuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName: string;
  userId: string;
  user?: any;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: Date;
  isSensitive: boolean;
}