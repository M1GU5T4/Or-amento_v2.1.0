import React from 'react';
import { Project, Client, Task } from '../types';
import { Briefcase, User, CheckSquare, Square, Edit, Trash2, Eye, Clock, DollarSign } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  clients: Client[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetails: (projectId: string) => void;
}

const ProjectCard: React.FC<{ 
  project: Project; 
  clientName: string; 
  onEdit: (project: Project) => void; 
  onDelete: (id: string) => void;
  onViewDetails: (projectId: string) => void;
}> = ({ project, clientName, onEdit, onDelete, onViewDetails }) => {
    const completedTasks = project.tasks?.filter(t => t.isCompleted).length || 0;
    const totalTasks = project.tasks?.length || 0;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const getTimeRemaining = () => {
        if (!project.endDate) return null;
        
        const now = new Date();
        const endDate = new Date(project.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)}d atraso`, isOverdue: true };
        } else if (diffDays === 0) {
            return { text: 'Termina hoje', isOverdue: false };
        } else {
            return { text: `${diffDays}d restantes`, isOverdue: false };
        }
    };

    const timeRemaining = getTimeRemaining();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden p-5">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{project.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <User size={14} /> {clientName}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
                        project.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                    }`}>
                        {project.status.replace('_', ' ')}
                    </span>
                    <button
                        onClick={() => onViewDetails(project.id)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Ver detalhes"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(project)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Editar projeto"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(project.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Excluir projeto"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            
            {/* Informações do projeto */}
            <div className="mt-4 space-y-3">
                {/* Progresso geral */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>

                {/* Informações adicionais */}
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <CheckSquare size={14} />
                        <span>{completedTasks}/{totalTasks} tarefas</span>
                    </div>
                    {project.totalExpenses !== undefined && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <DollarSign size={14} />
                            <span>{formatCurrency(project.totalExpenses)}</span>
                        </div>
                    )}
                </div>

                {/* Cronômetro */}
                {timeRemaining && (
                    <div className={`flex items-center gap-1 text-sm ${
                        timeRemaining.isOverdue ? 'text-red-600' : 'text-green-600'
                    }`}>
                        <Clock size={14} />
                        <span>{timeRemaining.text}</span>
                    </div>
                )}
            </div>

            {/* Tarefas resumidas */}
            {project.tasks && project.tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Tarefas Recentes</h4>
                    <ul className="space-y-1 max-h-20 overflow-y-auto">
                        {project.tasks.slice(0, 3).map(task => (
                            <li key={task.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                {task.isCompleted ? <CheckSquare size={12} className="text-green-500" /> : <Square size={12} className="text-gray-400" />}
                                <span className={`truncate ${task.isCompleted ? 'line-through' : ''}`}>{task.name}</span>
                            </li>
                        ))}
                        {project.tasks.length > 3 && (
                            <li className="text-xs text-gray-400 italic">
                                +{project.tasks.length - 3} mais tarefas...
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};


const ProjectList: React.FC<ProjectListProps> = ({ projects, clients, onEdit, onDelete, onViewDetails }) => {
  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-gray-500 dark:text-gray-400">Nenhum projeto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          clientName={getClientName(project.clientId)} 
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default ProjectList;
