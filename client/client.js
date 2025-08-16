// Módulo do Cliente - Funcionalidades de compartilhamento de tela
class ClientManager {
    constructor() {
        this.socket = null;
        this.streamInterval = null;
        this.isStreaming = false;
        this.clientId = null;
        this.clientName = null;
        this.serverUrl = null;
        this.currentQuality = 'medium';
        this.currentFPS = 30;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.viewerCount = 0;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Listener para mudanças de qualidade
        document.getElementById('quality-select').addEventListener('change', (e) => {
            this.currentQuality = e.target.value;
            this.updateStreamInfo();
        });
        
        // Listener para mudanças de FPS
        document.getElementById('fps-select').addEventListener('change', (e) => {
            this.currentFPS = parseInt(e.target.value);
            if (this.isStreaming) {
                this.restartStream();
            }
        });
    }
    
    async connectAsClient() {
        const clientName = document.getElementById('client-name').value.trim();
        const serverUrl = document.getElementById('server-url').value.trim();
        
        if (!clientName || !serverUrl) {
            showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }
        
        try {
            // Verificar status do servidor primeiro
            const serverStatus = await checkServerStatus(serverUrl);
            if (serverStatus.status !== 'online') {
                showNotification(serverStatus.message, 'error');
                return;
            }
            
            // Conectar via Socket.IO
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });
            
            this.clientName = clientName;
            this.serverUrl = serverUrl;
            
            this.setupSocketEvents();
            
            // Aguardar conexão
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout na conexão'));
                }, 10000);
                
                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
            // Enviar identificação do cliente
            this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.socket.emit('client-connect', {
                clientId: this.clientId,
                clientName: this.clientName
            });
            
            // Atualizar interface
            updateConnectionStatus('client-status', 'Conectado', true);
            document.getElementById('connect-client-btn').disabled = true;
            document.getElementById('stream-controls').style.display = 'block';
            document.getElementById('stream-info').style.display = 'block';
            
            showNotification('Conectado ao servidor com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao conectar:', error);
            showNotification(`Erro na conexão: ${error.message}`, 'error');
            updateConnectionStatus('client-status', 'Erro na conexão', false);
        }
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('disconnect', () => {
            this.handleDisconnection();
        });
        
        this.socket.on('client-status-update', (data) => {
            if (data.clientId === this.clientId) {
                this.updateClientStatus(data);
            }
        });
        
        this.socket.on('remote-command', (data) => {
            if (data.clientId === this.clientId) {
                this.handleRemoteCommand(data);
            }
        });
    }
    
    handleDisconnection() {
        this.isStreaming = false;
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        
        updateConnectionStatus('client-status', 'Desconectado', false);
        document.getElementById('connect-client-btn').disabled = false;
        document.getElementById('stream-controls').style.display = 'none';
        document.getElementById('stream-info').style.display = 'none';
        
        showNotification('Desconectado do servidor', 'warning');
    }
    
    updateClientStatus(data) {
        // Atualizar informações de status do cliente
        console.log('Status atualizado:', data);
    }
    
    handleRemoteCommand(data) {
        // Processar comandos remotos recebidos
        console.log('Comando remoto recebido:', data);
        
        // Aqui você pode implementar ações específicas baseadas no comando
        // Por exemplo: mover mouse, clicar, digitar, etc.
    }
    
    async startScreenStream() {
        if (!this.socket || !this.socket.connected) {
            showNotification('Não conectado ao servidor', 'error');
            return;
        }
        
        try {
            // Verificar se o navegador suporta captura de tela
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                showNotification('Seu navegador não suporta captura de tela', 'error');
                return;
            }
            
            // Solicitar permissão para capturar tela
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            this.isStreaming = true;
            this.frameCount = 0;
            this.lastFrameTime = Date.now();
            
            // Atualizar interface
            document.getElementById('start-stream-btn').style.display = 'none';
            document.getElementById('stop-stream-btn').style.display = 'inline-block';
            document.getElementById('stream-status').textContent = 'Ativo';
            
            // Iniciar captura de frames
            this.startFrameCapture(stream);
            
            showNotification('Stream iniciado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao iniciar stream:', error);
            if (error.name === 'NotAllowedError') {
                showNotification('Permissão de captura de tela negada', 'error');
            } else {
                showNotification(`Erro ao iniciar stream: ${error.message}`, 'error');
            }
        }
    }
    
    startFrameCapture(stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);
        
        const captureFrame = async () => {
            if (!this.isStreaming) return;
            
            try {
                const bitmap = await imageCapture.grabFrame();
                
                // Converter para canvas e comprimir
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                ctx.drawImage(bitmap, 0, 0);
                
                // Comprimir baseado na qualidade selecionada
                const quality = this.getQualityValue();
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Enviar frame para o servidor
                this.socket.emit('screen-stream', {
                    clientId: this.clientId,
                    imageData: dataUrl,
                    timestamp: Date.now(),
                    quality: this.currentQuality
                });
                
                // Atualizar estatísticas
                this.frameCount++;
                const now = Date.now();
                const elapsed = now - this.lastFrameTime;
                
                if (elapsed >= 1000) { // Atualizar FPS a cada segundo
                    const currentFPS = Math.round((this.frameCount * 1000) / elapsed);
                    document.getElementById('current-fps').textContent = currentFPS;
                    this.frameCount = 0;
                    this.lastFrameTime = now;
                }
                
            } catch (error) {
                console.error('Erro ao capturar frame:', error);
            }
        };
        
        // Configurar intervalo baseado no FPS selecionado
        const interval = 1000 / this.currentFPS;
        this.streamInterval = setInterval(captureFrame, interval);
        
        // Capturar primeiro frame imediatamente
        captureFrame();
    }
    
    getQualityValue() {
        switch (this.currentQuality) {
            case 'high': return 0.9;
            case 'medium': return 0.7;
            case 'low': return 0.5;
            default: return 0.7;
        }
    }
    
    stopScreenStream() {
        this.isStreaming = false;
        
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        
        // Atualizar interface
        document.getElementById('start-stream-btn').style.display = 'inline-block';
        document.getElementById('stop-stream-btn').style.display = 'none';
        document.getElementById('stream-status').textContent = 'Parado';
        document.getElementById('current-fps').textContent = '0';
        
        showNotification('Stream parado', 'info');
    }
    
    restartStream() {
        if (this.isStreaming) {
            this.stopScreenStream();
            setTimeout(() => {
                this.startScreenStream();
            }, 100);
        }
    }
    
    updateStreamInfo() {
        document.getElementById('current-quality').textContent = this.currentQuality;
        // Outras atualizações de informação podem ser adicionadas aqui
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.stopScreenStream();
        this.handleDisconnection();
    }
}

// Instanciar gerenciador do cliente
const clientManager = new ClientManager();

// Funções globais para uso no HTML
window.connectAsClient = () => clientManager.connectAsClient();
window.startScreenStream = () => clientManager.startScreenStream();
window.stopScreenStream = () => clientManager.stopScreenStream();

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (clientManager) {
        clientManager.disconnect();
    }
});
