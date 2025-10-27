import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { randomBytes } from 'crypto';

// Função para gerar ID único
const generateId = () => {
  return randomBytes(12).toString('base64').replace(/[+/]/g, '').substring(0, 25);
};

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authenticateToken);

// Schema de validação para configurações
const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications: z.object({
    newQuotes: z.boolean().optional(),
    overdueInvoices: z.boolean().optional(),
    weeklyReports: z.boolean().optional(),
  }).optional(),
});

// Obter configurações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    let settings = await prisma.$queryRaw`
      SELECT id, geminiApiKey, theme, notifications, updatedAt 
      FROM user_settings 
      WHERE userId = ${userId}
    ` as any;

    // Se não existir configurações, criar com valores padrão
    if (!settings || settings.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_settings (id, userId, theme, notifications, createdAt, updatedAt)
        VALUES (${generateId()}, ${userId}, 'light', '{"newQuotes":true,"overdueInvoices":true,"weeklyReports":false}', NOW(), NOW())
      `;
      
      settings = await prisma.$queryRaw`
        SELECT id, geminiApiKey, theme, notifications, updatedAt 
        FROM user_settings 
        WHERE userId = ${userId}
      ` as any;
    }
    
    const settingsData = Array.isArray(settings) ? settings[0] : settings;

    // Mascarar a API key para segurança (mostrar apenas os primeiros e últimos caracteres)
    if (settingsData.geminiApiKey) {
      const key = settingsData.geminiApiKey;
      settingsData.geminiApiKey = key.length > 10 
        ? `${key.substring(0, 8)}${'*'.repeat(key.length - 16)}${key.substring(key.length - 8)}`
        : '*'.repeat(key.length);
    }

    logger.info('Configurações do usuário obtidas', { userId });
    res.json(settingsData);
  } catch (error) {
    logger.error('Erro ao obter configurações do usuário', { error, userId: req.user?.userId });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configurações do usuário
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const data = settingsSchema.parse(req.body);

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(data.geminiApiKey !== undefined && { geminiApiKey: data.geminiApiKey }),
        ...(data.theme && { theme: data.theme }),
        ...(data.notifications && { notifications: data.notifications }),
      },
      create: {
        userId,
        geminiApiKey: data.geminiApiKey,
        theme: data.theme || 'light',
        notifications: data.notifications || {
          newQuotes: true,
          overdueInvoices: true,
          weeklyReports: false,
        }
      },
      select: {
        id: true,
        geminiApiKey: true,
        theme: true,
        notifications: true,
        updatedAt: true,
      }
    });

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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }

    logger.error('Erro ao atualizar configurações do usuário', { error, userId: req.user?.userId });
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
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    await prisma.userSettings.upsert({
      where: { userId },
      update: { geminiApiKey: null },
      create: {
        userId,
        theme: 'light',
        notifications: {
          newQuotes: true,
          overdueInvoices: true,
          weeklyReports: false,
        }
      }
    });

    logger.info('Token do Gemini removido', { userId });
    res.json({ message: 'Token removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover token do Gemini', { error, userId: req.user?.userId });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;