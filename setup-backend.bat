@echo off
echo Configurando Backend...

cd backend

echo Gerando Prisma Client...
npx prisma generate --schema=prisma/schema.prisma

echo Criando banco de dados...
npx prisma db push --schema=prisma/schema.prisma

echo Populando com dados de teste...
npx tsx src/prisma/seed.ts

echo Backend configurado!
echo.
echo Para iniciar: npm run dev

pause