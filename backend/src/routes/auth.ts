import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Para modo sem banco, apenas aceitar registro do admin
    if (email === 'admin@admin.com') {
      const token = jwt.sign(
        { userId: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: 'admin',
          name: name || 'Administrador',
          email,
          role: 'admin',
          createdAt: new Date()
        },
        token
      });
    } else {
      return res.status(400).json({ error: 'Registro desabilitado no modo sem banco de dados' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Credenciais padrão do admin
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin';

    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { userId: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso',
        user: {
          id: 'admin',
          name: 'Administrador',
          email: adminEmail,
          role: 'admin'
        },
        token
      });
    } else {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
        role: user.role,
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no endpoint de login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de debug para verificar usuários (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-users', async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      res.json({
        message: 'Usuários encontrados',
        count: users.length,
        users: users
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}

export default router;