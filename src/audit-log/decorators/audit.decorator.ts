// src/audit-log/decorators/audit.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_ENTITY_KEY = 'audit_entity';

export const Audit = (action: string, entity: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUDIT_ACTION_KEY, action)(target, propertyKey, descriptor);
    SetMetadata(AUDIT_ENTITY_KEY, entity)(target, propertyKey, descriptor);
  };
};