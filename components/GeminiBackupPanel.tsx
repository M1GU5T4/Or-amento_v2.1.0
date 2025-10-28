import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Shield, 
  Code, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Loader, 
  Download,
  Wrench,
  FileText,
  Zap
} from 'lucide-react';
import geminiBackupService, { GeminiStatus, GeminiBackupResponse } from '../services/geminiBackupService';

interface GeminiBackupPanelProps {
  onClose: () => void;
}

const GeminiBackupPanel: React.FC<GeminiBackupPanelProps> = ({ onClose }) => {
  const [status, setStatus] = useState<GeminiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'analyze' | 'generate' | 'resolve' | 'backup'>('status');
  const [result, setResult] = useState<GeminiBackupResponse | null>(null);

  // Estados para diferentes funcionalidades
  const [analysisData, setAnalysisData] = useState('');
  const [analysisQuestion, setAnalysisQuestion] = useState('');
  const [codeRequirements, setCodeRequirements] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('TypeScript');
  const [errorDescription, setErrorDescription] = useState('');
  const [errorLogs, setErrorLogs] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const statusData = await geminiBackupService.getStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeData = async () => {
    if (!analysisData || !analysisQuestion) return;

    setLoading(true);
    try {
      let data;
      try {
        data = JSON.parse(analysisData);
      } catch {
        data = analysisData;
      }

      const response = await geminiBackupService.analyzeData(data, analysisQuestion);
      setResult(response);
    } catch (error) {
      console.error('Erro na análise:', error);
      setResult({
        success: false,
        error: 'Erro ao processar análise'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!codeRequirements) return;

    setLoading(true);
    try {
      const response = await geminiBackupService.generateCode(
        codeRequirements,
        {},
        codeLanguage
      );
      setResult(response);
    } catch (error) {
      console.error('Erro na geração de código:', error);
      setResult({
        success: false,
        error: 'Erro ao gerar código'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async () => {
    if (!errorDescription) return;

    setLoading(true);
    try {
      const response = await geminiBackupService.resolveError(
        errorLogs,
        {},
        errorDescription
      );
      setResult(response);
    } catch (error) {
      console.error('Erro na resolução:', error);
      setResult({
        success: false,
        error: 'Erro ao resolver problema'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullBackup = async () => {
    setLoading(true);
    try {
      const response = await geminiBackupService.performFullBackup(true);
      setResult(response);
    } catch (error) {
      console.error('Erro no backup:', error);
      setResult({
        success: false,
        error: 'Erro ao realizar backup'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status do Serviço de Backup IA</h3>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${status.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-2">
              {status.available ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                {status.available ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Serviço de backup</p>
          </div>

          <div className={`p-4 rounded-lg border ${status.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center space-x-2">
              {status.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">
                {status.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">API Gemini</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Funcionalidades Disponíveis</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Análise inteligente de dados</span>
          </li>
          <li className="flex items-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Geração automática de código</span>
          </li>
          <li className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Resolução de erros e problemas</span>
          </li>
          <li className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Backup completo do sistema</span>
          </li>
          <li className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Completar funcionalidades faltantes</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderAnalyzeTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Análise de Dados</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dados para Análise (JSON ou texto)
        </label>
        <textarea
          value={analysisData}
          onChange={(e) => setAnalysisData(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='{"vendas": [1000, 1200, 900], "mes": "novembro"}'
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pergunta/Análise Desejada
        </label>
        <input
          type="text"
          value={analysisQuestion}
          onChange={(e) => setAnalysisQuestion(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Analise as vendas e forneça insights sobre tendências"
        />
      </div>

      <button
        onClick={handleAnalyzeData}
        disabled={loading || !analysisData || !analysisQuestion}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
        <span>{loading ? 'Analisando...' : 'Analisar Dados'}</span>
      </button>
    </div>
  );

  const renderGenerateTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Geração de Código</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Linguagem/Framework
        </label>
        <select
          value={codeLanguage}
          onChange={(e) => setCodeLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="React">React</option>
          <option value="Node.js">Node.js</option>
          <option value="Python">Python</option>
          <option value="SQL">SQL</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requisitos do Código
        </label>
        <textarea
          value={codeRequirements}
          onChange={(e) => setCodeRequirements(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Crie uma função que calcule o total de vendas por mês, com validação de dados e tratamento de erros"
        />
      </div>

      <button
        onClick={handleGenerateCode}
        disabled={loading || !codeRequirements}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
        <span>{loading ? 'Gerando...' : 'Gerar Código'}</span>
      </button>
    </div>
  );

  const renderResolveTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resolução de Problemas</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Problema
        </label>
        <textarea
          value={errorDescription}
          onChange={(e) => setErrorDescription(e.target.value)}
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descreva o problema que está enfrentando..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logs de Erro (opcional)
        </label>
        <textarea
          value={errorLogs}
          onChange={(e) => setErrorLogs(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cole aqui os logs de erro, stack traces, ou mensagens de erro..."
        />
      </div>

      <button
        onClick={handleResolveError}
        disabled={loading || !errorDescription}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
        <span>{loading ? 'Resolvendo...' : 'Resolver Problema'}</span>
      </button>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Backup Completo</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Backup Inteligente</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Este processo irá coletar dados do sistema, analisá-los com IA e fornecer 
              insights detalhados sobre o estado atual, possíveis melhorias e backup dos dados críticos.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleFullBackup}
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>{loading ? 'Realizando Backup...' : 'Iniciar Backup Completo'}</span>
      </button>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="mt-6 border-t pt-6">
        <h4 className="font-semibold mb-3">Resultado:</h4>
        
        {result.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                {result.analysis && (
                  <div className="mb-3">
                    <h5 className="font-medium text-green-900 mb-2">Análise:</h5>
                    <pre className="text-sm text-green-800 whitespace-pre-wrap bg-white p-3 rounded border">
                      {typeof result.analysis === 'string' ? result.analysis : JSON.stringify(result.analysis, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.code && (
                  <div className="mb-3">
                    <h5 className="font-medium text-green-900 mb-2">Código Gerado:</h5>
                    <pre className="text-sm text-green-800 whitespace-pre-wrap bg-white p-3 rounded border font-mono">
                      {result.code}
                    </pre>
                  </div>
                )}
                
                {result.data && (
                  <div className="mb-3">
                    <h5 className="font-medium text-green-900 mb-2">Dados:</h5>
                    <pre className="text-sm text-green-800 whitespace-pre-wrap bg-white p-3 rounded border">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-red-900">Erro:</h5>
                <p className="text-sm text-red-800 mt-1">{result.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: Bot },
    { id: 'analyze', label: 'Analisar', icon: BarChart3 },
    { id: 'generate', label: 'Gerar Código', icon: Code },
    { id: 'resolve', label: 'Resolver', icon: Wrench },
    { id: 'backup', label: 'Backup', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Assistente IA - Backup & Suporte</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex">
          <div className="w-48 bg-gray-50 border-r">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'status' && renderStatusTab()}
            {activeTab === 'analyze' && renderAnalyzeTab()}
            {activeTab === 'generate' && renderGenerateTab()}
            {activeTab === 'resolve' && renderResolveTab()}
            {activeTab === 'backup' && renderBackupTab()}
            
            {renderResult()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiBackupPanel;