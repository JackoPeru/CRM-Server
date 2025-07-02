# Test connettività backend CRM Marmeria
Write-Host "Testing backend connectivity..." -ForegroundColor Yellow

# Test 1: Health check
try {
    Write-Host "\n1. Testing health endpoint..." -ForegroundColor Cyan
    $healthResponse = Invoke-WebRequest -Uri "http://192.168.1.2:3001/api/health" -Method GET -TimeoutSec 10
    Write-Host "Health check: SUCCESS - Status $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "Health check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login con credenziali corrette
try {
    Write-Host "\n2. Testing login with admin credentials..." -ForegroundColor Cyan
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://192.168.1.2:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "Login test: SUCCESS - Status $($loginResponse.StatusCode)" -ForegroundColor Green
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "Token received: $($loginData.token.Substring(0,20))..." -ForegroundColor White
    
} catch {
    Write-Host "Login test: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error details: $errorContent" -ForegroundColor Red
    }
}

# Test 3: Test connettività generale
try {
    Write-Host "\n3. Testing general connectivity..." -ForegroundColor Cyan
    $testConnection = Test-NetConnection -ComputerName "192.168.1.2" -Port 3001 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "Network connectivity: SUCCESS - Port 3001 is reachable" -ForegroundColor Green
    } else {
        Write-Host "Network connectivity: FAILED - Port 3001 is not reachable" -ForegroundColor Red
    }
} catch {
    Write-Host "Network test: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "\nTest completed." -ForegroundColor Yellow