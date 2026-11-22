# Servidor Local HTTP para MI EVOLUCIÓN
# Basado en TcpListener (sin requisitos de administrador ni restricciones de urlacl)
param (
    [int]$Port = 8080,
    [string]$RootPath = "$PSScriptRoot"
)

$ipLocal = "127.0.0.1"
try {
    $ipNet = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169\." } | Select-Object -First 1).IPAddress
    if ($ipNet) { $ipLocal = $ipNet }
} catch {}

$endpoint = New-Object System.Net.IPEndPoint ([System.Net.IPAddress]::Any, $Port)
$listener = New-Object System.Net.Sockets.TcpListener $endpoint

try {
    $listener.Start()
} catch {
    Write-Host "Error al iniciar en puerto ${Port}: $_" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MI EVOLUCIÓN - SERVIDOR LOCAL EN EJECUCIÓN" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " -> Acceso en tu PC:              http://localhost:${Port}/" -ForegroundColor Yellow
Write-Host " -> Acceso en tu OPPO Find X9:    http://${ipLocal}:${Port}/" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Sirviendo archivos desde: $RootPath" -ForegroundColor Gray

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Parsear GET /path HTTP/1.1
        $parts = $requestLine.Split(" ")
        $method = $parts[0]
        $rawPath = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        
        # Eliminar query strings
        if ($rawPath.Contains("?")) {
            $rawPath = $rawPath.Substring(0, $rawPath.IndexOf("?"))
        }

        if ($rawPath -eq "/" -or [string]::IsNullOrWhiteSpace($rawPath)) {
            $rawPath = "/index.html"
        }

        # Leer el resto de cabeceras para limpiar el buffer
        while ($line = $reader.ReadLine()) {
            if ($line.Trim() -eq "") { break }
        }

        $localFilePath = Join-Path $RootPath ($rawPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar))

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $cType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)

            $header = "HTTP/1.1 200 OK`r`n" +
                      "Content-Type: $cType`r`n" +
                      "Content-Length: $($bytes.Length)`r`n" +
                      "Access-Control-Allow-Origin: *`r`n" +
                      "Connection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($notFound.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($notFound, 0, $notFound.Length)
        }

        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
