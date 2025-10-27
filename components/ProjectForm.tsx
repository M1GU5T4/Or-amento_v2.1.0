import React, { useState, useEffect } from 'react';
import { Project, Quote, Client, QuoteStatus, InvoiceStatus } from '../types';
import { X, Briefcase, Calendar, User, FileText, Plus, Trash2 } from 'lucide-react';

interface ProjectFormProps {
  project?: Project | null;
  quotes: Quote[];
  clients: Client[];
  onSave: (project: Project) => void;
  onClose: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, quotes, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Não Iniciado' as Project['status'],
    tasks: [] as { id: string; name: string; isCompleted: boolean }[],
    quoteId: '', // Para vincular ao orçamento
  });

  // Filtrar apenas orçamentos aprovados que ainda não viraram projetos
  const approvedQuotes = quotes.filter(quote => 
    quote.status === QuoteStatus.Aprovado
  );

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        clientId: project.clientId,
        startDate: project.startDate,
        endDate: project.endDate || '',
        status: project.status,
        tasks: project.tasks,
        quoteId: '', // Projetos existentes podem não ter quoteId
      });
    }
  }, [project]);

  const handleQuoteSelect = (quoteId: string) => {
    const selectedQuote = quotes.find(q => q.id === quoteId);
    if (selectedQuote) {
      const client = clients.find(c => c.id === selectedQuote.clientId);
      setFormData(prev => ({
        ...prev,
        quoteId,
        clientId: selectedQuote.clientId,
        name: `Projeto - ${selectedQuote.quoteNumber}`,
      }));
    }
  };

  const addTask = () => {
    const newTask = {
      id: `temp-${Date.now()}`, // ID temporário para o frontend
      name: '',
      isCompleted: false,
    };
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const updateTask = (taskId: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, name } : task
      ),
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter status para formato do backend
    const backendStatus = formData.status === 'Não Iniciado' ? 'NAO_INICIADO' : 
                         formData.status === 'Em Andamento' ? 'EM_ANDAMENTO' : 
                         formData.status === 'Concluído' ? 'CONCLUIDO' : 'NAO_INICIADO';

    const projectData: any = {
      name: formData.name.trim(),
      clientId: formData.clientId,
      startDate: formData.startDate, // Já está no formato YYYY-MM-DD
      endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined,
      status: backendStatus,
      tasks: formData.tasks
        .filter(task => task.name.trim() !== '')
        .map(task => ({
          name: task.name.trim(),
          isCompleted: task.isCompleted || false
        })),
    };

    // Só incluir ID se for edição
    if (project?.id) {
      projectData.id = project.id;
    }

    // Validação extra
    if (!projectData.startDate || projectData.startDate.trim() === '') {
      alert('Data de início é obrigatória');
      return;
    }

    if (!projectData.name || projectData.name.trim() === '') {
      alert('Nome do projeto é obrigatório');
      return;
    }

    if (!projectData.clientId) {
      alert('Cliente é obrigatório');
      return;
    }

    console.log('Dados do projeto sendo enviados:', projectData);
    onSave(projectData as Project);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente não encontrado';
  };

  const getQuoteInfo = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return null;
    return {
      number: quote.quoteNumber,
      total: quote.total,
      client: getClientName(quote.clientId),
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {project ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Orçamento (apenas para novos projetos) */}
          {!project && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Selecionar Orçamento Aprovado
              </h3>
              
              {approvedQuotes.length === 0 ? (
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Nenhum orçamento aprovado disponível. Aprove um orçamento primeiro para criar um projeto.
                </p>
              ) : (
                <div className="space-y-2">
                  {approvedQuotes.map(quote => {
                    const quoteInfo = getQuoteInfo(quote.id);
                    return (
                      <label key={quote.id} className="flex items-center p-3 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                        <input
                          type="radio"
                          name="quote"
                          value={quote.id}
                          checked={formData.quoteId === quote.id}
                          onChange={(e) => handleQuoteSelect(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {quote.quoteNumber}
                            </span>
                            <span className="text-green-600 font-semibold">
                              R$ {quote.total.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cliente: {quoteInfo?.client}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Informações do Projeto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Projeto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                disabled={!!formData.quoteId} // Desabilita se um orçamento foi selecionado
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Término (Prevista)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Project['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Não Iniciado">Não Iniciado</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>

          {/* Tarefas */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tarefas do Projeto
              </label>
              <button
                type="button"
                onClick={addTask}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} className="mr-1" />
                Adicionar Tarefa
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.tasks.map((task, index) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateTask(task.id, e.target.value)}
                    placeholder={`Tarefa ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {formData.tasks.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  Nenhuma tarefa adicionada. Clique em "Adicionar Tarefa" para começar.
                </p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.clientId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {project ? 'Atualizar' : 'Criar'} Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;