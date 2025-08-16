# 🖥️ Remote Viewer System

Sistema de visualização remota em tempo real desenvolvido em Node.js, similar ao AnyDesk. O **servidor** roda independentemente no Vercel e recebe streams de clientes, enquanto os **clientes** são aplicações separadas que se conectam ao servidor através da URL do Vercel.

## ✨ Funcionalidades

- **Modo Cliente**: Compartilha a tela em tempo real
- **Modo Viewer**: Visualiza telas remotas de outros clientes
- **Streaming em tempo real** via WebSocket
- **Controle de qualidade** (Alta, Média, Baixa)
- **Controle de FPS** (5, 10, 15, 30)
- **Interface responsiva** e moderna
- **Screenshots** automáticos
- **Modo tela cheia**
- **Deploy no Vercel**

## 🚀 Tecnologias

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript ES6+
- **Comunicação**: WebSocket em tempo real
- **Captura de tela**: WebRTC + MediaDevices API
- **Deploy**: Vercel

## 📁 Estrutura do Projeto

```
Teste_Web_Viwer/
├── server/               # 🖥️ SERVIDOR (Deploy no Vercel)
│   ├── index.js         # Servidor principal com Socket.IO
│   └── config.js        # Configurações do servidor
├── client-example.html   # 📱 EXEMPLO DE CLIENTE (Aplicação separada)
├── package.json          # Dependências do servidor
├── vercel.json          # Configuração do Vercel
└── README.md            # Documentação
```

### 🔄 Arquitetura

- **Servidor**: Roda no Vercel, recebe streams via WebSocket
- **Cliente**: Aplicação HTML separada que se conecta ao servidor
- **Comunicação**: Socket.IO em tempo real entre cliente e servidor

## 🛠️ Instalação e Uso

### 🖥️ Servidor (Vercel)

1. **Deploy automático**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Deploy manual**
   - Fazer push para GitHub
   - Conectar repositório no Vercel
   - Configurar build: `npm run vercel-build`

### 📱 Cliente (Aplicação Separada)

1. **Usar o exemplo fornecido**
   - Abrir `client-example.html` em qualquer navegador
   - Configurar URL do servidor Vercel
   - Conectar e iniciar stream

2. **Criar cliente personalizado**
   - Usar `client-example.html` como base
   - Modificar conforme necessidades
   - Conectar ao servidor via Socket.IO

## 🌐 Deploy no Vercel

### 1. Preparar para Deploy

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login
```

### 2. Deploy Automático

```bash
# Deploy
vercel --prod
```

### 3. Configuração Manual

1. Fazer push para GitHub
2. Conectar repositório no Vercel
3. Configurar build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.`
   - Install Command: `npm install`

### 4. URLs de Teste

Após o deploy, você terá:
- **Servidor**: `https://seu-projeto.vercel.app`
- **Health Check**: `https://seu-projeto.vercel.app/api/health`
- **Status**: `https://seu-projeto.vercel.app/api/status`
- **Clientes**: `https://seu-projeto.vercel.app/api/clients`

## 📱 Como Usar

### 🖥️ Servidor

1. **Deploy no Vercel**
   - O servidor roda automaticamente
   - Recebe conexões de clientes via WebSocket
   - Gerencia streams e conexões

2. **Monitoramento**
   - `/api/health` - Status do servidor
   - `/api/status` - Informações detalhadas
   - `/api/clients` - Lista de clientes ativos

### 📱 Cliente

1. **Configurar conexão**
   - Abrir `client-example.html`
   - Inserir URL do servidor Vercel
   - Definir nome do cliente

2. **Iniciar stream**
   - Clicar "Conectar ao Servidor"
   - Configurar qualidade e FPS
   - Clicar "Iniciar Stream"
   - Permitir acesso à tela

3. **Monitorar status**
   - Verificar status da conexão
   - Acompanhar FPS e qualidade
   - Log de eventos em tempo real

## ⚙️ Configurações

### Qualidade de Imagem
- **Alta**: 90% - Melhor qualidade, maior banda
- **Média**: 70% - Equilibrado (padrão)
- **Baixa**: 50% - Menor qualidade, menor banda

### FPS (Frames por Segundo)
- **30 FPS**: Suave, maior banda
- **15 FPS**: Equilibrado (padrão)
- **10 FPS**: Menor banda
- **5 FPS**: Mínimo, menor banda

## 🔧 Variáveis de Ambiente

```bash
# .env (opcional para local)
NODE_ENV=development
PORT=3000

# Vercel (automático)
NODE_ENV=production
PORT=3000
```

## 📊 Monitoramento

### Endpoints de Status

- `GET /api/status` - Status geral do servidor
- `GET /api/health` - Health check para Vercel

### Métricas Disponíveis

- Número de conexões ativas
- Número de streams ativos
- Timestamp de última atualização
- Status de cada cliente/viewer

## 🚨 Limitações e Considerações

### Navegador
- Requer HTTPS para produção (WebRTC)
- Suporte limitado em navegadores antigos
- Permissões de captura de tela necessárias

### Performance
- Qualidade vs. Banda de rede
- FPS vs. CPU do cliente
- Latência de rede afeta experiência

### Segurança
- Sem autenticação por padrão
- Dados transmitidos em texto plano
- Considerar implementar HTTPS/WSS

## 🔮 Melhorias Futuras

- [ ] Autenticação e autorização
- [ ] Criptografia end-to-end
- [ ] Controle remoto de mouse/teclado
- [ ] Gravação de sessões
- [ ] Chat em tempo real
- [ ] Múltiplas telas simultâneas
- [ ] Suporte a dispositivos móveis
- [ ] Métricas avançadas e logs

## 🐛 Troubleshooting

### Problema: "Permissão de captura de tela negada"
**Solução**: Verificar se o navegador tem permissão para acessar a tela

### Problema: "Não foi possível conectar ao servidor"
**Solução**: Verificar se o servidor está rodando e acessível

### Problema: Stream lento ou travado
**Solução**: Reduzir qualidade/FPS ou verificar conexão de rede

### Problema: Erro no Vercel
**Solução**: Verificar logs no dashboard do Vercel

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes

## 🤝 Contribuição

1. Fork o projeto
2. Criar branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abrir issue no GitHub
- Verificar documentação
- Consultar logs do servidor

---

**Desenvolvido com ❤️ usando Node.js e tecnologias web modernas**
