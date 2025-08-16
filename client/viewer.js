// Módulo do Viewer - Funcionalidades de visualização remota
class ViewerManager {
    constructor() {
        this.socket = null;
        this.viewerId = null;
        this.viewerName = null;
        this.serverUrl = null;
        this.currentClient = null;
        this.availableClients = [];
        this.screenCanvas = null;
        this.ctx = null;
        this.isConnected = false;
        
        this.initializeCanvas();
        this.initializeEventListeners();
    }
    
    initializeCanvas() {
        this.screenCanvas = document.getElementById('screen-canvas');
        this.ctx = this.screenCanvas.getContext('2d');
        
        // Configurar canvas inicial
        this.screenCanvas.width = 800;
        this.screenCanvas.height = 600;
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Aguardando conexão...', this.screenCanvas.width / 2, this.screenCanvas.height / 2);
    }
    
    initializeEventListeners() {
        // Listener para mudanças no nome do viewer
        document.getElementById('viewer-name').addEventListener('change', (e) => {
            this.viewerName = e.target.value;
        });
        
        // Listener para mudanças na URL do servidor
        document.getElementById('viewer-server-url').addEventListener('change', (e) => {
            this.serverUrl = e.target.value;
        });
    }
    
    async connectAsViewer() {
        const viewerName = document.getElementById('viewer-name').value.trim();
        const serverUrl = document.getElementById('viewer-server-url').value.trim();
        
        if (!viewerName || !serverUrl) {
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
            
            this.viewerName = viewerName;
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
            
            // Enviar identificação do viewer
            this.viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.socket.emit('viewer-connect', {
                viewerId: this.viewerId,
                viewerName: this.viewerName
            });
            
            // Atualizar interface
            updateConnectionStatus('viewer-status', 'Conectado', true);
            document.getElementById('connect-viewer-btn').disabled = true;
            document.getElementById('client-list').style.display = 'block';
            
            this.isConnected = true;
            showNotification('Conectado ao servidor com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao conectar:', error);
            showNotification(`Erro na conexão: ${error.message}`, 'error');
            updateConnectionStatus('viewer-status', 'Erro na conexão', false);
        }
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('disconnect', () => {
            this.handleDisconnection();
        });
        
        this.socket.on('available-clients', (clients) => {
            this.updateAvailableClients(clients);
        });
        
        this.socket.on('client-list-updated', (data) => {
            this.updateAvailableClients(data.clients);
        });
        
        this.socket.on('screen-update', (data) => {
            this.handleScreenUpdate(data);
        });
        
        this.socket.on('client-status-update', (data) => {
            this.updateClientStatus(data);
        });
    }
    
    handleDisconnection() {
        this.isConnected = false;
        this.currentClient = null;
        
        updateConnectionStatus('viewer-status', 'Desconectado', false);
        document.getElementById('connect-viewer-btn').disabled = false;
        document.getElementById('client-list').style.display = 'none';
        document.getElementById('screen-display').style.display = 'none';
        
        // Resetar canvas
        this.initializeCanvas();
        
        showNotification('Desconectado do servidor', 'warning');
    }
    
    updateAvailableClients(clients) {
        this.availableClients = clients;
        this.renderClientList();
    }
    
    renderClientList() {
        const container = document.getElementById('clients-container');
        
        if (this.availableClients.length === 0) {
            container.innerHTML = '<p class="no-clients">Nenhum cliente disponível no momento</p>';
            return;
        }
        
        container.innerHTML = this.availableClients.map(client => `
            <div class="client-item">
                <div class="client-info">
                    <div class="client-name">${client.clientName}</div>
                    <div class="client-status">Conectado desde ${formatTimestamp(client.connectedAt)}</div>
                </div>
                <button class="connect-btn" onclick="viewerManager.connectToClient('${client.clientId}', '${client.clientName}')">
                    Conectar
                </button>
            </div>
        `).join('');
    }
    
