-- Script para verificar todas as tabelas criadas no MySQL
USE erp_crm;

-- Mostrar todas as tabelas
SHOW TABLES;

-- Verificar estrutura de cada tabela
DESCRIBE users;
DESCRIBE clients;
DESCRIBE work_orders;
DESCRIBE quotes;
DESCRIBE invoices;
DESCRIBE line_items;
DESCRIBE projects;
DESCRIBE tasks;
DESCRIBE expenses;

-- Contar registros em cada tabela
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'clients' as tabela, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'work_orders' as tabela, COUNT(*) as registros FROM work_orders
UNION ALL
SELECT 'quotes' as tabela, COUNT(*) as registros FROM quotes
UNION ALL
SELECT 'invoices' as tabela, COUNT(*) as registros FROM invoices
UNION ALL
SELECT 'line_items' as tabela, COUNT(*) as registros FROM line_items
UNION ALL
SELECT 'projects' as tabela, COUNT(*) as registros FROM projects
UNION ALL
SELECT 'tasks' as tabela, COUNT(*) as registros FROM tasks
UNION ALL
SELECT 'expenses' as tabela, COUNT(*) as registros FROM expenses;