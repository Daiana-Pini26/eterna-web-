# Convierte tus originales a los formatos de la web (necesita FFmpeg: winget install Gyan.FFmpeg)
#
#  originales\fotos\xv-02.jpg   -> img\xv-02.webp (1600 px) + img\xv-02-800.webp (800 px)
#  originales\reels\reel-04.mov -> video\reel-04.mp4 (720x1280, max 20 s) + img\reel-04.webp (portada)
#  originales\hero\hero.mov     -> video\hero.mp4 (1080 p, sin audio, max 20 s) + img\hero-poster.webp
#
# El NOMBRE del original tiene que ser el nombre que usa la web (ver LEEME.txt).
# Uso (desde la carpeta del proyecto):  powershell -ExecutionPolicy Bypass -File tools\convertir.ps1

$Root = Split-Path -Parent $PSScriptRoot
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff) { $ff = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }
if (-not $ff) { Write-Host "No encuentro FFmpeg. Instalalo con: winget install Gyan.FFmpeg" -ForegroundColor Red; exit 1 }
$n = 0

Get-ChildItem "$Root\originales\fotos" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '\.(jpe?g|png|tiff?)$' } | ForEach-Object {
  $b = $_.BaseName
  & $ff -hide_banner -loglevel error -y -i $_.FullName -vf "scale='min(1600,iw)':-2" -c:v libwebp -q:v 80 "$Root\img\$b.webp"
  & $ff -hide_banner -loglevel error -y -i $_.FullName -vf "scale='min(800,iw)':-2" -c:v libwebp -q:v 78 "$Root\img\$b-800.webp"
  Write-Host "foto  $b"; $n++
}
Get-ChildItem "$Root\originales\reels" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '\.(mov|mp4|m4v)$' } | ForEach-Object {
  $b = $_.BaseName
  & $ff -hide_banner -loglevel error -y -i $_.FullName -vf "scale='min(720,iw)':-2" -c:v libx264 -preset slow -crf 26 -profile:v main -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -t 20 "$Root\video\$b.mp4"
  & $ff -hide_banner -loglevel error -y -ss 2 -i "$Root\video\$b.mp4" -frames:v 1 -vf "scale=540:-2" -c:v libwebp -q:v 75 "$Root\img\$b.webp"
  Write-Host "reel  $b"; $n++
}
Get-ChildItem "$Root\originales\hero" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '\.(mov|mp4|m4v)$' } | Select-Object -First 1 | ForEach-Object {
  & $ff -hide_banner -loglevel error -y -i $_.FullName -vf "scale='min(1920,iw)':-2" -an -c:v libx264 -preset slow -crf 27 -profile:v main -pix_fmt yuv420p -movflags +faststart -t 20 "$Root\video\hero.mp4"
  & $ff -hide_banner -loglevel error -y -ss 1 -i "$Root\video\hero.mp4" -frames:v 1 -c:v libwebp -q:v 75 "$Root\img\hero-poster.webp"
  Write-Host "hero  hero.mp4"; $n++
}
Write-Host "Listo: $n archivo(s) convertidos." -ForegroundColor Green