    async connectToClient(clientId, clientName) {
        if (!this.socket || !this.isConnected) {
            showNotification('Não conectado ao servidor', 'error');
            return;
        }
        
        try {
            this.currentClient = { id: clientId, name: clientName };
            
            // Solicitar stream do cliente
            this.socket.emit('request-stream', { clientId });
            
            // Mostrar tela de visualização
            document.getElementById('client-list').style.display = 'none';
            document.getElementById('screen-display').style.display = 'block';
            document.getElementById('current-client-name').textContent = clientName;
            
            showNotification(`Conectado ao cliente: ${clientName}`, 'success');
            
        } catch (error) {
            console.error('Erro ao conectar ao cliente:', error);
            showNotification(`Erro ao conectar ao cliente: ${error.message}`, 'error');
        }
    }
    
    disconnectFromClient() {
        this.currentClient = null;
        
        document.getElementById('client-list').style.display = 'block';
        document.getElementById('screen-display').style.display = 'none';
        
        // Resetar canvas
        this.initializeCanvas();
        
        showNotification('Desconectado do cliente', 'info');
    }
    
    handleScreenUpdate(data) {
        if (!this.currentClient || data.clientId !== this.currentClient.id) {
            return;
        }
        
        try {
            // Criar nova imagem
            const img = new Image();
            img.onload = () => {
                // Redimensionar canvas se necessário
                if (this.screenCanvas.width !== img.width || this.screenCanvas.height !== img.height) {
                    this.screenCanvas.width = img.width;
                    this.screenCanvas.height = img.height;
                }
                
                // Desenhar imagem
                this.ctx.clearRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
                this.ctx.drawImage(img, 0, 0);
                
                // Adicionar overlay com informações
                this.drawInfoOverlay(data);
            };
            
            img.onerror = (error) => {
                console.error('Erro ao carregar imagem:', error);
            };
            
            img.src = data.imageData;
            
        } catch (error) {
            console.error('Erro ao processar atualização de tela:', error);
        }
    }
    
    drawInfoOverlay(data) {
        const overlayHeight = 60;
        const overlayY = this.screenCanvas.height - overlayHeight;
        
        // Fundo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, overlayY, this.screenCanvas.width, overlayHeight);
        
        // Informações do stream
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const infoX = 10;
        const infoY = overlayY + 20;
        const lineHeight = 18;
        
        this.ctx.fillText(`Cliente: ${this.currentClient.name}`, infoX, infoY);
        this.ctx.fillText(`Qualidade: ${data.quality}`, infoX, infoY + lineHeight);
        this.ctx.fillText(`Última atualização: ${formatTimestamp(data.timestamp)}`, infoX, infoY + lineHeight * 2);
    }
    
    updateClientStatus(data) {
        // Atualizar status do cliente na lista
        const clientIndex = this.availableClients.findIndex(c => c.clientId === data.clientId);
        if (clientIndex !== -1) {
            this.availableClients[clientIndex] = { ...this.availableClients[clientIndex], ...data };
            this.renderClientList();
        }
    }
    
    takeScreenshot() {
        if (!this.currentClient) {
            showNotification('Não conectado a nenhum cliente', 'warning');
            return;
        }
        
        try {
            // Criar link de download
            const link = document.createElement('a');
            link.download = `screenshot_${this.currentClient.name}_${Date.now()}.png`;
            link.href = this.screenCanvas.toDataURL();
            link.click();
            
            showNotification('Screenshot salvo com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao salvar screenshot:', error);
            showNotification('Erro ao salvar screenshot', 'error');
        }
    }
    
    toggleFullscreen() {
        if (!this.currentClient) {
            showNotification('Não conectado a nenhum cliente', 'warning');
            return;
        }
        
        try {
            if (!document.fullscreenElement) {
                this.screenCanvas.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        } catch (error) {
            console.error('Erro ao alternar tela cheia:', error);
            showNotification('Erro ao alternar tela cheia', 'error');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.handleDisconnection();
    }
}

// Instanciar gerenciador do viewer
const viewerManager = new ViewerManager();

// Funções globais para uso no HTML
window.connectAsViewer = () => viewerManager.connectAsViewer();
window.disconnectFromClient = () => viewerManager.disconnectFromClient();
window.takeScreenshot = () => viewerManager.takeScreenshot();
window.toggleFullscreen = () => viewerManager.toggleFullscreen();

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (viewerManager) {
        viewerManager.disconnect();
    }
});
