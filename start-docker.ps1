# start-docker.ps1
# Script para iniciar e parar o ambiente Docker do projeto Or-amento_v2.1.0

param(
    [string]$action = 'up'
)

$projectPath = $PSScriptRoot
Set-Location -Path $projectPath

if ($action -eq 'up') {
    Write-Host "[docker] Iniciando containers no diretório $projectPath ..." -ForegroundColor Green
    docker-compose up --build
} elseif ($action -eq 'down') {
    Write-Host "[docker] Parando e removendo containers no diretório $projectPath ..." -ForegroundColor Yellow
    docker-compose down
} elseif ($action -eq 'logs') {
    Write-Host "[docker] Exibindo logs do docker-compose ..." -ForegroundColor Cyan
    docker-compose logs -f
} elseif ($action -eq 'prune') {
    Write-Host "[docker] Limpando recursos não usados (imagens, volumes, networks) ..." -ForegroundColor Magenta
    docker system prune -f
} else {
    Write-Host "Ação inválida: $action" -ForegroundColor Red
    Write-Host "Uso: .\\start-docker.ps1 -action up|down|logs|prune"
}
