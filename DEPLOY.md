# 🚀 Guia de Deploy - Remote Viewer System

## 📋 Visão Geral

Este sistema consiste em:
- **Servidor**: Node.js + Socket.IO (deploy no Vercel)
- **Cliente**: Aplicação HTML separada (qualquer navegador)

## 🖥️ Deploy do Servidor no Vercel

### 1. Preparação

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Fazer login na sua conta Vercel
vercel login
```

### 2. Deploy Automático

```bash
# Na pasta do projeto
vercel --prod

# Responder às perguntas:
# - Set up and deploy? → Y
# - Which scope? → Seu usuário/equipe
# - Link to existing project? → N
# - Project name? → remote-viewer-server (ou nome desejado)
# - In which directory is your code located? → ./
# - Want to override the settings? → N
```

### 3. Deploy Manual via GitHub

1. **Fazer push para GitHub**
   ```bash
   git add .
   git commit -m "Initial commit: Remote Viewer Server"
   git push origin main
   ```

2. **Conectar no Vercel**
   - Acessar [vercel.com](https://vercel.com)
   - Clicar "New Project"
   - Importar repositório GitHub
   - Configurar:
     - Framework Preset: `Node.js`
     - Root Directory: `.`
     - Build Command: `npm run vercel-build`
     - Output Directory: `.`
     - Install Command: `npm install`

### 4. Configurações do Vercel

O arquivo `vercel.json` já está configurado com:
- Rotas para API e Socket.IO
- Variáveis de ambiente
- Timeout de função (30s)
- CORS habilitado

## 🔧 Configuração do Cliente

### 1. Usar Cliente de Exemplo

1. **Abrir `client-example.html`**
   - Pode ser em qualquer navegador
   - Não precisa de servidor local

2. **Configurar URL do servidor**
   - Substituir `https://seu-servidor.vercel.app`
   - Pela URL real do seu deploy

3. **Testar conexão**
   - Clicar "Conectar ao Servidor"
   - Verificar status da conexão

### 2. Criar Cliente Personalizado

1. **Copiar `client-example.html`**
2. **Modificar conforme necessário**
3. **Manter Socket.IO connection**
4. **Testar com servidor Vercel**

## 🌐 URLs de Teste

Após o deploy, teste estas URLs:

### Health Check
```
GET https://seu-projeto.vercel.app/api/health
```
**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### Status do Servidor
```
GET https://seu-projeto.vercel.app/api/status
```
**Resposta esperada:**
```json
{
  "status": "online",
  "server": {
    "uptime": 123.45,
    "memory": {...},
    "platform": "linux",
    "nodeVersion": "v18.x.x"
  },
  "connections": {
    "total": 0,
    "clients": 0,
    "viewers": 0
  },
  "streams": {
    "active": 0,
    "details": []
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Lista de Clientes
```
GET https://seu-projeto.vercel.app/api/clients
```
**Resposta esperada:**
```json
{
  "clients": [],
  "count": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔍 Troubleshooting

### Problema: "Function execution timeout"
**Solução**: Verificar se o timeout no `vercel.json` está adequado

### Problema: "CORS error"
**Solução**: Verificar se as configurações CORS estão corretas

### Problema: "Socket.IO connection failed"
**Solução**: Verificar se as rotas do Socket.IO estão configuradas

### Problema: "Build failed"
**Solução**: Verificar se o script `vercel-build` está funcionando

## 📊 Monitoramento

### Logs do Vercel
- Acessar dashboard do projeto
- Ver "Functions" para logs do servidor
- Monitorar execuções e erros

### Métricas
- Tempo de resposta das APIs
- Número de conexões ativas
- Uso de memória e CPU

## 🔐 Segurança

### Configurações Atuais
- Helmet.js habilitado
- CORS configurado
- Rate limiting básico
- Compressão habilitada

### Recomendações
- Implementar autenticação
- Adicionar rate limiting mais robusto
- Configurar HTTPS/WSS
- Monitorar logs de acesso

## 📱 Teste do Sistema

### 1. Deploy do Servidor
```bash
vercel --prod
```

### 2. Testar APIs
```bash
curl https://seu-projeto.vercel.app/api/health
curl https://seu-projeto.vercel.app/api/status
```

### 3. Testar Cliente
- Abrir `client-example.html`
- Configurar URL do servidor
- Conectar e iniciar stream

### 4. Verificar Logs
- Dashboard do Vercel
- Console do navegador
- Logs do servidor

## 🎯 Próximos Passos

1. **Deploy do servidor no Vercel**
2. **Testar APIs de status**
3. **Configurar cliente com URL do servidor**
4. **Testar conexão e stream**
5. **Monitorar logs e métricas**
6. **Implementar melhorias de segurança**

---

**🎉 Seu servidor estará rodando em: `https://seu-projeto.vercel.app`**
