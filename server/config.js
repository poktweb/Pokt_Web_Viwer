module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // Configurações do Socket.IO
  socket: {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8 // 100MB
  },
  
  // Configurações de segurança
  security: {
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    },
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      level: 6
    }
  },
  
  // Configurações de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite por IP
  },
  
  // Configurações de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: process.env.LOG_TIMESTAMP !== 'false',
    interval: 30000 // intervalo para logs de status (30s)
  },
  
  // Configurações de performance
  performance: {
    maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '50mb',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000
  }
};
