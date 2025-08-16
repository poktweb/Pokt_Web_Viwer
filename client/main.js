// Gerenciamento de navegação entre telas
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela selecionada
    document.getElementById(screenId).classList.add('active');
}

function showConnectionScreen() {
    showScreen('connection-screen');
}

function showClientMode() {
    showScreen('client-screen');
}

function showViewerMode() {
    showScreen('viewer-screen');
}

// Funções utilitárias
function updateConnectionStatus(elementId, status, isConnected = false) {
    const element = document.getElementById(elementId);
    element.textContent = status;
    
    if (isConnected) {
        element.style.background = '#d4edda';
        element.style.color = '#155724';
    } else {
        element.style.background = '#f8d7da';
        element.style.color = '#721c24';
    }
}

function showNotification(message, type = 'info') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Definir cor baseada no tipo
    switch(type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Remote Viewer System carregado');
    
    // Verificar se há conexões ativas salvas
    const savedClientName = localStorage.getItem('clientName');
    const savedViewerName = localStorage.getItem('viewerName');
    const savedServerUrl = localStorage.getItem('serverUrl');
    
    if (savedClientName) {
        document.getElementById('client-name').value = savedClientName;
    }
    
    if (savedViewerName) {
        document.getElementById('viewer-name').value = savedViewerName;
    }
    
    if (savedServerUrl) {
        document.getElementById('server-url').value = savedServerUrl;
        document.getElementById('viewer-server-url').value = savedServerUrl;
    }
    
    // Salvar configurações quando alteradas
    document.getElementById('client-name').addEventListener('change', function() {
        localStorage.setItem('clientName', this.value);
    });
    
    document.getElementById('viewer-name').addEventListener('change', function() {
        localStorage.setItem('viewerName', this.value);
    });
    
    document.getElementById('server-url').addEventListener('change', function() {
        localStorage.setItem('serverUrl', this.value);
        document.getElementById('viewer-server-url').value = this.value;
    });
    
    document.getElementById('viewer-server-url').addEventListener('change', function() {
        localStorage.setItem('serverUrl', this.value);
        document.getElementById('server-url').value = this.value;
    });
});

// Função para verificar status do servidor
async function checkServerStatus(serverUrl) {
    try {
        const response = await fetch(`${serverUrl}/api/status`);
        if (response.ok) {
            const data = await response.json();
            return { status: 'online', data };
        } else {
            return { status: 'error', message: 'Servidor não respondeu corretamente' };
        }
    } catch (error) {
        return { status: 'error', message: 'Não foi possível conectar ao servidor' };
    }
}

// Função para formatar timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR');
}

// Função para formatar bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funções para uso em outros módulos
window.showScreen = showScreen;
window.showConnectionScreen = showConnectionScreen;
window.showClientMode = showClientMode;
window.showViewerMode = showViewerMode;
window.updateConnectionStatus = updateConnectionStatus;
window.showNotification = showNotification;
window.checkServerStatus = checkServerStatus;
window.formatTimestamp = formatTimestamp;
window.formatBytes = formatBytes;
window.debounce = debounce;
