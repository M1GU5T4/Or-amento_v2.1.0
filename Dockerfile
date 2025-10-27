# 1. Começamos com uma imagem base do Node.js
FROM node:18-alpine

# 2. Definimos o diretório de trabalho
WORKDIR /app

# 3. Instalamos as dependências do sistema
RUN apk add --no-cache \
    curl \
    git \
    bash \
    mysql-client \
    && rm -rf /var/cache/apk/*

# 4. Copiamos os arquivos de dependências primeiro (para cache otimizado)
COPY package*.json ./
COPY backend/package*.json ./backend/

# 5. Instalamos as dependências do backend
WORKDIR /app/backend
RUN npm ci --only=production

# 6. Instalamos as dependências do frontend
WORKDIR /app
RUN npm ci --only=production

# 7. Copiamos todo o código da aplicação
COPY . .

# 8. Copiamos o .env.example para ser o .env (para a build)
# O .env real será injetado depois
COPY backend/.env.example backend/.env

# 9. Geramos o cliente Prisma
WORKDIR /app/backend
RUN npx prisma generate

# 10. Construímos o frontend para produção
WORKDIR /app
RUN npm run build

# 11. Criamos um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 12. Ajustamos as permissões
RUN chown -R nodejs:nodejs /app
USER nodejs

# 13. Expõe as portas que a aplicação usa
EXPOSE 3001 3002

# 14. Definimos as variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3002
ENV FRONTEND_PORT=3001

# 15. Script de inicialização
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 16. Comando para iniciar a aplicação
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]