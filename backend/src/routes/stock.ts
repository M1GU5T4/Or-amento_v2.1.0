import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// Schemas de validação
const stockCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório'),
  description: z.string().optional(),
});

const stockItemSchema = z.object({
  name: z.string().min(1, 'Nome do item é obrigatório'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['PRODUTO', 'MAO_DE_OBRA', 'METRO']),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa').optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  barcode: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

const stockMovementSchema = z.object({
  itemId: z.string().min(1, 'Item é obrigatório'),
  type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().positive().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

router.use(authenticateToken);

// ===== CATEGORIAS =====

// Listar categorias
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.stockCategory.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar categoria
router.post('/categories', async (req, res) => {
  try {
    const data = stockCategorySchema.parse(req.body);

    const category = await prisma.stockCategory.create({
      data,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar categoria
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = stockCategorySchema.parse(req.body);

    const category = await prisma.stockCategory.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar categoria
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há itens na categoria
    const itemCount = await prisma.stockItem.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir a categoria. Há ${itemCount} item(ns) vinculado(s).` 
      });
    }

    await prisma.stockCategory.delete({
      where: { id }
    });

    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ITENS =====

// Listar itens
router.get('/items', async (req, res) => {
  try {
    const { categoryId, type, lowStock, search } = req.query;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.stockItem.findMany({
      where,
      include: {
        category: true,
        movements: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calcular campos adicionais
    const itemsWithCalculations = items.map(item => ({
      ...item,
      totalValue: item.quantity * item.price,
      isLowStock: item.minStock ? item.quantity <= item.minStock : false,
      lastMovement: item.movements[0] || null,
    }));

    // Filtrar por estoque baixo se solicitado
    const filteredItems = lowStock === 'true' 
      ? itemsWithCalculations.filter(item => item.isLowStock)
      : itemsWithCalculations;

    res.json(filteredItems);
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar item por ID
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const itemWithCalculations = {
      ...item,
      totalValue: item.quantity * item.price,
      isLowStock: item.minStock ? item.quantity <= item.minStock : false,
    };

    res.json(itemWithCalculations);
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar item
router.post('/items', async (req, res) => {
  try {
    const data = stockItemSchema.parse(req.body);

    // Verificar se a categoria existe
    const category = await prisma.stockCategory.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    const item = await prisma.stockItem.create({
      data: {
        ...data,
        quantity: data.quantity || 0,
        isActive: data.isActive !== false,
      },
      include: {
        category: true
      }
    });

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = stockItemSchema.parse(req.body);

    const item = await prisma.stockItem.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });

    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.stockItem.delete({
      where: { id }
    });

    res.json({ message: 'Item excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== MOVIMENTAÇÕES =====

// Listar movimentações
router.get('/movements', async (req, res) => {
  try {
    const { itemId, type, startDate, endDate } = req.query;

    const where: any = {};

    if (itemId) {
      where.itemId = itemId as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(movements);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar movimentação
router.post('/movements', async (req, res) => {
  try {
    const data = stockMovementSchema.parse(req.body);

    // Buscar o item
    const item = await prisma.stockItem.findUnique({
      where: { id: data.itemId }
    });

    if (!item) {
      return res.status(400).json({ error: 'Item não encontrado' });
    }

    // Calcular nova quantidade
    let newQuantity = item.quantity;
    switch (data.type) {
      case 'ENTRADA':
        newQuantity += data.quantity;
        break;
      case 'SAIDA':
        newQuantity -= data.quantity;
        if (newQuantity < 0) {
          return res.status(400).json({ 
            error: 'Quantidade insuficiente em estoque' 
          });
        }
        break;
      case 'AJUSTE':
        newQuantity = data.quantity;
        break;
      case 'TRANSFERENCIA':
        // Para transferência, implementar lógica específica se necessário
        newQuantity -= data.quantity;
        break;
    }

    // Calcular valor total
    const totalValue = data.unitPrice ? data.quantity * data.unitPrice : null;

    // Criar movimentação e atualizar estoque em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar movimentação
      const movement = await tx.stockMovement.create({
        data: {
          ...data,
          totalValue,
          userId: (req as any).user?.id,
        },
        include: {
          item: {
            include: {
              category: true
            }
          }
        }
      });

      // Atualizar quantidade do item
      await tx.stockItem.update({
        where: { id: data.itemId },
        data: { quantity: newQuantity }
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== RELATÓRIOS =====

// Relatório de estoque
router.get('/reports/stock', async (req, res) => {
  try {
    const items = await prisma.stockItem.findMany({
      where: { isActive: true },
      include: {
        category: true
      }
    });

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = items.filter(item => 
      item.minStock ? item.quantity <= item.minStock : false
    );

    const byCategory = items.reduce((acc, item) => {
      const categoryName = item.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          count: 0,
          value: 0,
          items: []
        };
      }
      acc[categoryName].count++;
      acc[categoryName].value += item.quantity * item.price;
      acc[categoryName].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    const byType = items.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {
          count: 0,
          value: 0
        };
      }
      acc[item.type].count++;
      acc[item.type].value += item.quantity * item.price;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      summary: {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        categoriesCount: Object.keys(byCategory).length,
      },
      byCategory,
      byType,
      lowStockItems: lowStockItems.map(item => ({
        ...item,
        totalValue: item.quantity * item.price,
        isLowStock: true,
      }))
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de movimentações
router.get('/reports/movements', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          include: {
            category: true
          }
        }
      }
    });

    const byType = movements.reduce((acc, movement) => {
      if (!acc[movement.type]) {
        acc[movement.type] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }
      acc[movement.type].count++;
      acc[movement.type].totalQuantity += movement.quantity;
      acc[movement.type].totalValue += movement.totalValue || 0;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      summary: {
        totalMovements: movements.length,
        totalValue: movements.reduce((sum, m) => sum + (m.totalValue || 0), 0),
      },
      byType,
      movements: movements.slice(0, 50) // Últimas 50 movimentações
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de movimentações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;