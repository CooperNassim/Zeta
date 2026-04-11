# PowerShell脚本测试后端API和双表同步

Write-Host "🔧 测试后端API和双表同步..." -ForegroundColor Green
Write-Host ""

# 1. 测试基础连接
Write-Host "1. 测试后端服务连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -TimeoutSec 10
    Write-Host "✅ 后端服务连接成功: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务连接失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 测试数据同步API
Write-Host ""
Write-Host "2. 测试股票数据同步API..." -ForegroundColor Yellow

# 模拟301563股票数据
$stockData = @{
    stocks = @(@{
        symbol = "301563"
        name = "测试股票301563"
        currentPrice = 15.68
        prevClose = 15.50
        changePercent = 1.16
        volume = 1589000
        highPrice = 15.80
        lowPrice = 15.45
        openPrice = 15.55
        amount = 24800000
        market = "sz"
        timestamp = (Get-Date).ToString("o")
    })
}

try {
    $jsonBody = $stockData | ConvertTo-Json -Depth 10
    
    Write-Host "  发送数据: $jsonBody" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/market-quotes/realtime/update" -Method Post -Body $jsonBody -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ API调用成功:" -ForegroundColor Green
    Write-Host "  $($response | ConvertTo-Json -Depth 4)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ API调用失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "  错误详情: $responseBody" -ForegroundColor Red
    }
}

# 3. 等待数据库处理
Write-Host ""
Write-Host "3. 等待数据库处理完成..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 4. 检查数据库同步结果
Write-Host ""
Write-Host "4. 检查数据库同步结果..." -ForegroundColor Yellow

try {
    # 使用Node.js脚本检查数据库
    Write-Host "   执行数据库检查..." -ForegroundColor Gray
    node -e "
    const { pool } = require('./src/config/database');
    async function checkSync() {
        const client = await pool.connect();
        try {
            // 检查market_quotes表
            const marketResult = await client.query('SELECT * FROM market_quotes WHERE symbol = \$1', ['301563']);
            console.log('   market_quotes表记录:', marketResult.rows.length > 0 ? '存在' : '不存在');
            
            // 检查stock_pool表
            const poolResult = await client.query('SELECT * FROM stock_pool WHERE symbol = \$1', ['301563']);
            console.log('   stock_pool表记录:', poolResult.rows.length > 0 ? '存在' : '不存在');
            
            // 检查表计数
            const marketCount = await client.query('SELECT COUNT(*) FROM market_quotes');
            const poolCount = await client.query('SELECT COUNT(*) FROM stock_pool');
            console.log('   总记录数 - market_quotes:', marketCount.rows[0].count, '- stock_pool:', poolCount.rows[0].count);
            
            if (marketResult.rows.length > 0 && poolResult.rows.length > 0) {
                console.log('   ✅ 双表同步成功！');
            } else {
                console.log('   ❌ 双表同步存在问题');
            }
        } finally {
            client.release();
        }
    }
    checkSync().catch(console.error);
    "
} catch {
    Write-Host "❌ 数据库检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 测试完成！" -ForegroundColor Green