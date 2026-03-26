import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
});

// Dados mock para modo sem banco
let mockClients = [
  { id: 'c1', name: 'Tech Solutions Ltda', email: 'contato@techsolutions.com', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000', createdAt: new Date() },
  { id: 'c2', name: 'Inova Corp', email: 'financeiro@inova.com', phone: '(21) 91234-5678', address: 'Rua das Inovações, 200', createdAt: new Date() },
  { id: 'c3', name: 'Constru Bem', email: 'obras@construbem.com.br', phone: '(31) 95555-1234', address: 'Alameda dos Construtores, 50', createdAt: new Date() },
];

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const clients = mockClients.map(client => ({
      ...client,
      _count: {
        workOrders: 0,
        quotes: 0,
        invoices: 0,
        projects: 0,
      }
    }));

    res.json(clients);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = mockClients.find(c => c.id === id);

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({
      ...client,
      workOrders: [],
      quotes: [],
      invoices: [],
      projects: [],
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const data = clientSchema.parse(req.body);

    const existingClient = mockClients.find(c => c.email === data.email);

    if (existingClient) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const newClient = {
      id: `c${Date.now()}`,
      ...data,
      createdAt: new Date()
    };

    mockClients.push(newClient);

    res.status(201).json(newClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = clientSchema.parse(req.body);

    const clientIndex = mockClients.findIndex(c => c.id === id);

    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se o email já está em uso por outro cliente
    const emailInUse = mockClients.find(c => c.email === data.email && c.id !== id);

    if (emailInUse) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    mockClients[clientIndex] = { ...mockClients[clientIndex], ...data };

    res.json(mockClients[clientIndex]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const clientIndex = mockClients.findIndex(c => c.id === id);

    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    mockClients.splice(clientIndex, 1);

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;