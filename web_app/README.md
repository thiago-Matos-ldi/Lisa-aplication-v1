# 🤟 LISA - Reconhecimento de Sinais em Libras (Web App)

Aplicação web para reconhecimento de sinais em Libras usando CNN + MediaPipe, acessível via rede local por qualquer dispositivo (celular, tablet, computador).

## 📁 Estrutura do Projeto

```
web_app/
├── app.py                      # Servidor Flask
├── requirements.txt            # Dependências Python
├── modelos/                    # Modelos treinados
│   ├── modelo_cnn_numeros_lisav2_estaticos_cxy_v1.pth
│   └── scaler_cnn_numeros_lisav2_estaticos_cxy_v1.pkl
├── static/                     # Arquivos estáticos
│   ├── css/
│   │   └── style.css          # Estilos
│   └── js/
│       └── main.js            # JavaScript da aplicação
└── templates/                  # Templates HTML
    ├── index.html             # Página principal
    └── sobre.html             # Página sobre
```

## 🚀 Como Usar

### 1. Copiar os Modelos

Primeiro, copie os modelos treinados para a pasta `modelos/`:

```powershell
# Na pasta do projeto Lisa
Copy-Item "C:\Users\Cliente\Documents\lisa_projeto\modelos\modelo_cnn_numeros_lisav2_estaticos_cxy_v1.pth" "web_app\modelos\"
Copy-Item "C:\Users\Cliente\Documents\lisa_projeto\modelos\scaler_cnn_numeros_lisav2_estaticos_cxy_v1.pkl" "web_app\modelos\"
```

### 2. Instalar Dependências

```powershell
cd web_app
pip install -r requirements.txt
```

### 3. Executar a Aplicação

```powershell
python app.py
```

A aplicação iniciará e mostrará o endereço para acesso:

```
🤟 LISA - Reconhecimento de Sinais em Libras
============================================================

📱 Acesse de qualquer dispositivo na rede:
   http://192.168.x.x:5000

💻 Acesso local:
   http://localhost:5000
```

### 4. Acessar via Celular/Tablet

1. Conecte o dispositivo à **mesma rede Wi-Fi** do computador
2. Abra o navegador no dispositivo
3. Digite o endereço mostrado (ex: `http://192.168.1.100:5000`)
4. Permita o acesso à câmera quando solicitado
5. Use a aplicação normalmente!

## 📱 Funcionalidades

- ✅ **Captura em Tempo Real**: Usa a câmera do dispositivo
- ✅ **Troca de Câmera**: Alterna entre câmera frontal/traseira (mobile)
- ✅ **Detecção de Mãos**: MediaPipe detecta landmarks automaticamente
- ✅ **Classificação CNN**: Modelo PyTorch identifica o sinal
- ✅ **Interface Responsiva**: Funciona em qualquer tamanho de tela
- ✅ **Visualização de Resultado**: Mostra imagem processada e confiança

## 🔧 Tecnologias

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **IA**: PyTorch (CNN) + MediaPipe (detecção de mãos)
- **Camera**: WebRTC API

## 🌐 Acesso Remoto (Opcional)

Para acesso fora da rede local, considere usar:

- **ngrok**: Túnel temporário para testes
- **Servidor na nuvem**: Deploy em Heroku, AWS, etc.

### Exemplo com ngrok:

```powershell
# Instalar ngrok: https://ngrok.com/download
ngrok http 5000
```

## ⚙️ Configurações Avançadas

### Alterar Porta

Edite `app.py`, linha final:

```python
app.run(host='0.0.0.0', port=8080, debug=False)  # Porta 8080
```

### Modo Produção

Use Gunicorn para produção:

```powershell
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

## 🐛 Solução de Problemas

### Câmera não funciona no celular

- Certifique-se de acessar via **HTTPS** ou **localhost**
- Alguns navegadores bloqueiam câmera em HTTP não-local
- Use ngrok para ter HTTPS temporário

### Erro ao carregar modelo

- Verifique se os arquivos `.pth` e `.pkl` estão na pasta `modelos/`
- Confira os caminhos em `app.py`

### Dispositivos não acessam o servidor

- Verifique se estão na mesma rede Wi-Fi
- Desative firewall temporariamente para teste
- Use o IP correto mostrado no console

## 📊 Desempenho

- **Tempo de processamento**: ~200-500ms por imagem
- **Uso de memória**: ~500MB-1GB
- **Múltiplos usuários**: Suporta acesso simultâneo

## 📝 Notas

- A aplicação roda em modo debug por padrão
- Para produção, desabilite debug e use Gunicorn
- O modelo funciona melhor com boa iluminação
- Mantenha a mão centralizada no quadro

## 🤝 Contribuindo

Este é um projeto acadêmico voltado para acessibilidade. Sugestões e melhorias são bem-vindas!

## 📄 Licença

Projeto desenvolvido para fins educacionais e de acessibilidade.
