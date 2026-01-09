// tasks.service.ts - VERSION DÉFINITIVE
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { TaskStatus, AuditAction, AuditEntity } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'prisma/prisma.service';
import { TransferTaskDto } from './dto/transfer-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Mapping simplifié et efficace
private mapStatus(status: string): TaskStatus {
    console.log('Mapping status:', status);
    
    const statusMap: Record<string, TaskStatus> = {
      // Valeurs frontend
      'todo': TaskStatus.PENDING,
      'in_progress': TaskStatus.IN_PROGRESS,
      'review': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.DONE,
            'suspended': TaskStatus.SUSPENDED, // ✅ Utiliser CANCELLED pour suspended

      // Valeurs backend (au cas où)
      'PENDING': TaskStatus.PENDING,
      'IN_PROGRESS': TaskStatus.IN_PROGRESS,
      'DONE': TaskStatus.DONE,
      'CANCELLED': TaskStatus.CANCELLED,
      'SUSPENDED': TaskStatus.SUSPENDED, 
    };

    const normalizedStatus = status.toLowerCase().trim();
    const mappedStatus = statusMap[normalizedStatus];
    
    if (!mappedStatus) {
      throw new BadRequestException(`Status invalide: ${status}. Valeurs autorisées: ${Object.keys(statusMap).join(', ')}`);
    }
    
    return mappedStatus;
  }
    
  
async create(createTaskDto: CreateTaskDto & { createdById: string }) {
  console.log('Création tâche avec données:', createTaskDto);
  
  try {
    // Vérifier que la liste existe
    const list = await this.prisma.list.findUnique({
      where: { id: createTaskDto.listId }
    });

    if (!list) {
      throw new BadRequestException('Liste non trouvée');
    }

    // Vérifier que l'assignee existe si fourni
    if (createTaskDto.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: createTaskDto.assigneeId }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur assigné non trouvé');
      }
    }

    const taskData: any = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      listId: createTaskDto.listId,
      status: this.mapStatus(createTaskDto.status || 'todo'),
      createdById: createTaskDto.createdById, // ✅ Ajout du créateur
    };

    // Ajouter les champs optionnels
    if (createTaskDto.assigneeId) {
      taskData.assigneeId = createTaskDto.assigneeId;
    }
    if (createTaskDto.maxTimeHours !== undefined && createTaskDto.maxTimeHours !== null) {
      taskData.maxTimeHours = createTaskDto.maxTimeHours;
    }
    if (createTaskDto.dueDate) {
      taskData.dueDate = new Date(createTaskDto.dueDate);
    }

    console.log('Données finales pour création:', taskData);

    const task = await this.prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: { // ✅ Inclure les infos du créateur
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    console.log('✅ Tâche créée avec succès:', task);
    return task;
  } catch (error) {
    console.error('❌ Erreur création tâche:', error);
    throw error;
  }
}

