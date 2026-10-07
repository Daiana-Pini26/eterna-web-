# Servidor local para ver la web en http://localhost:8770/
param([int]$Port = 8770)
$Root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "ETERNA en http://localhost:$Port/  (Ctrl+C para cerrar)"
$mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript"; ".json"="application/json";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png"; ".webp"="image/webp"; ".svg"="image/svg+xml";
  ".ico"="image/x-icon"; ".mp4"="video/mp4"; ".webm"="video/webm"; ".woff2"="font/woff2"; ".txt"="text/plain; charset=utf-8" }
while ($listener.IsListening) {
  $c = $listener.GetContext(); $res = $c.Response
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.LocalPath).TrimStart("/")
    if ([string]::IsNullOrEmpty($p) -or $p.EndsWith("/")) { $p += "index.html" }
    $file = Join-Path $Root $p
    if (Test-Path $file -PathType Leaf) {
      $t = $mime[[IO.Path]::GetExtension($file).ToLower()]; if (-not $t) { $t = "application/octet-stream" }
      $b = [IO.File]::ReadAllBytes($file)
      $res.ContentType = $t; $res.ContentLength64 = $b.Length; $res.OutputStream.Write($b, 0, $b.Length)
    } else {
      $res.StatusCode = 404; $m = [Text.Encoding]::UTF8.GetBytes("404 $p"); $res.OutputStream.Write($m, 0, $m.Length)
    }
  } catch { } finally { try { $res.OutputStream.Close() } catch { } }
}
