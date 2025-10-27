-- Script para configurar o banco MySQL no XAMPP
-- Execute este script no phpMyAdmin ou MySQL Workbench

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS erp_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco criado
USE erp_crm;

-- Verificar se o banco foi criado
SHOW TABLES;