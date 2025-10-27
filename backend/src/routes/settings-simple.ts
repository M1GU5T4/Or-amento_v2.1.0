import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../lib/logger';

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authenticateToken);

// Armazenamento temporário em memória (para teste)
const userSettings: Record<string, any> = {};

// Obter configurações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const settings = userSettings[userId] || {
      theme: 'light',
      notifications: {
        newQuotes: true,
        overdueInvoices: true,
        weeklyReports: false,
      }
    };

    logger.info('Configurações do usuário obtidas', { userId });
    res.json(settings);
  } catch (error) {
    logger.error('Erro ao obter configurações do usuário', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configurações do usuário
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { geminiApiKey, theme, notifications } = req.body;

    // Atualizar configurações em memória
    userSettings[userId] = {
      ...userSettings[userId],
      ...(geminiApiKey !== undefined && { geminiApiKey }),
      ...(theme && { theme }),
      ...(notifications && { notifications }),
      updatedAt: new Date().toISOString(),
    };

    const settings = { ...userSettings[userId] };

    // Mascarar a API key na resposta
    if (settings.geminiApiKey) {
      const key = settings.geminiApiKey;
      settings.geminiApiKey = key.length > 10 
        ? `${key.substring(0, 8)}${'*'.repeat(key.length - 16)}${key.substring(key.length - 8)}`
        : '*'.repeat(key.length);
    }

    logger.info('Configurações do usuário atualizadas', { userId });
    res.json(settings);
  } catch (error) {
    logger.error('Erro ao atualizar configurações do usuário', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Testar token do Gemini
router.post('/test-gemini', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key é obrigatória' });
    }

    // Testar o token fazendo uma requisição para a API do Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      res.json({ valid: true, message: 'Token válido' });
    } else {
      res.status(400).json({ valid: false, message: 'Token inválido' });
    }
  } catch (error) {
    logger.error('Erro ao testar token do Gemini', { error });
    res.status(500).json({ valid: false, message: 'Erro ao validar token' });
  }
});

// Remover token do Gemini
router.delete('/gemini-token', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (userSettings[userId]) {
      delete userSettings[userId].geminiApiKey;
    }

    logger.info('Token do Gemini removido', { userId });
    res.json({ message: 'Token removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover token do Gemini', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;