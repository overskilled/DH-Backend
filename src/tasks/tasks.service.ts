// tasks.service.ts - VERSION DÉFINITIVE
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, AuditAction, AuditEntity } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'prisma/prisma.service';
import { TransferTaskDto, TransferType } from './dto/transfer-task.dto';

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
    // Seul l'assigné actuel, le créateur, ou un admin/board peut demander une relecture
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
    });

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

  // Dans TasksService, ajoutez cette méthode :
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

  // Si pas de relecteurs, retourner un tableau vide
  if (!task.requestedAssignees || task.requestedAssignees.length === 0) {
    return {
      taskId,
      assignee: task.assignee,
      reviewers: [],
      total: 0,
    };
  }

  // Récupérer les informations des relecteurs
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