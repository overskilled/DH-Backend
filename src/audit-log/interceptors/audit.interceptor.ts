// src/audit-log/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogHelper } from '../audit-log.helper';
import { Reflector } from '@nestjs/core';
import { AUDIT_ACTION_KEY, AUDIT_ENTITY_KEY } from '../decorators/audit.decorator';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogHelper: AuditLogHelper,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    const entity = this.reflector.get<string>(AUDIT_ENTITY_KEY, context.getHandler());

    return next.handle().pipe(
      tap(async (data) => {
        if (user && action && entity && data) {
          try {
            // Journaliser automatiquement
            await this.auditLogHelper.log(
              action as AuditAction,
              entity as AuditEntity,
              data.id || data.data?.id || request.params?.id,
              data.title || data.name || data.reference || `Entity ${entity}`,
              user.id,
              {
                request,
                oldValues: request.body.oldValues,
                newValues: request.body.newValues || request.body,
              }
            );
          } catch (error) {
            console.error('Audit logging failed:', error);
          }
        }
      }),
    );
  }
}