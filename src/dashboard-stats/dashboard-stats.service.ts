import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardStatsService {
  constructor(private prisma: PrismaService) {}

  async getDepartmentStats(departmentId: string) {
    // Vérifier si le département existe
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // 1. Documents du département
    const documents = await this.prisma.document.findMany({
      where: { departmentId },
      select: {
        id: true,
        status: true,
        lists: {
          select: {
            tasks: {
              select: {
                id: true,
                status: true,
                timeEntries: {
                  select: {
                    hoursSpent: true
                  }
                }
              }
            }
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            paid: true,
            status: true
          }
        }
      }
    });

    // 2. Utilisateurs du département
    const users = await this.prisma.user.findMany({
      where: { departmentId, isActive: true },
      select: { id: true }
    });

    // 3. Calculer les statistiques
    const totalDocuments = documents.length;
    const activeDocuments = documents.filter(doc => doc.status === 'ACTIVE').length;
    
    // Extraire toutes les tâches
    const allTasks = documents.flatMap(doc => 
      doc.lists.flatMap(list => list.tasks)
    );
    const totalTasks = allTasks.length;
    const pendingTasks = allTasks.filter(task => task.status === 'PENDING').length;
    
    // Extraire toutes les factures
    const allInvoices = documents.flatMap(doc => doc.invoices);
    const totalInvoices = allInvoices.length;
    const pendingInvoices = allInvoices.filter(invoice => 
      !invoice.paid || ['DRAFT', 'SENT'].includes(invoice.status)
    ).length;
    
    // Calculer le revenu total (factures payées)
    const totalRevenue = allInvoices
      .filter(invoice => invoice.paid)
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount.toString()), 0);
    
    // Heures totales (depuis les timeEntries)
    const totalHours = allTasks
      .flatMap(task => task.timeEntries)
      .reduce((sum, entry) => sum + parseFloat(entry.hoursSpent.toString()), 0);

    // Nombre d'utilisateurs
    const teamMembers = users.length;

    // Documents avec des tâches
    const documentsWithTasks = documents.filter(doc => 
      doc.lists.some(list => list.tasks.length > 0)
    ).length;

    // Calculer les taux
    const documentCompletionRate = totalDocuments > 0 
      ? Math.round((documentsWithTasks / totalDocuments) * 100) 
      : 0;
    
    const taskCompletionRate = totalTasks > 0 
      ? Math.round(((totalTasks - pendingTasks) / totalTasks) * 100) 
      : 0;
    
    const invoicePaymentRate = totalInvoices > 0 
      ? Math.round(((totalInvoices - pendingInvoices) / totalInvoices) * 100) 
      : 0;

    // Activité récente - version simplifiée (documents uniquement)
    const recentActivity = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { 
            entity: 'DOCUMENT', 
            document: { departmentId } 
          },
          { 
            entity: 'USER', 
            user: { departmentId } 
          }
        ]
      },
      select: {
        id: true,
        action: true,
        entity: true,
        entityName: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      totalDocuments,
      activeDocuments,
      totalTasks,
      pendingTasks,
      totalInvoices,
      pendingInvoices,
      totalRevenue: Math.round(totalRevenue),
      teamMembers,
      totalHours: Math.round(totalHours),
      documentsWithTasks,
      documentCompletionRate,
      taskCompletionRate,
      invoicePaymentRate,
      recentActivity
    };
  }

  async getDashboardOverview() {
    // Statistiques globales
    const [
      totalDepartments,
      totalUsers,
      totalDocuments,
      totalInvoices,
      totalRevenueResult
    ] = await Promise.all([
      this.prisma.department.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.document.count(),
      this.prisma.invoice.count(),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { paid: true }
      })
    ]);

    const totalRevenue = totalRevenueResult._sum.amount 
      ? parseFloat(totalRevenueResult._sum.amount.toString())
      : 0;

    // Activité récente
    const recentActivity = await this.prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        entity: true,
        entityName: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return {
      totalDepartments,
      totalUsers,
      totalDocuments,
      totalInvoices,
      totalRevenue: Math.round(totalRevenue),
      recentActivity
    };
  }
}