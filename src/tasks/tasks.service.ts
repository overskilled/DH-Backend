// tasks.service.ts - VERSION CORRIGÉE AVEC TYPESCRIPT
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, AuditAction, AuditEntity } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TransferTaskDto, TransferType } from './dto/transfer-task.dto';
import { AuditLogHelper } from '../audit-log/audit-log.helper';
import { Decimal } from '@prisma/client/runtime/library'; // AJOUT POUR LE TYPE DECIMAL
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private auditLogHelper: AuditLogHelper
  ) {}

  // Mapping simplifié et efficace
  private mapStatus(status: string): TaskStatus {
    console.log('Mapping status:', status);
    
    const statusMap: Record<string, TaskStatus> = {
      // Valeurs frontend
      'todo': TaskStatus.PENDING,
      'in_progress': TaskStatus.IN_PROGRESS,
      'review': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.DONE,
      'suspended': TaskStatus.SUSPENDED,

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
        where: { id: createTaskDto.listId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              reference: true
            }
          }
        }
      });

      if (!list) {
        throw new BadRequestException('Liste non trouvée');
      }

      // Vérifier que l'assignee existe si fourni
      let assigneeUser = null;
      // if (createTaskDto.assigneeId) {
      //   assigneeUser = await this.prisma.user.findUnique({
      //     where: { id: createTaskDto.assigneeId }
      //   });

      //   if (!assigneeUser) {
      //     throw new BadRequestException('Utilisateur assigné non trouvé');
      //   }
      // }

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
        createdById: createTaskDto.createdById,
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          list: {
            select: {
              name: true,
              document: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
      });

      // LOG D'AUDIT : Création de tâche
      await this.auditLogHelper.log(
        AuditAction.CREATE as any, // CORRECTION : Utiliser 'as any' pour bypass l'erreur TypeScript
        AuditEntity.TASK as any,
        task.id,
        task.title,
        createTaskDto.createdById,
        {
          description: `Création de la tâche "${task.title}"`,
          newValues: {
            title: task.title,
            description: task.description,
            status: task.status,
            listId: task.listId,
            assigneeId: task.assigneeId,
            maxTimeHours: task.maxTimeHours,
            dueDate: task.dueDate,
            documentId: list.document?.id,
            documentTitle: list.document?.title
          }
        }
      );
      
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
        createdBy: {
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

  // async findAll(filters: { status?: string; assigneeId?: string; listId?: string }) {
  //   const where: any = {};

  //   if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  //   if (filters.listId) where.listId = filters.listId;
  //   if (filters.status) where.status = this.mapStatus(filters.status);

  //   return this.prisma.task.findMany({
  //     where,
  //     include: {
  //       assignee: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }



  // Dans tasks.service.ts backend, méthode findAll :


// Dans tasks.service.ts backend, méthode findAll :
async findAll(filters: { 
  status?: string; 
  assigneeId?: string; 
  listId?: string;
  userId?: string; // AJOUTÉ
}) {
  const where: any = {};

  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.listId) where.listId = filters.listId;
  if (filters.status) where.status = this.mapStatus(filters.status);
  
  // CORRECTION : Ajouter la logique COMPLÈTE pour userId
  if (filters?.userId) {
    where.OR = [
      { assigneeId: filters.userId },
      { requestedAssignees: { has: filters.userId } },
      { createdById: filters.userId } // AJOUTÉ
    ];
  }

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
      createdBy: { // AJOUTÉ
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
  // async getTasksByList(listId: string, filters: any) {
  //   const where: any = { listId };

  //   if (filters) {
  //     if (filters.assigneeId) {
  //       where.assigneeId = filters.assigneeId;
  //     }
      
  //     if (filters.OR) {
  //       where.OR = filters.OR.map((condition: any) => {
  //         if (condition.assigneeId) {
  //           return { assigneeId: condition.assigneeId };
  //         }
  //         if (condition.requestedAssignees && condition.requestedAssignees.has) {
  //           return { 
  //             requestedAssignees: { 
  //               has: condition.requestedAssignees.has 
  //             } 
  //           };
  //         }
  //         return condition;
  //       });
  //     }
      
  //     if (filters.requestedAssignees) {
  //       where.requestedAssignees = {
  //         has: filters.requestedAssignees
  //       };
  //     }

  //     if (filters.userId) {
  //       where.OR = [
  //         { assigneeId: filters.userId },
  //         { requestedAssignees: { has: filters.userId } }
  //       ];
  //     }
  //   }

  //   if (filters?.status) {
  //     where.status = this.mapStatus(filters.status);
  //   }

  //   return this.prisma.task.findMany({
  //     where,
  //     include: {
  //       assignee: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //         },
  //       },
  //       createdBy: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }


  // Dans votre tasks.service.ts backend, modifiez la méthode getTasksByList :

async getTasksByList(listId: string, filters: any) {
  const where: any = { listId };

  console.log('🔍 getTasksByList - Filtres reçus:', filters);

  // CORRECTION CRITIQUE : Gérer TOUS les cas pour un utilisateur
  if (filters?.userId) {
    where.OR = [
      { assigneeId: filters.userId }, // Tâches assignées à l'utilisateur
      { requestedAssignees: { has: filters.userId } }, // Tâches où l'utilisateur est relecteur
      { createdById: filters.userId } // Tâches créées par l'utilisateur
    ];
    console.log('✅ Recherche pour userId:', {
      userId: filters.userId,
      condition: 'assigneeId OU requestedAssignees OU createdById'
    });
  } else if (filters?.assigneeId) {
    // Garder la compatibilité avec l'ancien filtre
    where.assigneeId = filters.assigneeId;
    console.log('✅ Recherche pour assigneeId:', filters.assigneeId);
  }

  if (filters?.status) {
    where.status = this.mapStatus(filters.status);
  }

  console.log('🔍 Requête Prisma where:', JSON.stringify(where, null, 2));

  const tasks = await this.prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      createdBy: {  // AJOUTÉ : Inclure le créateur
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('✅ Nombre de tâches trouvées:', tasks.length);
  
  // Debug : Afficher les détails des tâches trouvées
  tasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.title}`);
    console.log(`     Créée par: ${task.createdById}`);
    console.log(`     Assigné à: ${task.assigneeId}`);
    console.log(`     Relecteurs: ${task.requestedAssignees?.length || 0}`);
    if (task.requestedAssignees?.length > 0) {
      console.log(`     IDs relecteurs: ${task.requestedAssignees.join(', ')}`);
    }
  });

  return tasks;
}

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    // Récupérer la tâche avant modification pour comparer
    const oldTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            document: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!oldTask) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const updateData: any = {};
    const changes: any = {};

    if (updateTaskDto.title !== undefined && updateTaskDto.title !== oldTask.title) {
      updateData.title = updateTaskDto.title;
      changes.title = { old: oldTask.title, new: updateTaskDto.title };
    }
    
    if (updateTaskDto.description !== undefined && updateTaskDto.description !== oldTask.description) {
      updateData.description = updateTaskDto.description;
      changes.description = { old: oldTask.description, new: updateTaskDto.description };
    }
    
    if (updateTaskDto.status !== undefined) {
      const newStatus = this.mapStatus(updateTaskDto.status);
      if (oldTask.status !== newStatus) {
        updateData.status = newStatus;
        changes.status = { old: oldTask.status, new: newStatus };
        
        // LOG D'AUDIT SPÉCIFIQUE : Changement de statut
        await this.auditLogHelper.logTaskStatusChange(
          userId,
          id,
          oldTask.title,
          oldTask.status,
          newStatus
        );
      }
    }
    
    if (updateTaskDto.assigneeId !== undefined && updateTaskDto.assigneeId !== oldTask.assigneeId) {
      const newAssignee = updateTaskDto.assigneeId ? await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assigneeId },
        select: { firstName: true, lastName: true }
      }) : null;
      
      updateData.assigneeId = updateTaskDto.assigneeId;
      changes.assignee = {
        old: oldTask.assignee ? `${oldTask.assignee.firstName} ${oldTask.assignee.lastName}` : null,
        new: newAssignee ? `${newAssignee.firstName} ${newAssignee.lastName}` : null,
        oldId: oldTask.assigneeId,
        newId: updateTaskDto.assigneeId
      };
    }
    
    if (updateTaskDto.maxTimeHours !== undefined && updateTaskDto.maxTimeHours !== oldTask.maxTimeHours) {
      updateData.maxTimeHours = updateTaskDto.maxTimeHours;
      changes.maxTimeHours = { old: oldTask.maxTimeHours, new: updateTaskDto.maxTimeHours };
    }
    
    if (updateTaskDto.dueDate !== undefined) {
      const oldDueDate = oldTask.dueDate ? oldTask.dueDate.toISOString().split('T')[0] : null;
      const newDueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate).toISOString().split('T')[0] : null;
      
      if (oldDueDate !== newDueDate) {
        updateData.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
        changes.dueDate = { old: oldTask.dueDate, new: updateData.dueDate };
      }
    }

    // Si aucune modification, retourner la tâche telle quelle
    if (Object.keys(updateData).length === 0) {
      return oldTask;
    }

    const updatedTask = await this.prisma.task.update({
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
        list: {
          include: {
            document: true
          }
        }
      },
    });

    // LOG D'AUDIT GÉNÉRAL : Mise à jour de tâche (si ce n'est pas juste un changement de statut déjà logué)
    if (changes.status === undefined || Object.keys(changes).length > 1) {
      const changeDescriptions: string[] = []; // TYPAGE EXPLICITE
      if (changes.title) changeDescriptions.push('titre');
      if (changes.description) changeDescriptions.push('description');
      if (changes.assignee) changeDescriptions.push('assignation');
      if (changes.maxTimeHours) changeDescriptions.push('temps maximum');
      if (changes.dueDate) changeDescriptions.push('date d\'échéance');

      if (changeDescriptions.length > 0) {
        await this.auditLogHelper.log(
          AuditAction.UPDATE as any,
          AuditEntity.TASK as any,
          id,
          oldTask.title,
          userId,
          {
            description: `Modification de la tâche "${oldTask.title}" : ${changeDescriptions.join(', ')}`,
            oldValues: oldTask,
            newValues: updatedTask
          }
        );
      }
    }

    return updatedTask;
  }

  async assignTask(id: string, assigneeId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const newAssignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
      select: { firstName: true, lastName: true }
    });

    if (!newAssignee) {
      throw new BadRequestException('Utilisateur assigné non trouvé');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { assigneeId },
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

    // LOG D'AUDIT : Assignation de tâche
    await this.auditLogHelper.log(
      AuditAction.ASSIGN as any,
      AuditEntity.TASK as any,
      id,
      task.title,
      userId,
      {
        oldValues: {
          assigneeId: task.assigneeId,
          assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null
        },
        newValues: {
          assigneeId: assigneeId,
          assignee: `${newAssignee.firstName} ${newAssignee.lastName}`
        },
        description: `Assignation de la tâche "${task.title}" à ${newAssignee.firstName} ${newAssignee.lastName}`
      }
    );

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            document: true
          }
        },
        assignee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // LOG D'AUDIT : Suppression de tâche
    await this.auditLogHelper.log(
      AuditAction.DELETE as any,
      AuditEntity.TASK as any,
      id,
      task.title,
      userId,
      {
        description: `Suppression de la tâche "${task.title}"`,
        oldValues: {
          title: task.title,
          status: task.status,
          assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
          listId: task.listId,
          documentId: task.list.document?.id,
          documentTitle: task.list.document?.title
        }
      }
    );

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async transferTask(
    taskId: string,
    transferTaskDto: TransferTaskDto,
    currentUserId: string
  ) {
    console.log('=== TRANSFERT DE TÂCHE POUR RELECTURE ===');
    console.log('Task ID:', taskId);
    console.log('Transfer DTO:', transferTaskDto);
    console.log('Current User ID:', currentUserId);

    // 1. Récupérer la tâche
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        createdBy: true,
        list: {
          include: {
            document: true
          }
        }
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    console.log('Tâche trouvée:', task.title);
    console.log('Assigné actuel:', task.assigneeId);
    console.log('Créateur:', task.createdById);

    // 2. Vérifier les permissions
    const canRequestReview = 
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;

    let userHasPermission = canRequestReview;

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
      throw new ForbiddenException('Vous n\'avez pas la permission de demander une relecture pour cette tâche');
    }

    // 3. Vérifier que la nouvelle personne existe
    const newPerson = await this.prisma.user.findUnique({
      where: { id: transferTaskDto.newPersonId },
    });

    if (!newPerson) {
      throw new BadRequestException('Personne non trouvée');
    }

    // 4. Vérifier que ce n'est pas la même personne
    if (task.assigneeId === transferTaskDto.newPersonId) {
      throw new BadRequestException('Vous ne pouvez pas demander une relecture à vous-même');
    }

    // 5. Logique différente selon le type de transfert
    const updateData: any = {};

    if (transferTaskDto.type === TransferType.REVIEW) {
      // Pour relecture : on garde l'assigné actuel, on ajoute juste une demande de relecture
      updateData.requestedAssignees = {
        set: [...new Set([...task.requestedAssignees, transferTaskDto.newPersonId])],
      };
      
      // Ajouter un commentaire comme description de la demande de relecture
      const reviewComment = `📝 Demande de relecture par ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'l\'assigné actuel'}${transferTaskDto.comment ? ` : ${transferTaskDto.comment}` : ''}`;
      
      // Créer une entrée de temps spéciale pour la relecture
      await this.prisma.timeEntry.create({
        data: {
          taskId: taskId,
          collaboratorId: currentUserId,
          hoursSpent: 0,
          description: reviewComment,
          date: new Date(),
        },
      });

    } else if (transferTaskDto.type === TransferType.TAKE_OVER) {
      // Pour prise en charge complète : on change l'assigné
      updateData.assigneeId = transferTaskDto.newPersonId;
      updateData.requestedAssignees = {
        set: [...new Set([...task.requestedAssignees, task.assigneeId || ''])],
      };
    }

    // 6. Mettre à jour la tâche
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

    // 7. Créer un log d'audit (utiliser AuditLogHelper au lieu de prisma directement)
    await this.auditLogHelper.log(
      AuditAction.ASSIGN as any,
      AuditEntity.TASK as any,
      taskId,
      task.title,
      currentUserId,
      {
        oldValues: {
          assigneeId: task.assigneeId,
          assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
          requestedAssignees: task.requestedAssignees,
        },
        newValues: {
          assigneeId: updatedTask.assigneeId,
          assignee: updatedTask.assignee ? `${updatedTask.assignee.firstName} ${updatedTask.assignee.lastName}` : null,
          requestedAssignees: updatedTask.requestedAssignees,
          transferType: transferTaskDto.type,
          comment: transferTaskDto.comment,
          newPerson: `${newPerson.firstName} ${newPerson.lastName}`,
        },
        description: `Transfert de type: ${transferTaskDto.type} - ${transferTaskDto.comment || 'Aucun commentaire'}`,
      },
    );

    // 8. Créer une notification pour la nouvelle personne
    let notificationMessage = '';
    
    if (transferTaskDto.type === TransferType.REVIEW) {
      notificationMessage = `🔍 Demande de relecture pour la tâche "${task.title}" dans le document "${task.list.document?.title || 'Sans document'}". Assigné à: ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Non assigné'}. Commentaire: ${transferTaskDto.comment || 'Aucun commentaire'}`;
    } else {
      notificationMessage = `🔄 Vous avez été assigné à la tâche "${task.title}" par ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'un collègue'}.`;
    }

    await this.prisma.notification.create({
      data: {
        message: notificationMessage,
        userId: transferTaskDto.newPersonId,
      },
    });

    console.log('=== TRANSFERT TERMINÉ AVEC SUCCÈS ===');
    
    return {
      success: true,
      message: transferTaskDto.type === TransferType.REVIEW 
        ? 'Demande de relecture envoyée avec succès' 
        : 'Tâche transférée avec succès',
      task: updatedTask,
      transferDetails: {
        type: transferTaskDto.type,
        comment: transferTaskDto.comment,
        previousAssignee: task.assignee,
        newPerson: newPerson,
        transferredBy: currentUserId,
        transferredAt: new Date(),
      },
    };
  }

  // Nouvelle méthode pour compléter une relecture
  async completeReview(taskId: string, currentUserId: string, approved: boolean, feedback?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        list: {
          include: {
            document: true
          }
        }
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Vérifier si l'utilisateur est dans requestedAssignees
    if (!task.requestedAssignees.includes(currentUserId)) {
      throw new ForbiddenException('Vous n\'avez pas été sollicité pour la relecture de cette tâche');
    }

    // Créer une entrée de temps pour la relecture
    await this.prisma.timeEntry.create({
      data: {
        taskId: taskId,
        collaboratorId: currentUserId,
        hoursSpent: 0,
        description: `✅ ${approved ? 'Relecture approuvée' : 'Relecture avec modifications demandées'}${feedback ? ` - Feedback: ${feedback}` : ''}`,
        date: new Date(),
      },
    });

    // Retirer l'utilisateur de requestedAssignees
    const updatedRequestedAssignees = task.requestedAssignees.filter(id => id !== currentUserId);

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        requestedAssignees: updatedRequestedAssignees,
      },
    });

    // LOG D'AUDIT : Complétion de relecture
    await this.auditLogHelper.log(
      AuditAction.STATUS_CHANGE as any,
      AuditEntity.TASK as any,
      taskId,
      task.title,
      currentUserId,
      {
        description: `Relecture ${approved ? 'approuvée' : 'rejetée'} pour la tâche "${task.title}"`,
        newValues: {
          approved,
          feedback,
          reviewerId: currentUserId,
          remainingReviewers: updatedRequestedAssignees.length
        }
      }
    );

    // Créer une notification pour l'assigné original
    if (task.assigneeId) {
      await this.prisma.notification.create({
        data: {
          message: `📋 ${approved ? 'Votre tâche a été approuvée' : 'Votre tâche nécessite des modifications'} par ${currentUserId === task.assigneeId ? 'vous-même' : 'un relecteur'}. ${feedback ? `Feedback: ${feedback}` : ''}`,
          userId: task.assigneeId,
        },
      });
    }

    return {
      success: true,
      message: `Relecture ${approved ? 'approuvée' : 'rejetée'} avec succès`,
      approved,
      feedback,
      remainingReviewers: updatedRequestedAssignees.length,
    };
  }

  async getTaskReviewers(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        requestedAssignees: true,
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    if (!task.requestedAssignees || task.requestedAssignees.length === 0) {
      return {
        taskId,
        assignee: task.assignee,
        reviewers: [],
        total: 0,
      };
    }

    const reviewers = await this.prisma.user.findMany({
      where: {
        id: {
          in: task.requestedAssignees,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      taskId,
      assignee: task.assignee,
      reviewers,
      total: reviewers.length,
    };
  }
}