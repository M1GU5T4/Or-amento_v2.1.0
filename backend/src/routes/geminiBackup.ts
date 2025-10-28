import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import geminiBackupService from '../services/geminiBackupService';
import { logger } from '../lib/logger';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Schema de validação para requisições de backup
const backupRequestSchema = z.object({
  type: z.enum(['data_analysis', 'code_generation', 'error_resolution', 'feature_completion', 'data_backup']),
  context: z.any().optional(),
  requirements: z.string().min(10, 'Requisitos devem ter pelo menos 10 caracteres'),
  fallbackData: z.any().optional()
});

// Verificar status do serviço de backup
router.get('/status', async (req, res) => {
  try {
    const isAvailable = geminiBackupService.isAvailable();
    const connectionTest = isAvailable ? await geminiBackupService.testConnection() : false;

    res.json({
      available: isAvailable,
      connected: connectionTest,
      timestamp: new Date().toISOString(),
      message: isAvailable 
        ? (connectionTest ? 'Serviço de backup operacional' : 'Serviço disponível mas sem conexão')
        : 'Serviço de backup não disponível'
    });
  } catch (error) {
    logger.error('Erro ao verificar status do backup service', {}, error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      available: false,
      connected: false
    });
  }
});

// Solicitar backup/assistência da IA
router.post('/request', async (req, res) => {
  try {
    const data = backupRequestSchema.parse(req.body);

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de backup não está disponível',
        suggestion: 'Verifique se a GEMINI_API_KEY está configurada corretamente'
      });
    }

    logger.info('Processando requisição de backup', { 
      type: data.type, 
      userId: req.user?.id 
    });

    const result = await geminiBackupService.handleBackupRequest(data);

    if (result.success) {
      logger.info('Requisição de backup processada com sucesso', { 
        type: data.type,
        userId: req.user?.id
      });
    } else {
      logger.warn('Requisição de backup falhou', { 
        type: data.type,
        error: result.error,
        userId: req.user?.id
      });
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Erro ao processar requisição de backup', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Análise rápida de dados específicos
router.post('/analyze', async (req, res) => {
  try {
    const { data, question } = req.body;

    if (!data || !question) {
      return res.status(400).json({
        error: 'Dados e pergunta são obrigatórios'
      });
    }

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de análise não está disponível'
      });
    }

    const result = await geminiBackupService.handleBackupRequest({
      type: 'data_analysis',
      context: data,
      requirements: question
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro na análise rápida', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Geração de código sob demanda
router.post('/generate-code', async (req, res) => {
  try {
    const { requirements, context, language } = req.body;

    if (!requirements) {
      return res.status(400).json({
        error: 'Requisitos são obrigatórios'
      });
    }

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de geração de código não está disponível'
      });
    }

    const enhancedRequirements = `
    Linguagem/Framework: ${language || 'TypeScript/Node.js'}
    Requisitos: ${requirements}
    `;

    const result = await geminiBackupService.handleBackupRequest({
      type: 'code_generation',
      context: context || {},
      requirements: enhancedRequirements
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro na geração de código', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Resolução de erros
router.post('/resolve-error', async (req, res) => {
  try {
    const { error, context, description } = req.body;

    if (!error && !description) {
      return res.status(400).json({
        error: 'Erro ou descrição são obrigatórios'
      });
    }

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de resolução de erros não está disponível'
      });
    }

    const result = await geminiBackupService.handleBackupRequest({
      type: 'error_resolution',
      context: { error, context },
      requirements: description || 'Analisar e resolver o erro fornecido'
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro na resolução de problemas', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Backup completo do sistema
router.post('/full-backup', async (req, res) => {
  try {
    const { includeAnalysis } = req.body;

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de backup não está disponível'
      });
    }

    logger.info('Iniciando backup completo do sistema', { userId: req.user?.id });

    const requirements = includeAnalysis 
      ? 'Realizar backup completo dos dados com análise detalhada e recomendações'
      : 'Realizar backup completo dos dados do sistema';

    const result = await geminiBackupService.handleBackupRequest({
      type: 'data_backup',
      context: { fullBackup: true },
      requirements
    });

    if (result.success) {
      logger.info('Backup completo realizado com sucesso', { userId: req.user?.id });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erro no backup completo', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Completar funcionalidade faltante
router.post('/complete-feature', async (req, res) => {
  try {
    const { feature, currentState, requirements } = req.body;

    if (!feature || !requirements) {
      return res.status(400).json({
        error: 'Nome da funcionalidade e requisitos são obrigatórios'
      });
    }

    if (!geminiBackupService.isAvailable()) {
      return res.status(503).json({
        error: 'Serviço de completar funcionalidades não está disponível'
      });
    }

    const enhancedRequirements = `
    Funcionalidade: ${feature}
    Requisitos: ${requirements}
    Estado atual: ${currentState || 'Não especificado'}
    `;

    const result = await geminiBackupService.handleBackupRequest({
      type: 'feature_completion',
      context: { feature, currentState },
      requirements: enhancedRequirements
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro ao completar funcionalidade', { userId: req.user?.id }, error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;