async findOne(id: string) {
  return this.prisma.task.findUnique({
    where: { id },
    include: {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdBy: { // ✅ Inclure les infos du créateur
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      timeEntries: {
        include: {
          collaborator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
}
//  async create(createTaskDto: CreateTaskDto) {
//     console.log('Création tâche avec données:', createTaskDto);
    
//     try {
//       // Vérifier que la liste existe
//       const list = await this.prisma.list.findUnique({
//         where: { id: createTaskDto.listId }
//       });

//       if (!list) {
//         throw new BadRequestException('Liste non trouvée');
//       }

//       // Vérifier que l'assignee existe si fourni
//       if (createTaskDto.assigneeId) {
//         const user = await this.prisma.user.findUnique({
//           where: { id: createTaskDto.assigneeId }
//         });

//         if (!user) {
//           throw new BadRequestException('Utilisateur assigné non trouvé');
//         }
//       }

//       const taskData: any = {
//         title: createTaskDto.title,
//         description: createTaskDto.description,
//         listId: createTaskDto.listId,
//         status: this.mapStatus(createTaskDto.status || 'todo'),
//       };

//       // Ajouter les champs optionnels
//       if (createTaskDto.assigneeId) {
//         taskData.assigneeId = createTaskDto.assigneeId;
//       }
//       if (createTaskDto.maxTimeHours !== undefined && createTaskDto.maxTimeHours !== null) {
//         taskData.maxTimeHours = createTaskDto.maxTimeHours;
//       }
//       if (createTaskDto.dueDate) {
//         taskData.dueDate = new Date(createTaskDto.dueDate);
//       }

//       console.log('Données finales pour création:', taskData);

//       const task = await this.prisma.task.create({
//         data: taskData,
//         include: {
//           assignee: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//             },
//           },
//         },
//       });
      
//       console.log('✅ Tâche créée avec succès:', task);
//       return task;
//     } catch (error) {
//       console.error('❌ Erreur création tâche:', error);
//       throw error;
//     }
//   }


  async findAll(filters: { status?: string; assigneeId?: string; listId?: string }) {
    const where: any = {};

    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.listId) where.listId = filters.listId;
    if (filters.status) where.status = this.mapStatus(filters.status);

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTasksByList(listId: string, filters: any) {
    const where: any = { listId };

    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.status) where.status = this.mapStatus(filters.status);

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // async findOne(id: string) {
  //   return this.prisma.task.findUnique({
  //     where: { id },
  //     include: {
  //       assignee: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //           email: true,
  //         },
  //       },
  //       timeEntries: {
  //         include: {
  //           collaborator: {
  //             select: {
  //               id: true,
  //               firstName: true,
  //               lastName: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

async update(id: string, updateTaskDto: UpdateTaskDto) {
    const updateData: any = {};

    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) updateData.status = this.mapStatus(updateTaskDto.status);
    if (updateTaskDto.assigneeId !== undefined) updateData.assigneeId = updateTaskDto.assigneeId;
    if (updateTaskDto.maxTimeHours !== undefined) updateData.maxTimeHours = updateTaskDto.maxTimeHours;
    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

 async transferTask(
    taskId: string,
    transferTaskDto: TransferTaskDto,
    currentUserId: string
  ) {
    console.log('=== DÉBUT TRANSFERT DE TÂCHE ===');
    console.log('Task ID:', taskId);
    console.log('Transfer DTO:', transferTaskDto);
    console.log('Current User ID:', currentUserId);

    // 1. Récupérer la tâche
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        createdBy: true,
      },
    });

    if (!task) {
      throw new BadRequestException('Tâche non trouvée');
    }

    console.log('Tâche trouvée:', task.title);
    console.log('Assigné actuel:', task.assigneeId);
    console.log('Créateur:', task.createdById);

    // 2. Vérifier les permissions
    // Seul l'assigné actuel, le créateur, ou un admin/board peut transférer
    const canTransfer = 
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;

    let userHasPermission = canTransfer;

    if (!userHasPermission) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true }
      });

      const isAdminOrBoard = currentUser?.role === 'ADMIN' || currentUser?.role === 'BOARD';
      if (isAdminOrBoard) {
        userHasPermission = true;
      }
    }

    if (!userHasPermission) {
      throw new ForbiddenException('Vous n\'avez pas la permission de transférer cette tâche');
    }

    // 3. Vérifier que le nouvel assigné existe
    const newAssignee = await this.prisma.user.findUnique({
      where: { id: transferTaskDto.newAssigneeId },
    });

    if (!newAssignee) {
      throw new BadRequestException('Nouvel assigné non trouvé');
    }

    // 4. Vérifier que ce n'est pas le même assigné
    if (task.assigneeId === transferTaskDto.newAssigneeId) {
      throw new BadRequestException('La tâche est déjà assignée à cette personne');
    }

    // 5. Préparer les données de mise à jour
    const updateData: any = {
      assigneeId: transferTaskDto.newAssigneeId,
    };

    // Ajouter l'ancien assigné à la liste des assignés demandés
    if (transferTaskDto.keepInRequestedAssignees !== false && task.assigneeId) {
      const currentRequestedAssignees = task.requestedAssignees || [];
      const updatedRequestedAssignees = [...new Set([...currentRequestedAssignees, task.assigneeId])];
      updateData.requestedAssignees = updatedRequestedAssignees;
    }

    // 6. Effectuer le transfert
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 7. Créer un log d'audit
    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.ASSIGN,
        entity: AuditEntity.TASK,
        entityId: taskId,
        entityName: task.title,
        userId: currentUserId,
        oldValues: {
          assigneeId: task.assigneeId,
          assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
        },
        newValues: {
          assigneeId: transferTaskDto.newAssigneeId,
          assignee: `${newAssignee.firstName} ${newAssignee.lastName}`,
          reason: transferTaskDto.reason,
          comment: transferTaskDto.comment,
        },
        description: `Transfert de tâche: ${transferTaskDto.reason}${transferTaskDto.comment ? ` - ${transferTaskDto.comment}` : ''}`,
      },
    });

    // 8. Créer une notification pour le nouvel assigné
    await this.prisma.notification.create({
      data: {
        message: `Vous avez été assigné à la tâche "${task.title}" par ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'un collègue'}. Raison: ${this.getTransferReasonLabel(transferTaskDto.reason)}`,
        userId: transferTaskDto.newAssigneeId,
      },
    });

    console.log('=== TRANSFERT TERMINÉ AVEC SUCCÈS ===');
    
    return {
      ...updatedTask,
      transferDetails: {
        reason: transferTaskDto.reason,
        comment: transferTaskDto.comment,
        previousAssignee: task.assignee,
        transferredBy: currentUserId,
        transferredAt: new Date(),
      },
    };
  }

  // Méthode utilitaire pour obtenir le libellé de la raison
  private getTransferReasonLabel(reason: string): string {
    const reasonLabels: Record<string, string> = {
      REVIEW: 'Relecture',
      TAKE_OVER: 'Prise de relais',
      OVERLOAD: 'Surcharge',
      OTHER: 'Autre raison',
    };
    
    return reasonLabels[reason] || reason;
  }

} 