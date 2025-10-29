// Elementos do DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const newCaptureBtn = document.getElementById('newCaptureBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const processedImage = document.getElementById('processedImage');
const resultClass = document.getElementById('resultClass');
const resultConfidence = document.getElementById('resultConfidence');
const cameraStatus = document.getElementById('cameraStatus');

// Variáveis de controle
let stream = null;
let currentCamera = 'user'; // 'user' (frontal) ou 'environment' (traseira)
let devices = [];

// ================================
// Inicialização
// ================================
async function init() {
    console.log('=== Inicializando LISA ===');
    console.log('Navegador:', navigator.userAgent);
    console.log('Protocolo:', window.location.protocol);
    console.log('Host:', window.location.host);
    
    // Mostrar status
    cameraStatus.style.display = 'block';
    cameraStatus.innerHTML = '<strong>⏳ Verificando suporte à câmera...</strong>';
    cameraStatus.style.background = '#cce5ff';
    cameraStatus.style.color = '#004085';
    
    // Desabilitar botões até câmera estar pronta
    captureBtn.disabled = true;
    switchCameraBtn.disabled = true;
    
    try {
        // Verificar suporte básico
        if (!navigator.mediaDevices) {
            throw new Error('Seu navegador não suporta acesso à câmera. Atualize seu navegador.');
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
            throw new Error('API getUserMedia não disponível. Verifique se está usando HTTPS ou localhost.');
        }
        
        console.log('✓ Suporte à câmera detectado');
        
        // Listar dispositivos disponíveis
        cameraStatus.innerHTML = '<strong>🔍 Buscando câmeras disponíveis...</strong>';
        await getVideoDevices();
        
        if (devices.length === 0) {
            throw new Error('Nenhuma câmera encontrada. Conecte uma câmera e recarregue a página.');
        }
        
        console.log(`✓ ${devices.length} câmera(s) encontrada(s)`);
        
        // Solicitar permissão e iniciar câmera
        cameraStatus.innerHTML = '<strong>📷 Solicitando permissão da câmera...</strong><br><small>Por favor, clique em "Permitir" no popup do navegador</small>';
        await startCamera();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        
        let errorMsg = error.message;
        let errorDetails = '';
        
        // Mensagens específicas para Chrome
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMsg = 'Permissão de câmera negada';
            errorDetails = 'Clique no ícone de cadeado na barra de endereço e permita o acesso à câmera.';
        } else if (error.name === 'NotFoundError') {
            errorMsg = 'Nenhuma câmera encontrada';
            errorDetails = 'Verifique se há uma câmera conectada ao dispositivo.';
        } else if (error.name === 'NotReadableError') {
            errorMsg = 'Câmera em uso por outro aplicativo';
            errorDetails = 'Feche outros programas que possam estar usando a câmera.';
        }
        
        cameraStatus.innerHTML = `<strong>❌ ${errorMsg}</strong>${errorDetails ? '<br><small>' + errorDetails + '</small>' : ''}`;
        cameraStatus.style.background = '#f8d7da';
        cameraStatus.style.color = '#721c24';
    }
}

// ================================
// Gerenciamento de Câmera
// ================================
async function getVideoDevices() {
    try {
        // Primeiro, solicitar permissão genérica para listar dispositivos
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(track => track.stop());
        
        // Agora listar todos os dispositivos
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        devices = allDevices.filter(device => device.kind === 'videoinput');
        
        console.log('Câmeras disponíveis:', devices.length);
        devices.forEach((device, index) => {
            console.log(`  ${index + 1}. ${device.label || 'Câmera ' + (index + 1)}`);
        });
        
        return devices;
    } catch (error) {
        console.error('Erro ao listar dispositivos:', error);
        throw error;
    }
}

