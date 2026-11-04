# Desliga o escritório e os sistemas da equipe, que rodam escondidos (sem janela).
# Para rodar: botão direito neste arquivo > Executar com o PowerShell.
# Só encerra o que é do escritório: o supervisor (INICIAR ESCRITORIO.cmd) e
# quem estiver escutando na porta do escritório e nas portas do registro.
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1) o supervisor primeiro, senão ele religa o escritório em 3 segundos
Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" |
  Where-Object { $_.CommandLine -like '*INICIAR ESCRITORIO.cmd*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; "supervisor encerrado (pid $($_.ProcessId))" }

# 2) as portas: escritório + cada sistema local do registro
$portas = @(4321)
try {
  $reg = Get-Content (Join-Path $pasta 'data\sistemas.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($p in $reg.PSObject.Properties) { if ($p.Value.porta) { $portas += [int]$p.Value.porta } }
} catch { }

foreach ($porta in $portas) {
  Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; "porta ${porta}: encerrado (pid $_)" }
}
"Pronto. Para ligar de novo, use o atalho ou ABRIR ESCRITORIO.ps1."
