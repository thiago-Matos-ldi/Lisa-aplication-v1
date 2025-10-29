"""
Aplicação Flask para Reconhecimento de Sinais em Libras
Permite acesso via rede local (celulares, tablets, computadores)
"""

from flask import Flask, render_template, request, jsonify, Response
import cv2
import mediapipe as mp
import torch
import torch.nn as nn
import numpy as np
import joblib
import os
import base64
from PIL import Image
import io
import gc

app = Flask(__name__)

# Configurações Flask para múltiplas conexões
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Desabilitar cache
app.config['JSONIFY_TIMEOUT'] = 30  # Timeout de 30 segundos

# ================================
# Configurações de Caminhos
# ================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "modelos", "modelo_cnn_numeros_lisav2_estaticos_cxy_v1.pth")
SCALER_PATH = os.path.join(BASE_DIR, "modelos", "scaler_cnn_numeros_lisav2_estaticos_cxy_v1.pkl")

# ================================
# Definição da CNN
# ================================
class CNNClassifier(nn.Module):
    def __init__(self, input_dim, num_classes, dropout_rate=0.3):
        super(CNNClassifier, self).__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv1d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),

            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.MaxPool1d(2),

            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.MaxPool1d(2),

            nn.Conv1d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
        )
        self._calculate_conv_output(input_dim)
        self.fc_layers = nn.Sequential(
            nn.Linear(self.conv_output_size, 512),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, num_classes)
        )

    def _calculate_conv_output(self, input_dim):
        x = torch.randn(1, 1, input_dim)
        x = self.conv_layers(x)
        self.conv_output_size = x.view(1, -1).size(1)

    def forward(self, x):
        x = x.unsqueeze(1)
        x = self.conv_layers(x)
        x = x.view(x.size(0), -1)
        return self.fc_layers(x)

# ================================
# Carregar Modelo e Scaler
# ================================
print("Carregando modelo e scaler...")
scaler = joblib.load(SCALER_PATH)
checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'))

input_dim = checkpoint['input_dim']
num_classes = checkpoint['num_classes']
classes = checkpoint['label_encoder']

model = CNNClassifier(input_dim, num_classes)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

print(f"Modelo carregado! Classes reconhecidas: {classes}")

# ================================
# Inicializar MediaPipe
# ================================
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
detector_maos = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# ================================
# Rotas da Aplicação
# ================================

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html', classes=classes)

@app.route('/sobre')
def sobre():
    """Página sobre o projeto"""
    return render_template('sobre.html')

@app.route('/processar_imagem', methods=['POST'])
def processar_imagem():
    """Processa imagem enviada e retorna a classificação"""
    try:
        # Receber imagem em base64
        data = request.get_json()
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Converter para formato OpenCV
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Converter RGB para BGR (OpenCV usa BGR)
        if len(image_np.shape) == 3 and image_np.shape[2] == 4:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
        elif len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Processar com MediaPipe
        img_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        resultado = detector_maos.process(img_rgb)
        
        if resultado.multi_hand_landmarks:
            # Extrair landmarks
            landmarks = resultado.multi_hand_landmarks[0]
            pontos = []
            for lm in landmarks.landmark:
                pontos.extend([lm.x, lm.y])
            
            # Normalizar e fazer predição
            entrada = np.array(pontos).reshape(1, -1)
            entrada = scaler.transform(entrada)
            entrada_tensor = torch.tensor(entrada, dtype=torch.float32)
            
            with torch.no_grad():
                saida = model(entrada_tensor)
                probabilidades = torch.softmax(saida, dim=1)
                pred = torch.argmax(saida, dim=1).item()
                confianca = probabilidades[0][pred].item()
                classe_predita = classes[pred]
            
            # Desenhar landmarks na imagem
            mp_drawing.draw_landmarks(
                image_np,
                landmarks,
                mp_hands.HAND_CONNECTIONS
            )
            
            # Converter imagem processada para base64
            _, buffer = cv2.imencode('.jpg', image_np)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Liberar memória
            del image_np, img_rgb, resultado, entrada, entrada_tensor, saida, probabilidades, buffer
            gc.collect()
            
            return jsonify({
                'sucesso': True,
                'classe': classe_predita,
                'confianca': float(confianca),
                'imagem_processada': f'data:image/jpeg;base64,{img_base64}'
            })
        else:
            # Liberar memória
            del image_np, img_rgb, resultado
            gc.collect()
            
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhuma mão detectada na imagem'
            })
            
    except Exception as e:
        # Liberar memória em caso de erro
        gc.collect()
        
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao processar imagem: {str(e)}'
        })

@app.route('/info')
def info():
    """Retorna informações sobre o modelo"""
    return jsonify({
        'modelo': 'CNN para Reconhecimento de Sinais em Libras',
        'versao': 'v2',
        'classes': classes,
        'num_classes': len(classes)
    })

# ================================
# Executar Aplicação
# ================================
if __name__ == '__main__':
    # Obter IP local
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("\n" + "="*60)
    print("🤟 LISA - Reconhecimento de Sinais em Libras")
    print("="*60)
    print(f"\n📱 Acesse de qualquer dispositivo na rede:")
    print(f"   https://{local_ip}:5000")
    print(f"\n💻 Acesso local:")
    print(f"   https://localhost:5000")
    print(f"\n⚠️  Ignore o aviso de certificado não confiável no navegador")
    print("   (isso é normal em desenvolvimento)")
    print("\n" + "="*60 + "\n")
    
    # Iniciar servidor com SSL (HTTPS) - Configurado para múltiplas conexões
    app.run(
        host='0.0.0.0', 
        port=5000, 
        debug=False,  # Desabilitar debug para melhor performance
        threaded=True,  # Habilitar múltiplas threads
        ssl_context='adhoc',  # Certificado auto-assinado
        use_reloader=False  # Desabilitar auto-reload
    )
