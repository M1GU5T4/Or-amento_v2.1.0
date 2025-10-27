import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export interface ProjectWithStats {
  id: string;
  name: string;
  clientId: string;
  quoteId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status: string;
  budget?: number | null;
  description?: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  client: any;
  quote?: any;
  tasks: any[];
  projectExpenses: any[];
  projectNotes: any[];
  taskProgress: number;
  totalExpenses: number;
  remainingBudget: number;
  completedTasks: number;
  totalTasks: number;
}

class ProjectService {
  async getProjectById(id: string): Promise<ProjectWithStats | null> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              total: true
            }
          },
          tasks: true,
          projectExpenses: {
            orderBy: { date: 'desc' }
          },
          projectNotes: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!project) {
        return null;
      }

      // Calcular estatísticas
      const completedTasks = project.tasks.filter(task => task.isCompleted).length;
      const totalTasks = project.tasks.length;
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const totalExpenses = project.projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remainingBudget = (project.budget || 0) - totalExpenses;

      return {
        ...project,
        taskProgress,
        totalExpenses,
        remainingBudget,
        completedTasks,
        totalTasks
      };
    } catch (error) {
      logger.error('Erro ao buscar projeto por ID', { projectId: id }, error);
      throw error;
    }
  }

  async getAllProjects() {
    try {
      const projects = await prisma.project.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              total: true
            }
          },
          tasks: true,
          projectExpenses: true,
          _count: {
            select: {
              tasks: true,
              projectExpenses: true,
              projectNotes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Adicionar estatísticas para cada projeto
      return projects.map(project => {
        const completedTasks = project.tasks.filter(task => task.isCompleted).length;
        const totalTasks = project.tasks.length;
        const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const totalExpenses = project.projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remainingBudget = (project.budget || 0) - totalExpenses;

        return {
          ...project,
          taskProgress,
          totalExpenses,
          remainingBudget,
          completedTasks,
          totalTasks
        };
      });
    } catch (error) {
      logger.error('Erro ao buscar todos os projetos', {}, error);
      throw error;
    }
  }

  async createProject(data: any) {
    try {
      logger.info('Criando novo projeto', { projectName: data.name });

      const project = await prisma.project.create({
        data: {
          name: data.name,
          clientId: data.clientId,
          quoteId: data.quoteId || null,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: data.status || 'NAO_INICIADO',
          budget: data.budget || null,
          description: data.description || null,
          progress: data.progress || 0,
          tasks: data.tasks ? {
            create: data.tasks.map((task: any) => ({
              name: task.name,
              isCompleted: task.isCompleted || false
            }))
          } : undefined
        },
        include: {
          client: true,
          quote: true,
          tasks: true,
          projectExpenses: true,
          projectNotes: true
        }
      });

      logger.info('Projeto criado com sucesso', { projectId: project.id });
      return project;
    } catch (error) {
      logger.error('Erro ao criar projeto', { projectData: data }, error);
      throw error;
    }
  }

  async updateProject(id: string, data: any) {
    try {
      logger.info('Atualizando projeto', { projectId: id });

      const project = await prisma.project.update({
        where: { id },
        data: {
          name: data.name,
          clientId: data.clientId,
          quoteId: data.quoteId || null,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: data.status,
          budget: data.budget || null,
          description: data.description || null,
          progress: data.progress || 0
        },
        include: {
          client: true,
          quote: true,
          tasks: true,
          projectExpenses: true,
          projectNotes: true
        }
      });

      logger.info('Projeto atualizado com sucesso', { projectId: id });
      return project;
    } catch (error) {
      logger.error('Erro ao atualizar projeto', { projectId: id, projectData: data }, error);
      throw error;
    }
  }

  async deleteProject(id: string) {
    try {
      logger.info('Deletando projeto', { projectId: id });

      await prisma.project.delete({
        where: { id }
      });

      logger.info('Projeto deletado com sucesso', { projectId: id });
    } catch (error) {
      logger.error('Erro ao deletar projeto', { projectId: id }, error);
      throw error;
    }
  }

  async updateTaskStatus(projectId: string, taskId: string, isCompleted: boolean) {
    try {
      const task = await prisma.task.update({
        where: { 
          id: taskId,
          projectId: projectId 
        },
        data: { isCompleted }
      });

      // Recalcular progresso do projeto
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { tasks: true }
      });

      if (project) {
        const completedTasks = project.tasks.filter(t => t.isCompleted).length;
        const totalTasks = project.tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        await prisma.project.update({
          where: { id: projectId },
          data: { progress }
        });
      }

      logger.info('Status da tarefa atualizado', { projectId, taskId, isCompleted });
      return task;
    } catch (error) {
      logger.error('Erro ao atualizar status da tarefa', { projectId, taskId }, error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();