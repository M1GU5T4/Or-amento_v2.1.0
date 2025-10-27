import React, { useState } from 'react';
import { Quote, Client, QuoteStatus } from '../types';
import { quoteService } from '../services/api';
import { logger } from '../services/logger';
import { Edit, Trash2, FileCheck2, FolderPlus, X, Download } from 'lucide-react';

interface QuoteListProps {
  quotes: Quote[];
  clients: Client[];
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

const statusColors: { [key in QuoteStatus]: string } = {
  [QuoteStatus.Rascunho]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  [QuoteStatus.Enviado]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  [QuoteStatus.Aprovado]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  [QuoteStatus.Rejeitado]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const QuoteList: React.FC<QuoteListProps> = ({ quotes, clients, onEdit, onDelete, onRefresh }) => {
  const [showProjectModal, setShowProjectModal] = useState<string | null>(null);
  const [projectData, setProjectData] = useState({
    projectName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });
  const [converting, setConverting] = useState(false);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente não encontrado';
  };
  
  const handleConvertToInvoice = (quoteId: string) => {
    alert(`Funcionalidade para converter o orçamento ${quoteId} em fatura.`);
    // Lógica para converter o orçamento em fatura seria implementada aqui
  };

  const handleConvertToProject = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    setProjectData({
      projectName: `Projeto - ${quote.quoteNumber}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: quote.notes || `Projeto criado a partir do orçamento ${quote.quoteNumber}`
    });
    setShowProjectModal(quoteId);
  };

  const confirmConvertToProject = async () => {
    if (!showProjectModal) return;

    try {
      setConverting(true);
      logger.info('QUOTE_LIST', 'CONVERT_TO_PROJECT_START', { quoteId: showProjectModal });

      await quoteService.convertToProject(showProjectModal, projectData);
      
      logger.info('QUOTE_LIST', 'CONVERT_TO_PROJECT_SUCCESS', { quoteId: showProjectModal });
      alert('Orçamento convertido em projeto com sucesso!');
      
      setShowProjectModal(null);
      if (onRefresh) onRefresh();
      
    } catch (error) {
      logger.error('QUOTE_LIST', 'CONVERT_TO_PROJECT_ERROR', { quoteId: showProjectModal }, error);
      console.error('Erro ao converter orçamento em projeto:', error);
      alert('Erro ao converter orçamento em projeto. Tente novamente.');
    } finally {
      setConverting(false);
    }
  };

  const handleGeneratePDF = async (quoteId: string) => {
    try {
      logger.info('QUOTE_LIST', 'GENERATE_PDF_START', { quoteId });
      console.log('Iniciando geração de PDF para:', quoteId);
      
      const response = await quoteService.generatePDF(quoteId);
      console.log('Resposta recebida:', response.status, response.statusText);
      console.log('Headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        console.log('Convertendo para blob...');
        const blob = await response.blob();
        console.log('Blob criado:', blob.size, 'bytes, tipo:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        console.log('URL criada:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `orcamento-${quotes.find(q => q.id === quoteId)?.quoteNumber || quoteId}.pdf`;
        console.log('Nome do arquivo:', a.download);
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        logger.info('QUOTE_LIST', 'GENERATE_PDF_SUCCESS', { quoteId });
        console.log('PDF baixado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('Erro HTTP:', response.status, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logger.error('QUOTE_LIST', 'GENERATE_PDF_ERROR', { quoteId }, error);
      console.error('Erro detalhado ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-gray-500 dark:text-gray-400">Nenhum orçamento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Orçamento #</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Validade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {quotes.map(quote => (
              <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[quote.status]}`}>{quote.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{quote.quoteNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {getClientName(quote.clientId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(quote.expiryDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                  R$ {quote.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                      {/* Botão de gerar PDF - disponível para todos os orçamentos */}
                      <button 
                        onClick={() => handleGeneratePDF(quote.id)} 
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" 
                        title="Gerar PDF"
                      >
                        <Download size={18} />
                      </button>
                      
                      {quote.status === QuoteStatus.Aprovado && (
                        <>
                          <button 
                            onClick={() => handleConvertToProject(quote.id)} 
                            className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors" 
                            title="Converter em Projeto"
                          >
                            <FolderPlus size={18} />
                          </button>
                          <button 
                            onClick={() => handleConvertToInvoice(quote.id)} 
                            className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors" 
                            title="Converter em Fatura"
                          >
                            <FileCheck2 size={18} />
                          </button>
                        </>
                      )}
                      <button onClick={() => onEdit(quote)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Edit size={18} />
                      </button>
                      <button onClick={() => onDelete(quote.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                          <Trash2 size={18} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Conversão para Projeto */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Converter em Projeto</h2>
              <button 
                onClick={() => setShowProjectModal(null)} 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={projectData.projectName}
                  onChange={(e) => setProjectData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nome do projeto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={projectData.startDate}
                    onChange={(e) => setProjectData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={projectData.endDate}
                    onChange={(e) => setProjectData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
                  placeholder="Descrição do projeto"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowProjectModal(null)} 
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={converting}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmConvertToProject} 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={converting || !projectData.projectName.trim()}
              >
                {converting ? 'Convertendo...' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteList;
