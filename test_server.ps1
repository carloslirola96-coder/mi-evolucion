$script = "C:\Users\Carlo\.gemini\antigravity\scratch\mi-evolucion-app\server.ps1"
$proc = Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$script`" -Port 8089" -PassThru
Start-Sleep -Seconds 2
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:8089/index.html" -UseBasicParsing -TimeoutSec 3
    Write-Host "HTTP_STATUS:$($res.StatusCode)"
    Write-Host "CONTENT_LENGTH:$($res.Content.Length)"
    if ($res.Content.Contains("MI EVOLUCIÓN")) {
        Write-Host "APP_TITLE_VERIFIED:SUCCESS"
    }
} catch {
    Write-Host "FAIL: $_"
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
