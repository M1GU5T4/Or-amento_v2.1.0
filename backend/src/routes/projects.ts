import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const taskSchema = z.object({
  name: z.string().min(1, 'Nome da tarefa é obrigatório'),
  isCompleted: z.boolean().optional(),
});

const projectSchema = z.object({
  name: z.string().min(2, 'Nome do projeto deve ter pelo menos 2 caracteres'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  quoteId: z.string().optional(), // Referência ao orçamento de origem
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']).optional(),
  description: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  budget: z.number().positive().optional(),
  tasks: z.array(taskSchema).optional(),
});

const projectUpdateSchema = z.object({
  name: z.string().min(2, 'Nome do projeto deve ter pelo menos 2 caracteres'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  quoteId: z.string().optional(), // Referência ao orçamento de origem
  startDate: z.string().optional(), // Opcional na atualização
  endDate: z.string().optional(),
  status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']).optional(),
  description: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  budget: z.number().positive().optional(),
  tasks: z.array(taskSchema).optional(),
});

const projectExpenseSchema = z.object({
  category: z.enum(['ALMOCO', 'DESLOCAMENTO', 'MATERIAL', 'OUTROS']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  receipt: z.string().optional(),
});

const projectNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  type: z.enum(['GERAL', 'PROGRESSO', 'PROBLEMA', 'OBSERVACAO']).optional(),
});

router.use(authenticateToken);

// Listar todos os projetos
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
          }
        },
        tasks: true,
        projectExpenses: true,
        projectNotes: true,
        _count: {
          select: {
            tasks: true,
            projectExpenses: true,
            projectNotes: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Adicionar estatísticas calculadas
    const projectsWithStats = projects.map(project => {
      const taskProgress = project.tasks.length > 0
        ? Math.round((project.tasks.filter(task => task.isCompleted).length / project.tasks.length) * 100)
        : 0;

      const totalExpenses = project.projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      const now = new Date();
      const endDate = project.endDate ? new Date(project.endDate) : null;
      const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return {
        ...project,
        taskProgress,
        totalExpenses,
        daysRemaining,
        isOverdue: daysRemaining !== null && daysRemaining < 0,
      };
    });

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar projeto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: true,
        projectExpenses: {
          orderBy: { date: 'desc' }
        },
        projectNotes: {
          orderBy: { createdAt: 'desc' }
        },
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Calcular estatísticas
    const taskProgress = project.tasks.length > 0
      ? Math.round((project.tasks.filter(task => task.isCompleted).length / project.tasks.length) * 100)
      : 0;

    const totalExpenses = project.projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const now = new Date();
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      ...project,
      taskProgress,
      totalExpenses,
      daysRemaining,
      isOverdue: daysRemaining !== null && daysRemaining < 0,
    });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo projeto
router.post('/', async (req, res) => {
  try {
    const data = projectSchema.parse(req.body);

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });

    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        quoteId: data.quoteId || null, // Referência ao orçamento de origem
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'NAO_INICIADO',
        description: data.description,
        progress: data.progress || 0,
        budget: data.budget,
        tasks: data.tasks ? {
          create: data.tasks
        } : undefined
      },
      include: {
        client: true,
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
          }
        },
        tasks: true,
        projectExpenses: true,
        projectNotes: true,
      }
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar projeto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = projectUpdateSchema.parse(req.body);

    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        clientId: data.clientId,
        quoteId: data.quoteId !== undefined ? data.quoteId : existingProject.quoteId,
        // Preservar datas originais se não foram fornecidas
        startDate: data.startDate ? new Date(data.startDate) : existingProject.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existingProject.endDate,
        status: data.status || existingProject.status,
        description: data.description !== undefined ? data.description : existingProject.description,
        progress: data.progress !== undefined ? data.progress : existingProject.progress,
        budget: data.budget !== undefined ? data.budget : existingProject.budget,
        tasks: data.tasks ? {
          deleteMany: {},
          create: data.tasks
        } : undefined
      },
      include: {
        client: true,
        tasks: true,
        projectExpenses: true,
        projectNotes: true,
      }
    });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status de uma tarefa
router.patch('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { isCompleted } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: projectId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted: Boolean(isCompleted) }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso do projeto
router.patch('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progresso deve ser um número entre 0 e 100' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { progress },
      include: {
        client: true,
        tasks: true,
        projectExpenses: true,
        projectNotes: true,
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== DESPESAS DO PROJETO =====

// Listar despesas do projeto
router.get('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;

    const expenses = await prisma.projectExpense.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar despesa do projeto
router.post('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const data = projectExpenseSchema.parse(req.body);

    const expense = await prisma.projectExpense.create({
      data: {
        projectId: id,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        receipt: data.receipt,
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

// Atualizar despesa do projeto
router.put('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const data = projectExpenseSchema.parse(req.body);

    const expense = await prisma.projectExpense.update({
      where: {
        id: expenseId,
        projectId: id
      },
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        receipt: data.receipt,
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

// Deletar despesa do projeto
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;

    await prisma.projectExpense.delete({
      where: {
        id: expenseId,
        projectId: id
      }
    });

    res.json({ message: 'Despesa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ANOTAÇÕES DO PROJETO =====

// Listar anotações do projeto
router.get('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;

    const notes = await prisma.projectNote.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notes);
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar anotação do projeto
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const data = projectNoteSchema.parse(req.body);

    const note = await prisma.projectNote.create({
      data: {
        projectId: id,
        title: data.title,
        content: data.content,
        type: data.type || 'GERAL',
      }
    });

    res.status(201).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar anotação do projeto
router.put('/:id/notes/:noteId', async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const data = projectNoteSchema.parse(req.body);

    const note = await prisma.projectNote.update({
      where: {
        id: noteId,
        projectId: id
      },
      data: {
        title: data.title,
        content: data.content,
        type: data.type || 'GERAL',
      }
    });

    res.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar anotação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar anotação do projeto
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const { id, noteId } = req.params;

    await prisma.projectNote.delete({
      where: {
        id: noteId,
        projectId: id
      }
    });

    res.json({ message: 'Anotação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar anotação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== RELATÓRIO DO PROJETO =====

// Obter relatório completo do projeto
router.get('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: true,
        projectExpenses: {
          orderBy: { date: 'desc' }
        },
        projectNotes: {
          orderBy: { createdAt: 'desc' }
        },
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Calcular estatísticas
    const totalExpenses = project.projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByCategory = project.projectExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const tasksCompleted = project.tasks.filter(task => task.isCompleted).length;
    const tasksTotal = project.tasks.length;
    const taskProgress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    // Calcular tempo restante
    const now = new Date();
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      project,
      statistics: {
        totalExpenses,
        expensesByCategory,
        tasksCompleted,
        tasksTotal,
        taskProgress,
        daysRemaining,
        isOverdue: daysRemaining !== null && daysRemaining < 0,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar projeto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;