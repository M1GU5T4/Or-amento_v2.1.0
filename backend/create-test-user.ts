import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'teste@heseguranca.com' }
    });

    if (existingUser) {
      console.log('⚠️  Usuário teste@heseguranca.com já existe!');
      console.log('ID:', existingUser.id);
      console.log('Role:', existingUser.role);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin@123', 12);

    // Criar usuário com role ADMIN
    const user = await prisma.user.create({
      data: {
        email: 'teste@heseguranca.com',
        password: hashedPassword,
        name: 'Usuário Teste',
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email: teste@heseguranca.com');
    console.log('🔐 Senha: admin@123');
    console.log('👤 Role: ADMIN');
    console.log('ID:', user.id);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
