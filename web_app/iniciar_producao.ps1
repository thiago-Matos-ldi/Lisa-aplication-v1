# Script de Inicializacao para Producao - LISA Web App
# Usa Waitress para melhor performance com multiplas conexoes

Write-Host "Iniciando LISA (Modo Producao)..." -ForegroundColor Cyan

# Verificar Python
$python_version = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Python nao encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar modelos
if (!(Test-Path "modelos\modelo_cnn_numeros_lisav2_estaticos_cxy_v1.pth")) {
    Write-Host "Erro: Modelos nao encontrados!" -ForegroundColor Red
    Write-Host "Execute: .\copiar_modelos.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar dependencias criticas
$critical = @("flask", "mediapipe", "cryptography", "waitress")
foreach ($pkg in $critical) {
    $check = pip show $pkg 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro: $pkg nao instalado!" -ForegroundColor Red
        if ($pkg -eq "waitress") {
            Write-Host "Instalando waitress..." -ForegroundColor Yellow
            pip install waitress
        } else {
            Write-Host "Execute: .\instalar_dependencias.ps1" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Obter IP
try {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
    if ($ips -and $ips.Count -gt 0) {
        $ip_local = $ips[0].IPAddress
    } else {
        # Tentar outro range comum
        $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "10.*"}
        if ($ips -and $ips.Count -gt 0) {
            $ip_local = $ips[0].IPAddress
        } else {
            $ip_local = "localhost"
        }
    }
} catch {
    $ip_local = "localhost"
}

Write-Host ""
Write-Host "Servidor INICIADO (Modo Producao)!" -ForegroundColor Green
Write-Host "  Celular/Tablet: https://$ip_local:5000" -ForegroundColor White
Write-Host "  Local: https://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Ignore o aviso de 'Conexao nao e privada'" -ForegroundColor Yellow
Write-Host "  Clique em 'Avancado' e depois 'Continuar para o site'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Suporta multiplas conexoes simultaneas!" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Gray
Write-Host ""

# Iniciar aplicacao - Flask com threading otimizado (Waitress não suporta HTTPS)
python app.py
