# Backend - Sistema de Gestão Empresarial

Backend completo para o sistema de gestão empresarial com Node.js, Express, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** com **Prisma ORM**
- **JWT** para autenticação
- **Zod** para validação
- **Docker** para containerização

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Instalação e Configuração

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar banco de dados
```bash
# Subir PostgreSQL com Docker
docker-compose up -d postgres

# Aguardar alguns segundos para o banco inicializar
# Gerar cliente Prisma
npm run db:generate

# Aplicar migrações
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

### 3. Iniciar servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Buscar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Ordens de Serviço
- `GET /api/work-orders` - Listar ordens
- `POST /api/work-orders` - Criar ordem
- `GET /api/work-orders/:id` - Buscar ordem
- `PUT /api/work-orders/:id` - Atualizar ordem
- `DELETE /api/work-orders/:id` - Deletar ordem

### Orçamentos
- `GET /api/quotes` - Listar orçamentos
- `POST /api/quotes` - Criar orçamento
- `GET /api/quotes/:id` - Buscar orçamento
- `PUT /api/quotes/:id` - Atualizar orçamento
- `DELETE /api/quotes/:id` - Deletar orçamento

### Faturas
- `GET /api/invoices` - Listar faturas
- `POST /api/invoices` - Criar fatura
- `GET /api/invoices/:id` - Buscar fatura
- `PUT /api/invoices/:id` - Atualizar fatura
- `PATCH /api/invoices/:id/pay` - Marcar como paga
- `DELETE /api/invoices/:id` - Deletar fatura

### Projetos
- `GET /api/projects` - Listar projetos
- `POST /api/projects` - Criar projeto
- `GET /api/projects/:id` - Buscar projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `PATCH /api/projects/:projectId/tasks/:taskId` - Atualizar tarefa
- `DELETE /api/projects/:id` - Deletar projeto

### Despesas
- `GET /api/expenses` - Listar despesas
- `POST /api/expenses` - Criar despesa
- `GET /api/expenses/:id` - Buscar despesa
- `PUT /api/expenses/:id` - Atualizar despesa
- `DELETE /api/expenses/:id` - Deletar despesa
- `GET /api/expenses/reports/by-category` - Relatório por categoria

### Dashboard
- `GET /api/dashboard/metrics` - Métricas do dashboard
- `GET /api/dashboard/recent-activities` - Atividades recentes

## 🔐 Autenticação

Todas as rotas (exceto auth) requerem token JWT no header:
```
Authorization: Bearer <token>
```

## 🗄️ Banco de Dados

### Usuário padrão criado no seed:
- **Email:** admin@orcamento.com
- **Senha:** admin123
- **Role:** ADMIN

### Acessar Adminer (Interface do banco):
- URL: http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuário: orcamento_user
- Senha: orcamento_pass
- Base de dados: orcamento_db

## 🐳 Docker

```bash
# Subir apenas o banco
docker-compose up -d postgres

# Subir banco + Adminer
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 📊 Estrutura do Projeto

```
backend/
├── src/
│   ├── middleware/     # Middlewares (auth, etc)
│   ├── routes/         # Rotas da API
│   ├── prisma/         # Schema e seed
│   └── server.ts       # Servidor principal
├── prisma/
│   └── schema.prisma   # Schema do banco
├── docker-compose.yml  # Docker services
└── package.json
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Servidor em desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Iniciar produção
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:push` - Aplicar schema ao banco
- `npm run db:migrate` - Criar migração
- `npm run db:seed` - Popular banco com dados

## 🌐 URLs Importantes

- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Adminer:** http://localhost:8080
- **PostgreSQL:** localhost:5432