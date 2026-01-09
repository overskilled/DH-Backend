// // src/tasks/dto/transfer-task.dto.ts
// import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export enum TransferReason {
//   REVIEW = 'REVIEW',
//   TAKE_OVER = 'TAKE_OVER',
//   OVERLOAD = 'OVERLOAD',
//   OTHER = 'OTHER',
// }

// export class TransferTaskDto {
//   @ApiProperty({
//     description: 'ID du nouveau collaborateur assigné',
//     example: '123e4567-e89b-12d3-a456-426614174000',
//   })
//   @IsString()
//   newAssigneeId: string;

//   @ApiProperty({
//     description: 'Raison du transfert',
//     enum: TransferReason,
//     example: TransferReason.REVIEW,
//   })
//   @IsEnum(TransferReason)
//   reason: TransferReason;

//   @ApiProperty({
//     description: 'Commentaire supplémentaire',
//     required: false,
//     example: 'Besoin d\'une relecture technique urgente',
//   })
//   @IsOptional()
//   @IsString()
//   comment?: string;

//   @ApiProperty({
//     description: 'Si vrai, conserve l\'ancien assigné dans la liste des assignés demandés',
//     required: false,
//     default: true,
//   })
//   @IsOptional()
//   @IsBoolean()
//   keepInRequestedAssignees?: boolean = true;
// }
// src/tasks/dto/transfer-task.dto.ts - MODIFIÉ
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransferType {
  REVIEW = 'REVIEW',        // Pour relecture seulement
  TAKE_OVER = 'TAKE_OVER',  // Pour prise en charge complète
  DELEGATE = 'DELEGATE',    // Délégation temporaire
}

export class TransferTaskDto {
  @ApiProperty({
    description: 'ID de la personne qui doit relire/prendre la tâche',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  newPersonId: string;

  @ApiProperty({
    description: 'Type de transfert',
    enum: TransferType,
    example: TransferType.REVIEW,
  })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiProperty({
    description: 'Commentaire',
    required: false,
    example: 'Besoin d\'une relecture technique',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Date limite pour la relecture',
    required: false,
  })
  @IsOptional()
  reviewDueDate?: string;
}