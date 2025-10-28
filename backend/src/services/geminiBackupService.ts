import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';

interface GeminiBackupConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface BackupRequest {
  type: 'data_analysis' | 'code_generation' | 'error_resolution' | 'feature_completion' | 'data_backup';
  context?: any;
  requirements: string;
  fallbackData?: any;
}

interface BackupResponse {
  success: boolean;
  data?: any;
  code?: string;
  analysis?: string;
  error?: string;
  suggestions?: string[];
}

class GeminiBackupService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.warn('Gemini API Key não encontrada. Serviço de backup desabilitado.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      this.isInitialized = true;
      logger.info('Gemini Backup Service inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar Gemini Backup Service', {}, error);
    }
  }

  async handleBackupRequest(request: BackupRequest): Promise<BackupResponse> {
    if (!this.isInitialized || !this.model) {
      return {
        success: false,
        error: 'Serviço de backup não está disponível'
      };
    }

    try {
      switch (request.type) {
        case 'data_analysis':
          return await this.performDataAnalysis(request);
        case 'code_generation':
          return await this.generateCode(request);
        case 'error_resolution':
          return await this.resolveError(request);
        case 'feature_completion':
          return await this.completeFeature(request);
        case 'data_backup':
          return await this.performDataBackup(request);
        default:
          return {
            success: false,
            error: 'Tipo de backup não suportado'
          };
      }
    } catch (error) {
      logger.error('Erro no processamento do backup request', { request }, error);
      return {
        success: false,
        error: 'Erro interno no serviço de backup'
      };
    }
  }

  private async performDataAnalysis(request: BackupRequest): Promise<BackupResponse> {
    const prompt = `
    Você é um assistente especializado em análise de dados para um sistema ERP/CRM.
    
    CONTEXTO DO SISTEMA:
    - Sistema de gestão empresarial com módulos: Clientes, Projetos, Orçamentos, Faturas, Estoque
    - Banco de dados MySQL com Prisma ORM
    - Frontend React com TypeScript
    - Backend Node.js com Express
    
    DADOS PARA ANÁLISE:
    ${JSON.stringify(request.context, null, 2)}
    
    REQUISITOS:
    ${request.requirements}
    
    Por favor, forneça:
    1. Análise detalhada dos dados
    2. Insights e padrões identificados
    3. Recomendações de ação
    4. Possíveis problemas ou oportunidades
    5. Métricas importantes
    
    Responda em formato JSON estruturado.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    try {
      const parsedAnalysis = JSON.parse(analysis);
      return {
        success: true,
        analysis: parsedAnalysis
      };
    } catch {
      return {
        success: true,
        analysis: analysis
      };
    }
  }

  private async generateCode(request: BackupRequest): Promise<BackupResponse> {
    const prompt = `
    Você é um desenvolvedor especialista em Node.js, React, TypeScript e Prisma.
    
    CONTEXTO DO PROJETO:
    - Sistema ERP/CRM completo
    - Backend: Node.js + Express + Prisma + MySQL
    - Frontend: React + TypeScript + Vite
    - Autenticação JWT
    - Estrutura modular com rotas separadas
    
    ESQUEMA DO BANCO (Prisma):
    ${await this.getDatabaseSchema()}
    
    REQUISITOS PARA GERAÇÃO DE CÓDIGO:
    ${request.requirements}
    
    CONTEXTO ADICIONAL:
    ${JSON.stringify(request.context, null, 2)}
    
    Por favor, gere:
    1. Código TypeScript/JavaScript funcional
    2. Comentários explicativos
    3. Tratamento de erros adequado
    4. Validações necessárias
    5. Testes básicos se aplicável
    
    Responda apenas com o código solicitado, bem estruturado e pronto para uso.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const code = response.text();

    return {
      success: true,
      code: code
    };
  }

  private async resolveError(request: BackupRequest): Promise<BackupResponse> {
    const prompt = `
    Você é um especialista em debugging e resolução de problemas em aplicações web.
    
    CONTEXTO DO SISTEMA:
    - Sistema ERP/CRM com Node.js + React
    - Stack: TypeScript, Prisma, MySQL, Express, Vite
    
    ERRO REPORTADO:
    ${JSON.stringify(request.context, null, 2)}
    
    DESCRIÇÃO DO PROBLEMA:
    ${request.requirements}
    
    Por favor, forneça:
    1. Análise da causa raiz do erro
    2. Soluções possíveis (ordenadas por prioridade)
    3. Código corrigido se aplicável
    4. Passos para implementar a correção
    5. Medidas preventivas para evitar o problema no futuro
    
    Responda em formato JSON estruturado com as soluções.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const resolution = response.text();

    try {
      const parsedResolution = JSON.parse(resolution);
      return {
        success: true,
        analysis: parsedResolution
      };
    } catch {
      return {
        success: true,
        analysis: resolution
      };
    }
  }

  private async completeFeature(request: BackupRequest): Promise<BackupResponse> {
    const prompt = `
    Você é um desenvolvedor full-stack especializado em completar funcionalidades de sistemas ERP/CRM.
    
    ARQUITETURA DO SISTEMA:
    - Frontend: React + TypeScript + Vite
    - Backend: Node.js + Express + Prisma + MySQL
    - Autenticação: JWT
    - Estrutura: Modular com separação de responsabilidades
    
    FUNCIONALIDADE A COMPLETAR:
    ${request.requirements}
    
    CONTEXTO ATUAL:
    ${JSON.stringify(request.context, null, 2)}
    
    DADOS DE FALLBACK (se necessário):
    ${JSON.stringify(request.fallbackData, null, 2)}
    
    Por favor, forneça:
    1. Implementação completa da funcionalidade
    2. Código para backend (rotas, controllers, services)
    3. Código para frontend (componentes, hooks, services)
    4. Validações e tratamento de erros
    5. Testes básicos
    6. Documentação da funcionalidade
    
    Organize a resposta por seções (Backend, Frontend, Testes, Documentação).
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const implementation = response.text();

    return {
      success: true,
      code: implementation
    };
  }

  private async performDataBackup(request: BackupRequest): Promise<BackupResponse> {
    try {
      // Coletar dados críticos do sistema
      const backupData = await this.collectSystemData();
      
      const prompt = `
      Você é um especialista em backup e recuperação de dados para sistemas empresariais.
      
      DADOS DO SISTEMA COLETADOS:
      ${JSON.stringify(backupData, null, 2)}
      
      REQUISITOS ESPECÍFICOS:
      ${request.requirements}
      
      Por favor:
      1. Analise a integridade dos dados
      2. Identifique dados críticos que precisam de backup
      3. Sugira estratégias de backup
      4. Forneça dados de fallback se necessário
      5. Recomende melhorias na estrutura de dados
      
      Responda com análise detalhada e dados processados.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      return {
        success: true,
        data: backupData,
        analysis: analysis
      };
    } catch (error) {
      logger.error('Erro ao realizar backup de dados', {}, error);
      return {
        success: false,
        error: 'Erro ao coletar dados para backup'
      };
    }
  }

  private async getDatabaseSchema(): Promise<string> {
    try {
      // Retorna o schema do Prisma como string para contexto
      return `
      model User {
        id        String   @id @default(cuid())
        email     String   @unique
        password  String
        name      String
        role      String   @default("USER")
        createdAt DateTime @default(now())
        updatedAt DateTime @updatedAt
      }

      model Client {
        id         String      @id @default(cuid())
        name       String
        email      String      @unique
        phone      String
        address    String
        createdAt  DateTime    @default(now())
        updatedAt  DateTime    @updatedAt
        invoices   Invoice[]
        projects   Project[]
        quotes     Quote[]
        workOrders WorkOrder[]
      }

      model Project {
        id              String           @id @default(cuid())
        name            String
        clientId        String
        quoteId         String?
        startDate       DateTime
        endDate         DateTime?
        status          String           @default("NAO_INICIADO")
        createdAt       DateTime         @default(now())
        updatedAt       DateTime         @updatedAt
        budget          Float?
        description     String?
        progress        Int              @default(0)
        projectExpenses ProjectExpense[]
        projectNotes    ProjectNote[]
        client          Client           @relation(fields: [clientId], references: [id])
        quote           Quote?           @relation(fields: [quoteId], references: [id])
        tasks           Task[]
      }
      
      // ... outros modelos
      `;
    } catch (error) {
      return 'Schema não disponível';
    }
  }

  private async collectSystemData(): Promise<any> {
    try {
      const [users, clients, projects, quotes, invoices] = await Promise.all([
        prisma.user.count(),
        prisma.client.findMany({ take: 5, select: { id: true, name: true, email: true } }),
        prisma.project.findMany({ take: 5, select: { id: true, name: true, status: true } }),
        prisma.quote.findMany({ take: 5, select: { id: true, quoteNumber: true, status: true } }),
        prisma.invoice.findMany({ take: 5, select: { id: true, invoiceNumber: true, status: true } })
      ]);

      return {
        statistics: {
          totalUsers: users,
          totalClients: clients.length,
          totalProjects: projects.length,
          totalQuotes: quotes.length,
          totalInvoices: invoices.length
        },
        sampleData: {
          clients: clients,
          projects: projects,
          quotes: quotes,
          invoices: invoices
        },
        systemHealth: {
          timestamp: new Date().toISOString(),
          status: 'operational'
        }
      };
    } catch (error) {
      logger.error('Erro ao coletar dados do sistema', {}, error);
      return {
        error: 'Erro ao coletar dados',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Método público para verificar se o serviço está disponível
  isAvailable(): boolean {
    return this.isInitialized && this.model !== null;
  }

  // Método para testar a conexão com a API
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.model.generateContent('Responda apenas "OK" se você está funcionando.');
      const response = await result.response;
      return response.text().trim().toUpperCase() === 'OK';
    } catch (error) {
      logger.error('Erro ao testar conexão com Gemini', {}, error);
      return false;
    }
  }
}

export default new GeminiBackupService();