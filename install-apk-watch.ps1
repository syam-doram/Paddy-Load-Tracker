$apkRel = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkPath = Join-Path (Get-Location) $apkRel
$adbPath = Join-Path (Get-Location) "tools\platform-tools\adb.exe"

Write-Output "Watcher started. Looking for APK: $apkPath"

while (-not (Test-Path $apkPath)) {
    Write-Output "APK not found yet. Waiting 5s..."
    Start-Sleep -Seconds 5
}

Write-Output "APK found: $apkPath"

if (-not (Test-Path $adbPath)) {
    Write-Output "adb not found at $adbPath. Aborting."
    exit 1
}

Write-Output "Listing connected devices..."
& $adbPath devices | ForEach-Object { Write-Output $_ }

# Wait for a device to appear (max 120s)
$wait = 0
while ($true) {
    $out = & $adbPath devices
    $lines = $out -split "\r?\n" | Where-Object { $_ -match "\w+\tdevice$" }
    if ($lines.Count -gt 0) {
        Write-Output "Device detected:"
        $lines | ForEach-Object { Write-Output $_ }
        break
    }
    if ($wait -ge 120) { Write-Output "No device detected after 120s. Aborting."; exit 2 }
    Write-Output "No device yet. Waiting 5s..."
    Start-Sleep -Seconds 5
    $wait += 5
}

Write-Output "Installing APK..."
$install = & $adbPath install -r $apkPath 2>&1
$install | ForEach-Object { Write-Output $_ }

if ($LASTEXITCODE -eq 0) {
    Write-Output "APK installed successfully."
} else {
    Write-Output "adb install finished with exit code $LASTEXITCODE"
}
