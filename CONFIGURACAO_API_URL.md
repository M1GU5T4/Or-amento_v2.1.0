# 🌐 CONFIGURAÇÃO DA URL DA API

## ✅ **Configuração Aplicada**

### 📋 **URL da API Configurada:**
- **Servidor EC2**: `http://18.229.123.73:5000`
- **Porta**: 5000 (conforme especificado)

### 📁 **Arquivos Atualizados:**

#### 1. **`.env` (Raiz do projeto)**
```env
# URL da API para o Frontend (substitua pelo IP da sua instância EC2)
REACT_APP_API_URL="http://18.229.123.73:5000"
VITE_API_URL="http://18.229.123.73:5000"
```

#### 2. **`services/api.ts`**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     import.meta.env.REACT_APP_API_URL || 
                     'http://localhost:3002/api';
```

#### 3. **`.env.local` (Desenvolvimento local)**
```env
# Configurações para desenvolvimento local
REACT_APP_API_URL="http://localhost:3002/api"
VITE_API_URL="http://localhost:3002/api"
```

## 🔧 **Como Funciona**

### **Prioridade das URLs:**
1. **VITE_API_URL** (Vite - framework atual)
2. **REACT_APP_API_URL** (Create React App - compatibilidade)
3. **Fallback**: `http://localhost:3002/api` (desenvolvimento)

### **Ambientes:**

#### **Produção (EC2):**
- Usa: `http://18.229.123.73:5000`
- Arquivo: `.env`

#### **Desenvolvimento Local:**
- Usa: `http://localhost:3002/api`
- Arquivo: `.env.local`

## 🚀 **Deploy e Uso**

### **Para Produção (EC2):**
```bash
# 1. Build do frontend com a URL da EC2
npm run build

# 2. Deploy no servidor
# O frontend irá usar http://18.229.123.73:5000
```

### **Para Desenvolvimento Local:**
```bash
# 1. Usar .env.local para desenvolvimento
npm run dev

# 2. O frontend irá usar http://localhost:3002/api
```

### **Docker:**
```bash
# O Docker usará as variáveis do .env
docker-compose up -d
```

## 🔐 **Configurações de CORS**

### **Backend deve permitir:**
```typescript
// No backend (server.ts)
const allowedOrigins = [
  'http://localhost:3001',      // Desenvolvimento local
  'http://18.229.123.73:8080',  // Frontend na EC2
  'https://seu-dominio.com'     // Produção com domínio
];
```

## 📊 **Verificação**

### **Testar Conexão:**
```bash
# Teste da API
curl http://18.229.123.73:5000/health

# Teste do frontend
curl http://18.229.123.73:8080
```

### **Debug no Browser:**
```javascript
// No console do navegador
console.log('API URL:', import.meta.env.VITE_API_URL);
```

## 🔄 **Alternância de Ambientes**

### **Para alternar entre ambientes:**

#### **Usar EC2 (Produção):**
```bash
# Renomear arquivos
mv .env.local .env.local.backup
# Usar .env com URL da EC2
```

#### **Usar Local (Desenvolvimento):**
```bash
# Usar .env.local
# Ele sobrescreve automaticamente o .env
```

## ⚙️ **Configurações Adicionais**

### **Variáveis Relacionadas:**
```env
# URLs
VITE_API_URL="http://18.229.123.73:5000"
REACT_APP_API_URL="http://18.229.123.73:5000"

# CORS
FRONTEND_URL="http://18.229.123.73:8080"

# Outras configurações
NODE_ENV=production
```

## 🆘 **Troubleshooting**

### **Problemas Comuns:**

1. **CORS Error:**
   - Verificar se backend permite origem do frontend
   - Configurar CORS no servidor

2. **API não responde:**
   - Verificar se backend está rodando na porta 5000
   - Testar: `curl http://18.229.123.73:5000/health`

3. **Variável não carrega:**
   - Reiniciar servidor de desenvolvimento
   - Verificar se variável começa com `VITE_` ou `REACT_APP_`

4. **Build não usa variável:**
   - Verificar se .env está na raiz
   - Rebuild: `npm run build`

## ✅ **Status Final**

- ✅ **URL configurada**: `http://18.229.123.73:5000`
- ✅ **Fallback local**: `http://localhost:3002/api`
- ✅ **Compatibilidade**: Vite + Create React App
- ✅ **Ambientes**: Produção + Desenvolvimento
- ✅ **Arquivos sincronizados**: Todos atualizados

---

**🎯 URL da API configurada com sucesso! Frontend irá conectar no servidor EC2.**

*Configuração aplicada em: ${new Date().toLocaleString('pt-BR')}*