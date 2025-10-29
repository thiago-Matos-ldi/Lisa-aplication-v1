# 📊 Arquitetura do Sistema LISA Web

## 🏗️ Estrutura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    DISPOSITIVOS CLIENTE                     │
│  📱 Celular  │  💻 Computador  │  📱 Tablet  │  📱 Celular  │
│     (iOS)    │    (Windows)     │   (Android) │    (Android) │
└──────────────┬──────────────────┬─────────────┴──────────────┘
               │                  │
               │  Wi-Fi Local     │
               │  192.168.x.x     │
               │                  │
┌──────────────┴──────────────────┴─────────────────────────────┐
│             SERVIDOR FLASK (Computador Host)                  │
│                     http://IP:5000                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  BACKEND (app.py)                                   │    │
│  │  • Recebe imagens via POST                          │    │
│  │  • Processa com MediaPipe                           │    │
│  │  • Classifica com CNN                               │    │
│  │  • Retorna resultado JSON                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FRONTEND (templates/ + static/)                    │    │
│  │  • Interface HTML5 responsiva                       │    │
│  │  • Acesso à câmera (WebRTC)                         │    │
│  │  • JavaScript para captura                          │    │
│  │  • CSS moderno e mobile-friendly                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MODELOS IA (modelos/)                              │    │
│  │  • CNN PyTorch (classificação)                      │    │
│  │  • MediaPipe (detecção mãos)                        │    │
│  │  • Scaler (normalização)                            │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Processamento

```
1. CAPTURA (Cliente)
   📱 Usuário abre câmera
   ↓
   👋 Faz o sinal em Libras
   ↓
   📸 Clica "Capturar Sinal"
   ↓
   🖼️ JavaScript captura frame da câmera
   ↓
   📤 Envia imagem base64 via AJAX

2. PROCESSAMENTO (Servidor)
   📥 Flask recebe POST /processar_imagem
   ↓
   🔍 MediaPipe detecta landmarks (21 pontos)
   ↓
   📊 Extrai coordenadas (x,y) → 42 features
   ↓
   ⚖️ Normaliza com Scaler
   ↓
   🧠 CNN classifica o sinal
   ↓
   📈 Calcula confiança (softmax)
   ↓
   🎨 Desenha landmarks na imagem

3. RESPOSTA (Servidor → Cliente)
   📦 Retorna JSON:
      • classe: "numero_1"
      • confianca: 0.95
      • imagem_processada: base64
   ↓
   📱 Cliente exibe resultado
   ↓
   ✅ Usuário vê o sinal reconhecido!
```

## 🗂️ Estrutura de Arquivos Detalhada

```
web_app/
│
├── 📄 app.py                           # Servidor Flask principal
│   ├── Rotas:
│   │   ├── GET  /                      → Página inicial
│   │   ├── GET  /sobre                 → Sobre o projeto
│   │   ├── POST /processar_imagem      → Classificação
│   │   └── GET  /info                  → Info do modelo
│   │
│   └── Componentes:
│       ├── CNNClassifier               → Modelo PyTorch
│       ├── detector_maos               → MediaPipe Hands
│       └── scaler                      → Normalizador
│
├── 📋 requirements.txt                 # Dependências Python
│
├── 📁 modelos/                         # Modelos treinados
│   ├── modelo_cnn_numeros_lisav2_estaticos_cxy_v1.pth
│   └── scaler_cnn_numeros_lisav2_estaticos_cxy_v1.pkl
│
├── 📁 static/                          # Arquivos estáticos
│   ├── css/
│   │   └── style.css                   # Estilos CSS
│   │       ├── Layout responsivo
│   │       ├── Animações
│   │       ├── Tema cores
│   │       └── Media queries mobile
│   │
│   └── js/
│       └── main.js                     # JavaScript principal
│           ├── Inicialização câmera
│           ├── Captura de imagem
│           ├── AJAX para servidor
│           ├── Exibição resultados
│           └── Troca de câmera
│
├── 📁 templates/                       # Templates HTML
│   ├── index.html                      # Página principal
│   │   ├── Vídeo da câmera
│   │   ├── Botões de controle
│   │   ├── Área de resultado
│   │   └── Info de uso
│   │
│   └── sobre.html                      # Página sobre
│       └── Informações do projeto
│
├── 📜 README.md                        # Documentação completa
├── 📜 GUIA_CELULAR.md                 # Guia simplificado
├── 📜 ESTRUTURA.md                    # Este arquivo
│
├── 🔧 iniciar.ps1                     # Script inicialização
├── 🔧 copiar_modelos.ps1              # Script cópia modelos
│
└── 📝 .gitignore                      # Ignorar arquivos Git
```

## 🔌 API Endpoints

### GET `/`
**Descrição**: Página principal com interface de captura

**Resposta**: HTML da página inicial

---

### GET `/sobre`
**Descrição**: Informações sobre o projeto

**Resposta**: HTML da página sobre

---

### POST `/processar_imagem`
**Descrição**: Processa imagem e retorna classificação

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response Success**:
```json
{
  "sucesso": true,
  "classe": "numero_1",
  "confianca": 0.9542,
  "imagem_processada": "data:image/jpeg;base64,..."
}
```

**Response Error**:
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma mão detectada na imagem"
}
```

---

### GET `/info`
**Descrição**: Informações sobre o modelo

**Response**:
```json
{
  "modelo": "CNN para Reconhecimento de Sinais em Libras",
  "versao": "v2",
  "classes": ["numero_1", "numero_2", ...],
  "num_classes": 10
}
```

## 🧠 Modelo CNN - Arquitetura

```
INPUT: [batch, 42]  (21 landmarks × 2 coords)
    ↓
UNSQUEEZE: [batch, 1, 42]
    ↓
┌─────────────────────────────────────────┐
│  CAMADAS CONVOLUCIONAIS                 │
├─────────────────────────────────────────┤
│  Conv1d(1 → 64, k=3) + BatchNorm + ReLU │
│  Dropout(0.3)                           │
│  ↓                                      │
│  Conv1d(64 → 128, k=3) + BatchNorm      │
│  + ReLU + Dropout + MaxPool1d(2)        │
│  ↓                                      │
│  Conv1d(128 → 256, k=3) + BatchNorm     │
│  + ReLU + Dropout + MaxPool1d(2)        │
│  ↓                                      │
│  Conv1d(256 → 512, k=3) + BatchNorm     │
│  + ReLU + Dropout                       │
└─────────────────────────────────────────┘
    ↓
FLATTEN: [batch, conv_output_size]
    ↓
┌─────────────────────────────────────────┐
│  CAMADAS FULLY CONNECTED                │
├─────────────────────────────────────────┤
│  Linear(conv_size → 512) + ReLU         │
│  Dropout(0.3)                           │
│  ↓                                      │
│  Linear(512 → 256) + ReLU + Dropout     │
│  ↓                                      │
│  Linear(256 → 128) + ReLU + Dropout     │
│  ↓                                      │
│  Linear(128 → num_classes)              │
└─────────────────────────────────────────┘
    ↓
OUTPUT: [batch, num_classes]  (logits)
    ↓
SOFTMAX: probabilidades por classe
```
