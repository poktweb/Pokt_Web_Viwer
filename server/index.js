const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Armazenar conexões ativas
const activeConnections = new Map();
const screenStreams = new Map();

// Rota para status do servidor
app.get('/api/status', (req, res) => {
  const clients = Array.from(activeConnections.values()).filter(c => c.type === 'client');
  const viewers = Array.from(activeConnections.values()).filter(c => c.type === 'viewer');
  
  res.json({
    status: 'online',
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    connections: {
      total: activeConnections.size,
      clients: clients.length,
      viewers: viewers.length
    },
    streams: {
      active: screenStreams.size,
      details: Array.from(screenStreams.keys())
    },
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Nova conexão: ${socket.id}`);
  
  // Cliente se conectando
  socket.on('client-connect', (data) => {
    const { clientId, clientName } = data;
    
    // Verificar se o clientId já existe
    const existingClient = Array.from(activeConnections.values())
      .find(c => c.type === 'client' && c.clientId === clientId);
    
    if (existingClient) {
      socket.emit('connection-error', { 
        message: 'ClientId já está em uso' 
      });
      return;
    }
    
    activeConnections.set(socket.id, {
      type: 'client',
      clientId,
      clientName,
      connectedAt: new Date(),
      socketId: socket.id
    });
    
    console.log(`Cliente conectado: ${clientName} (${clientId})`);
    
    // Notificar todos os viewers sobre novo cliente
    socket.broadcast.emit('client-list-updated', {
      clients: Array.from(activeConnections.values()).filter(c => c.type === 'client')
    });
    
    // Confirmar conexão
    socket.emit('client-connected', { 
      clientId, 
      clientName,
      message: 'Conectado com sucesso'
    });
  });
  
  // Viewer se conectando
  socket.on('viewer-connect', (data) => {
    const { viewerId, viewerName } = data;
    
    // Verificar se o viewerId já existe
    const existingViewer = Array.from(activeConnections.values())
      .find(c => c.type === 'viewer' && c.viewerId === viewerId);
    
    if (existingViewer) {
      socket.emit('connection-error', { 
        message: 'ViewerId já está em uso' 
      });
      return;
    }
    
    activeConnections.set(socket.id, {
      type: 'viewer',
      viewerId,
      viewerName,
      connectedAt: new Date(),
      socketId: socket.id
    });
    
    console.log(`Viewer conectado: ${viewerName} (${viewerId})`);
    
    // Enviar lista de clientes disponíveis
    const availableClients = Array.from(activeConnections.values())
      .filter(c => c.type === 'client')
      .map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        connectedAt: client.connectedAt,
        isStreaming: screenStreams.has(client.clientId)
      }));
    
    socket.emit('available-clients', availableClients);
    
    // Confirmar conexão
    socket.emit('viewer-connected', { 
      viewerId, 
      viewerName,
      message: 'Conectado com sucesso'
    });
  });
  
  // Receber stream de tela do cliente
  socket.on('screen-stream', (data) => {
    const { clientId, imageData, timestamp, quality } = data;
    
    // Validar dados recebidos
    if (!clientId || !imageData || !timestamp || !quality) {
      socket.emit('stream-error', { 
        message: 'Dados do stream incompletos' 
      });
      return;
    }
    
    // Verificar se o cliente está conectado
    const client = Array.from(activeConnections.values())
      .find(c => c.type === 'client' && c.clientId === clientId);
    
    if (!client) {
      socket.emit('stream-error', { 
        message: 'Cliente não encontrado' 
      });
      return;
    }
    
    // Armazenar stream mais recente
    screenStreams.set(clientId, {
      imageData,
      timestamp,
      quality,
      lastUpdate: new Date(),
      size: imageData.length // Tamanho aproximado dos dados
    });
    
    // Broadcast para todos os viewers
    socket.broadcast.emit('screen-update', {
      clientId,
      imageData,
      timestamp,
      quality
    });
    
    // Confirmar recebimento
    socket.emit('stream-received', { 
      clientId, 
      timestamp,
      message: 'Stream recebido com sucesso'
    });
  });
  
  // Viewer solicitando stream específico
  socket.on('request-stream', (data) => {
    const { clientId } = data;
    const stream = screenStreams.get(clientId);
    
    if (stream) {
      socket.emit('screen-update', {
        clientId,
        imageData: stream.imageData,
        timestamp: stream.timestamp,
        quality: stream.quality
      });
    }
  });
  
  // Controle remoto
  socket.on('remote-control', (data) => {
    const { clientId, action, params } = data;
    
    // Encaminhar comando para o cliente específico
    socket.broadcast.emit('remote-command', {
      clientId,
      action,
      params,
      timestamp: new Date()
    });
  });
  
  // Cliente enviando status
  socket.on('client-status', (data) => {
    const { clientId, status, details } = data;
    
    socket.broadcast.emit('client-status-update', {
      clientId,
      status,
      details,
      timestamp: new Date()
    });
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      if (connection.type === 'client') {
        // Remover streams do cliente
        screenStreams.delete(connection.clientId);
        console.log(`Cliente desconectado: ${connection.clientName} (${connection.clientId})`);
        
        // Notificar viewers sobre cliente desconectado
        socket.broadcast.emit('client-disconnected', {
          clientId: connection.clientId,
          clientName: connection.clientName,
          timestamp: new Date()
        });
      } else {
        console.log(`Viewer desconectado: ${connection.viewerName} (${connection.viewerId})`);
      }
      
      activeConnections.delete(socket.id);
      
      // Notificar outros sobre a desconexão
      socket.broadcast.emit('client-list-updated', {
        clients: Array.from(activeConnections.values()).filter(c => c.type === 'client')
      });
    }
    
    console.log(`Conexão fechada: ${socket.id}`);
  });
});

// Health check para Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota para listar clientes disponíveis
app.get('/api/clients', (req, res) => {
  const clients = Array.from(activeConnections.values())
    .filter(c => c.type === 'client')
    .map(client => ({
      clientId: client.clientId,
      clientName: client.clientName,
      connectedAt: client.connectedAt,
      isStreaming: screenStreams.has(client.clientId)
    }));
  
  res.json({
    clients,
    count: clients.length,
    timestamp: new Date().toISOString()
  });
});

// Rota para informações de um cliente específico
app.get('/api/clients/:clientId', (req, res) => {
  const { clientId } = req.params;
  const client = Array.from(activeConnections.values())
    .find(c => c.type === 'client' && c.clientId === clientId);
  
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }
  
  const streamInfo = screenStreams.get(clientId);
  
  res.json({
    client: {
      clientId: client.clientId,
      clientName: client.clientName,
      connectedAt: client.connectedAt
    },
    stream: streamInfo ? {
      isActive: true,
      quality: streamInfo.quality,
      lastUpdate: streamInfo.lastUpdate,
      timestamp: streamInfo.timestamp
    } : {
      isActive: false
    },
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Remote Viewer Server Iniciado');
  console.log('========================================');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔌 Socket.IO: ${io.engine.clientsCount} conexões`);
  console.log('========================================');
});

// Log de conexões ativas a cada 30 segundos
setInterval(() => {
  const clientCount = Array.from(activeConnections.values()).filter(c => c.type === 'client').length;
  const viewerCount = Array.from(activeConnections.values()).filter(c => c.type === 'viewer').length;
  const streamCount = screenStreams.size;
  
  console.log(`📊 Status: ${clientCount} clientes, ${viewerCount} viewers, ${streamCount} streams ativos`);
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});

module.exports = app;
