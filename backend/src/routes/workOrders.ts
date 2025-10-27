import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

const workOrderSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  serviceType: z.string().min(2, 'Tipo de serviço é obrigatório'),
  technician: z.string().min(2, 'Técnico é obrigatório'),
  scheduledDate: z.string().min(1, 'Data é obrigatória'),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
  value: z.number().positive('Valor deve ser positivo'),
});

const workOrderUpdateSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  serviceType: z.string().min(2, 'Tipo de serviço é obrigatório'),
  technician: z.string().min(2, 'Técnico é obrigatório'),
  scheduledDate: z.string().optional(), // Opcional na atualização
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
  value: z.number().positive('Valor deve ser positivo'),
});

router.use(authenticateToken);

// Listar todas as ordens de serviço
router.get('/', async (req, res) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(workOrders);
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar ordem de serviço por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    res.json(workOrder);
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova ordem de serviço
router.post('/', async (req, res) => {
  try {
    const data = workOrderSchema.parse(req.body);

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });

    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        ...data,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        client: true
      }
    });

    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar ordem de serviço
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = workOrderUpdateSchema.parse(req.body);

    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id }
    });

    if (!existingWorkOrder) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        clientId: data.clientId,
        serviceType: data.serviceType,
        technician: data.technician,
        // Preservar data original se não foi fornecida nova data
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : existingWorkOrder.scheduledDate,
        status: data.status || existingWorkOrder.status,
        value: data.value,
      },
      include: {
        client: true
      }
    });

    res.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar ordem de serviço
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id }
    });

    if (!existingWorkOrder) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    await prisma.workOrder.delete({
      where: { id }
    });

    res.json({ message: 'Ordem de serviço deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;