async function startCamera() {
    try {
        // Parar stream anterior se existir
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Configurações para Chrome (mais permissivas)
        const constraints = {
            video: {
                facingMode: currentCamera,
                width: { min: 320, ideal: 640, max: 1280 },
                height: { min: 240, ideal: 480, max: 720 }
            },
            audio: false
        };

        console.log('Solicitando acesso à câmera com constraints:', constraints);
        
        // Iniciar stream
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        console.log('Stream obtido, configurando vídeo...');
        
        // Aguardar vídeo estar pronto
        video.onloadedmetadata = () => {
            console.log('Metadata carregada, iniciando reprodução...');
            video.play().then(() => {
                console.log('✓ Câmera ativa e funcionando');
                
                // Sucesso!
                cameraStatus.innerHTML = '<strong>✅ Câmera ativa!</strong>';
                cameraStatus.style.background = '#d4edda';
                cameraStatus.style.color = '#155724';
                
                // Ocultar status após 3 segundos
                setTimeout(() => {
                    cameraStatus.style.display = 'none';
                }, 3000);
                
                // Habilitar botões
                captureBtn.disabled = false;
                if (devices.length > 1) {
                    switchCameraBtn.disabled = false;
                }
            }).catch(err => {
                console.error('Erro ao iniciar reprodução:', err);
                throw err;
            });
        };
        
    } catch (error) {
        console.error('❌ Erro ao iniciar câmera:', error);
        console.error('Nome do erro:', error.name);
        console.error('Mensagem:', error.message);
        
        let errorMsg = '';
        let errorDetails = '';
        
        switch (error.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                errorMsg = 'Permissão de câmera negada';
                errorDetails = `
                    <strong>Como permitir no Chrome:</strong><br>
                    1. Clique no ícone de cadeado (ou câmera) na barra de endereço<br>
                    2. Selecione "Permitir" para Câmera<br>
                    3. Recarregue a página (F5)
                `;
                break;
                
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                errorMsg = 'Nenhuma câmera encontrada';
                errorDetails = 'Conecte uma câmera ao dispositivo e recarregue a página.';
                break;
                
            case 'NotReadableError':
            case 'TrackStartError':
                errorMsg = 'Câmera não pode ser acessada';
                errorDetails = 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.';
                break;
                
            case 'OverconstrainedError':
                errorMsg = 'Configuração de câmera não suportada';
                errorDetails = 'Tentando com configurações alternativas...';
                
                // Tentar novamente com configurações mais simples
                setTimeout(async () => {
                    try {
                        const simpleConstraints = { video: true, audio: false };
                        stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
                        video.srcObject = stream;
                        await video.play();
                        
                        cameraStatus.innerHTML = '<strong>✅ Câmera ativa (modo compatibilidade)</strong>';
                        cameraStatus.style.background = '#d4edda';
                        cameraStatus.style.color = '#155724';
                        captureBtn.disabled = false;
                    } catch (retryError) {
                        console.error('Falha na segunda tentativa:', retryError);
                    }
                }, 2000);
                break;
                
            case 'TypeError':
                errorMsg = 'API de câmera não disponível';
                errorDetails = 'Acesse via: <strong>http://localhost:5000</strong> (não use o IP se estiver testando localmente)';
                break;
                
            default:
                errorMsg = 'Erro desconhecido ao acessar câmera';
                errorDetails = `Detalhes: ${error.message}`;
        }
        
        cameraStatus.innerHTML = `
            <strong>❌ ${errorMsg}</strong><br>
            <small>${errorDetails}</small>
        `;
        cameraStatus.style.background = '#f8d7da';
        cameraStatus.style.color = '#721c24';
        cameraStatus.style.display = 'block';
        
        captureBtn.disabled = true;
        switchCameraBtn.disabled = true;
        
        throw error;
    }
}

function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    startCamera();
}

// ================================
// Captura e Processamento
// ================================
async function captureImage() {
    try {
        // Desabilitar botão
        captureBtn.disabled = true;
        captureBtn.textContent = '⏳ Capturando...';

        // Configurar canvas com dimensões do vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Desenhar frame atual no canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Converter para base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        // Mostrar loading
        loading.style.display = 'block';
        resultSection.style.display = 'none';

        // Enviar para servidor
        const response = await fetch('/processar_imagem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();

        // Ocultar loading
        loading.style.display = 'none';

        if (result.sucesso) {
            // Mostrar resultado
            processedImage.src = result.imagem_processada;
            resultClass.textContent = result.classe;
            resultConfidence.textContent = `${(result.confianca * 100).toFixed(1)}%`;
            resultSection.style.display = 'block';

            // Scroll suave para resultado
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert(result.mensagem || 'Erro ao processar imagem');
        }

    } catch (error) {
        console.error('Erro ao capturar imagem:', error);
        alert('Erro ao processar a imagem. Tente novamente.');
        loading.style.display = 'none';
    } finally {
        // Reabilitar botão
        captureBtn.disabled = false;
        captureBtn.textContent = '📸 Capturar Sinal';
    }
}

function newCapture() {
    // Ocultar resultado e rolar para câmera
    resultSection.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// Event Listeners
// ================================
captureBtn.addEventListener('click', captureImage);
switchCameraBtn.addEventListener('click', switchCamera);
newCaptureBtn.addEventListener('click', newCapture);

// Permitir captura com tecla Enter/Espaço
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !captureBtn.disabled) {
        e.preventDefault();
        captureImage();
    }
});

// ================================
// Inicializar ao carregar página
// ================================
window.addEventListener('load', init);

// Parar câmera ao sair da página
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// ================================
// Funcionalidades Adicionais
// ================================

// Detectar orientação do dispositivo (mobile)
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        startCamera();
    }, 500);
});

// Toast de notificação
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Adicionar animação de entrada
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('🤟 LISA - Sistema de Reconhecimento de Sinais carregado!');
