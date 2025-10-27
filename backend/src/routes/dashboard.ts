import express from 'express';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

router.use(authenticateToken);

// Métricas do dashboard
router.get('/metrics', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Receita total do mês atual
    const currentMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAGO',
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        total: true
      }
    });

    // Receita do mês passado
    const lastMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAGO',
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: {
        total: true
      }
    });

    // Despesas do mês atual
    const currentMonthExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Ordens de serviço por status
    const workOrdersByStatus = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Faturas pendentes
    const pendingInvoices = await prisma.invoice.count({
      where: {
        status: 'PENDENTE'
      }
    });

    // Projetos ativos
    const activeProjects = await prisma.project.count({
      where: {
        status: 'EM_ANDAMENTO'
      }
    });

    // Total de clientes
    const totalClients = await prisma.client.count();

    // Receita dos últimos 6 meses para gráfico
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const revenue = await prisma.invoice.aggregate({
        where: {
          status: 'PAGO',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          total: true
        }
      });

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        revenue: revenue._sum.total || 0
      });
    }

    // Calcular crescimento percentual
    const currentRevenue = currentMonthRevenue._sum.total || 0;
    const lastRevenue = lastMonthRevenue._sum.total || 0;
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    res.json({
      revenue: {
        current: currentRevenue,
        growth: revenueGrowth,
        monthly: monthlyRevenue
      },
      expenses: {
        current: currentMonthExpenses._sum.amount || 0
      },
      workOrders: {
        byStatus: workOrdersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      counts: {
        pendingInvoices,
        activeProjects,
        totalClients
      }
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atividades recentes
router.get('/recent-activities', async (req, res) => {
  try {
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    const recentWorkOrders = await prisma.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    const recentQuotes = await prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      invoices: recentInvoices,
      workOrders: recentWorkOrders,
      quotes: recentQuotes
    });
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;