import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error('Erro capturado pelo middleware', {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }, error);

  // Tratamento específico para diferentes tipos de erro
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Erros do Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflito: Registro já existe'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado'
    });
  }

  // Erro de autenticação
  if (error.statusCode === 401) {
    return res.status(401).json({
      error: 'Não autorizado'
    });
  }

  // Erro de autorização
  if (error.statusCode === 403) {
    return res.status(403).json({
      error: 'Acesso negado'
    });
  }

  // Erro genérico
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : error.message;

  res.status(statusCode).json({
    error: message
  });
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};