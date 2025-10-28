import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, FileText, Bot, Key, Eye, EyeOff, Zap, BarChart3, Code, Wrench } from 'lucide-react';
import LogViewer from './LogViewer.tsx';
import GeminiBackupPanel from './GeminiBackupPanel';
import { settingsService } from '../services/api';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [geminiToken, setGeminiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [tokenMessage, setTokenMessage] = useState('');
  const [showBackupPanel, setShowBackupPanel] = useState(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      if (settings.geminiApiKey) {
        setGeminiToken(settings.geminiApiKey);
        setTokenStatus('valid');
        setTokenMessage('Token carregado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSaveGeminiToken = async () => {
    if (!geminiToken.trim()) {
      setTokenStatus('invalid');
      setTokenMessage('Por favor, insira um token válido');
      return;
    }

    setTokenStatus('testing');
    setTokenMessage('Testando token...');

    try {
      // Testar o token primeiro
      const testResult = await settingsService.testGeminiToken(geminiToken);
      
      if (testResult.valid) {
        // Salvar o token se for válido
        await settingsService.updateSettings({ geminiApiKey: geminiToken });
        setTokenStatus('valid');
        setTokenMessage('Token salvo e validado com sucesso!');
      } else {
        setTokenStatus('invalid');
        setTokenMessage('Token inválido. Verifique se está correto.');
      }
    } catch (error) {
      setTokenStatus('invalid');
      setTokenMessage('Erro ao validar token. Verifique sua conexão.');
    }
  };

  const handleRemoveGeminiToken = async () => {
    try {
      await settingsService.removeGeminiToken();
      setGeminiToken('');
      setTokenStatus('idle');
      setTokenMessage('Token removido com sucesso');
    } catch (error) {
      setTokenMessage('Erro ao remover token');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <SettingsIcon size={16} />
                <span>Configurações</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>Logs do Sistema</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'settings' ? (
        <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Configurações do Sistema
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Perfil do Usuário */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Perfil do Usuário
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue="Administrador"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="admin@orcamento.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notificações
              </h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Notificar sobre novos orçamentos
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Alertas de faturas vencidas
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Relatórios semanais por email
                </span>
              </label>
            </div>
          </div>

          {/* Segurança */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Segurança
              </h3>
            </div>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Alterar Senha
              </button>
              <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                Configurar 2FA
              </button>
            </div>
          </div>

          {/* Aparência */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Aparência
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tema
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuração do Gemini AI */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Gemini AI
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token da API
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={geminiToken}
                    onChange={(e) => setGeminiToken(e.target.value)}
                    placeholder="Cole seu token do Google AI Studio aqui..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {/* Status do Token */}
                {tokenMessage && (
                  <div className={`mt-2 p-2 rounded-md text-sm ${
                    tokenStatus === 'valid' 
                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                      : tokenStatus === 'invalid'
                      ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      : tokenStatus === 'testing'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center">
                      {tokenStatus === 'testing' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      )}
                      {tokenStatus === 'valid' && <Key className="h-4 w-4 mr-2" />}
                      {tokenMessage}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleSaveGeminiToken}
                    disabled={tokenStatus === 'testing'}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors text-sm"
                  >
                    {tokenStatus === 'testing' ? 'Testando...' : 'Salvar Token'}
                  </button>
                  {geminiToken && (
                    <button
                      onClick={handleRemoveGeminiToken}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {/* Instruções */}
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Como obter seu token:</strong>
                  </p>
                  <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 dark:text-purple-400">Google AI Studio</a></li>
                    <li>Faça login com sua conta Google</li>
                    <li>Clique em "Create API Key"</li>
                    <li>Copie o token gerado e cole aqui</li>
                  </ol>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    ⚠️ Mantenha seu token seguro e não o compartilhe com terceiros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Backup IA */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assistente IA - Backup & Suporte
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistema inteligente de backup e assistência para completar funcionalidades
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBackupPanel(true)}
              disabled={tokenStatus !== 'valid'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Bot className="h-4 w-4" />
              <span>Abrir Assistente</span>
            </button>
          </div>
          
          {tokenStatus !== 'valid' && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ Configure um token válido do Gemini para usar o assistente IA
              </p>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span>Análise de Dados</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Code className="h-4 w-4 text-green-500" />
              <span>Geração de Código</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4 text-purple-500" />
              <span>Backup Inteligente</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Wrench className="h-4 w-4 text-red-500" />
              <span>Resolução de Erros</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-8 flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Versão:</span>
            <span className="ml-2 text-gray-900 dark:text-white">2.1.0</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Banco:</span>
            <span className="ml-2 text-gray-900 dark:text-white">MySQL (XAMPP)</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Última atualização:</span>
            <span className="ml-2 text-gray-900 dark:text-white">26/10/2025</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className="ml-2 text-green-600">Online</span>
          </div>
        </div>
      </div>
        </div>
      ) : (
        <LogViewer />
      )}

      {/* Painel de Backup IA */}
      {showBackupPanel && (
        <GeminiBackupPanel onClose={() => setShowBackupPanel(false)} />
      )}
    </div>
  );
};

export default Settings;