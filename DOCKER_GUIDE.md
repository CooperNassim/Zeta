# 使用 Docker 运行交易系统

## 前提条件
- 已安装 Docker Desktop for Windows

## 运行步骤

### 方法一：使用 Docker Compose（推荐）

在项目目录下打开 PowerShell，运行：

```powershell
cd c:/Users/Lear/CodeBuddy/20260226125137
docker-compose up --build
```

### 方法二：使用 Docker 命令

```powershell
# 构建镜像
docker build -t trading-system .

# 运行容器
docker run -d -p 3000:3000 --name trading-system trading-system
```

## 访问应用

启动成功后，在浏览器中访问：

```
http://localhost:3000
```

## 常用命令

### 查看容器日志
```powershell
docker-compose logs -f
# 或
docker logs -f trading-system
```

### 停止容器
```powershell
docker-compose down
# 或
docker stop trading-system
```

### 重新启动
```powershell
docker-compose restart
# 或
docker restart trading-system
```

### 进入容器
```powershell
docker exec -it trading-system sh
```

## 注意事项

1. 确保端口 3000 未被占用
2. 代码修改后，由于使用了 volume 挂载，会自动热重载
3. 如果遇到权限问题，可能需要配置 Docker Desktop 的文件共享
