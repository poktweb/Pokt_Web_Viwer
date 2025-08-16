#!/usr/bin/env node

/**
 * Script de build personalizado para o Vercel
 * Este arquivo é executado durante o processo de deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Vercel...');

// Verificar se estamos no ambiente do Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`📦 Ambiente: ${isVercel ? 'Vercel' : 'Local'}`);

// Criar diretórios necessários se não existirem
const dirs = ['server', 'client'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${dir}`);
    }
});

// Verificar se todos os arquivos necessários existem
const requiredFiles = [
    'server/index.js',
    'client/index.html',
    'client/styles.css',
    'client/main.js',
    'client/client.js',
    'client/viewer.js',
    'package.json',
    'vercel.json'
];

let missingFiles = [];
requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.error('❌ Arquivos faltando:', missingFiles);
    process.exit(1);
}

console.log('✅ Todos os arquivos necessários encontrados');

// Verificar dependências
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📋 Nome do projeto: ${packageJson.name}`);
    console.log(`📋 Versão: ${packageJson.version}`);
    console.log(`📋 Dependências: ${Object.keys(packageJson.dependencies).length}`);
} catch (error) {
    console.error('❌ Erro ao ler package.json:', error.message);
}

// Verificar configuração do Vercel
try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log(`📋 Versão do Vercel: ${vercelConfig.version}`);
    console.log(`📋 Builds configurados: ${vercelConfig.builds.length}`);
} catch (error) {
    console.error('❌ Erro ao ler vercel.json:', error.message);
}

// Criar arquivo de status para verificação
const statusFile = {
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    isVercel: isVercel,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
};

fs.writeFileSync('build-status.json', JSON.stringify(statusFile, null, 2));
console.log('📝 Arquivo de status criado: build-status.json');

console.log('🎉 Build concluído com sucesso!');
console.log('📱 O sistema está pronto para deploy no Vercel');
