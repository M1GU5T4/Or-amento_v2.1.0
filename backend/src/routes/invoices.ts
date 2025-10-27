import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

const lineItemSchema = z.object({
  stockItemId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().positive('Preço unitário deve ser positivo'),
  total: z.number().min(0).optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Número da fatura é obrigatório'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  quoteId: z.string().optional(),
  issueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  lineItems: z.array(lineItemSchema).min(1, 'Pelo menos um item é obrigatório'),
  tax: z.number().min(0, 'Taxa não pode ser negativa').optional(),
  amountPaid: z.number().min(0, 'Valor pago não pode ser negativo').optional(),
  status: z.enum(['RASCUNHO', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO']).optional(),
});

router.use(authenticateToken);

// Listar todas as faturas
router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
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
          }
        },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar fatura por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        quote: true,
        lineItems: true,
        expenses: true,
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova fatura
router.post('/', async (req, res) => {
  try {
    const data = invoiceSchema.parse(req.body);

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });

    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se o número da fatura já existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber }
    });

    if (existingInvoice) {
      return res.status(400).json({ error: 'Número da fatura já existe' });
    }

    // Se há quoteId, verificar se existe
    if (data.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: data.quoteId }
      });

      if (!quote) {
        return res.status(400).json({ error: 'Orçamento não encontrado' });
      }
    }

    // Calcular totais
    const subtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = data.tax || 0;
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        quoteId: data.quoteId,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        total,
        amountPaid: data.amountPaid || 0,
        status: data.status || 'RASCUNHO',
        lineItems: {
          create: data.lineItems.map(item => ({
            stockItemId: item.stockItemId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        }
      },
      include: {
        client: true,
        quote: true,
        lineItems: true,
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar fatura
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = invoiceSchema.parse(req.body);

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Calcular totais
    const subtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = data.tax || 0;
    const total = subtotal + tax;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        quoteId: data.quoteId,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        total,
        amountPaid: data.amountPaid || existingInvoice.amountPaid,
        status: data.status || existingInvoice.status,
        lineItems: {
          deleteMany: {},
          create: data.lineItems.map(item => ({
            stockItemId: item.stockItemId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        }
      },
      include: {
        client: true,
        quote: true,
        lineItems: true,
      }
    });

    res.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar fatura como paga
router.patch('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    const newAmountPaid = (existingInvoice.amountPaid || 0) + (amountPaid || existingInvoice.total);
    const status = newAmountPaid >= existingInvoice.total ? 'PAGO' : 'PENDENTE';

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        status
      },
      include: {
        client: true,
        lineItems: true,
      }
    });

    res.json(invoice);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar fatura
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    await prisma.invoice.delete({
      where: { id }
    });

    res.json({ message: 'Fatura deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;