import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

const expenseSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().datetime('Data inválida'),
  invoiceId: z.string().optional(),
});

router.use(authenticateToken);

// Listar todas as despesas
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            client: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar despesa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            client: true
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Erro ao buscar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova despesa
router.post('/', async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);

    // Se há invoiceId, verificar se existe
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId }
      });

      if (!invoice) {
        return res.status(400).json({ error: 'Fatura não encontrada' });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        invoiceId: data.invoiceId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            client: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar despesa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = expenseSchema.parse(req.body);

    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        invoiceId: data.invoiceId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            client: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar despesa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.json({ message: 'Despesa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de despesas por categoria
router.get('/reports/by-category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        category: true
      }
    });

    res.json(expensesByCategory);
  } catch (error) {
    console.error('Erro ao gerar relatório de despesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;