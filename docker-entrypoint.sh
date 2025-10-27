#!/bin/bash
set -e

echo "🚀 Iniciando Sistema de Gestão Empresarial v2.1.0"

# Aguarda o banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
while ! mysqladmin ping -h"${DB_HOST:-localhost}" -P"${DB_PORT:-3306}" -u"${DB_USER:-root}" -p"${DB_PASSWORD:-}" --silent; do
    echo "⏳ Banco de dados não está pronto. Aguardando..."
    sleep 2
done

echo "✅ Banco de dados conectado!"

# Navega para o diretório do backend
cd /app/backend

# Executa as migrações do banco
echo "🔄 Executando migrações do banco..."
npx prisma db push --accept-data-loss

# Executa o seed se necessário
if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "🌱 Executando seed do banco..."
    npx prisma db seed
fi

echo "✅ Banco de dados configurado!"

# Volta para o diretório raiz
cd /app

# Inicia a aplicação
echo "🚀 Iniciando aplicação..."
exec "$@"