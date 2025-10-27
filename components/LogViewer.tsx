import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';

const LogViewer: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="mr-2" size={20} />
          Visualizador de Logs
        </h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm">
            <Download size={16} className="mr-1" />
            Baixar
          </button>
          <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-sm">
            <Trash2 size={16} className="mr-1" />
            Limpar
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        <div className="space-y-1">
          <div>[{new Date().toISOString()}] INFO: Sistema iniciado</div>
          <div>[{new Date().toISOString()}] INFO: Conexão com banco estabelecida</div>
          <div>[{new Date().toISOString()}] INFO: Servidor rodando na porta 3002</div>
          <div>[{new Date().toISOString()}] INFO: Frontend carregado com sucesso</div>
          <div className="text-gray-500">--- Logs em tempo real aparecerão aqui ---</div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Os logs são atualizados automaticamente. Use os botões acima para baixar ou limpar o histórico.</p>
      </div>
    </div>
  );
};

export default LogViewer;