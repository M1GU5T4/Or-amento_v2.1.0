import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Aumentar o limite de aviso para chunks grandes
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            // Configuração manual de chunks para otimizar o bundle
            manualChunks: {
              // Separar React e ReactDOM em um chunk próprio
              'react-vendor': ['react', 'react-dom'],
              
              // Separar bibliotecas de UI em um chunk
              'ui-vendor': ['lucide-react'],
              
              // Separar bibliotecas de gráficos
              'chart-vendor': ['recharts'],
              
              // Separar componentes principais do app
              'app-core': [
                './App.tsx',
                './components/Sidebar.tsx',
                './components/Dashboard.tsx'
              ],
              
              // Separar componentes de formulários
              'forms': [
                './components/ClientForm.tsx',
                './components/ProjectForm.tsx',
                './components/QuoteForm.tsx',
                './components/InvoiceForm.tsx',
                './components/WorkOrderForm.tsx'
              ],
              
              // Separar componentes de listagem
              'lists': [
                './components/ClientList.tsx',
                './components/ProjectList.tsx',
                './components/QuoteList.tsx',
                './components/InvoiceList.tsx',
                './components/WorkOrderList.tsx',
                './components/ExpenseList.tsx'
              ],
              
              // Separar componentes de estoque
              'stock': [
                './components/Stock.tsx',
                './components/StockItemForm.tsx',
                './components/StockCategoryForm.tsx',
                './components/StockMovementForm.tsx',
                './components/AddItemModal.tsx'
              ],
              
              // Separar serviços e utilitários
              'services': [
                './services/api.ts',
                './services/logger.ts'
              ]
            },
            
            // Configurar nomes de arquivos para melhor cache
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
              return `js/[name]-[hash].js`;
            },
            
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },
        
        // Otimizações adicionais
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        }
      }
    };
});
