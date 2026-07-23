#!/bin/bash
# 双击启动「一锅出」: 拉起 AI 代理、本地网页服务器并打开页面
# 第一次双击若被 macOS 拦, 右键 → 打开 → 确认

cd "$(dirname "$0")"

# 杀掉旧的本地服务
lsof -ti :8765 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti :8081 2>/dev/null | xargs kill -9 2>/dev/null

# 后台启 proxy (日志写到 proxy.log)
nohup python3 ai_proxy.py > proxy.log 2>&1 &
PROXY_PID=$!
echo "proxy 启动中 (PID $PROXY_PID), 日志: proxy.log"

# 通过 localhost 提供页面，避免 file:// 与浏览器来源规则造成行为漂移
nohup python3 -m http.server 8081 --bind 127.0.0.1 > static.log 2>&1 &
STATIC_PID=$!
echo "网页服务启动中 (PID $STATIC_PID), 日志: static.log"

# 等 proxy 就绪 (最多 5 秒)
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs http://localhost:8765/health -m 1 >/dev/null 2>&1; then
    echo "✓ proxy 就绪"
    break
  fi
  sleep 0.5
done

# 等本地网页服务就绪 (最多 5 秒)
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs http://localhost:8081/ -m 1 >/dev/null 2>&1; then
    echo "✓ 网页服务就绪"
    break
  fi
  sleep 0.5
done

# 默认浏览器打开本地页面；localhost 页面运行时只请求 localhost:8765
open "http://localhost:8081"

echo ""
echo "✅ 启动完成。Terminal 窗口可以关掉，本地服务会继续在后台运行。"
echo "想停止: lsof -ti :8765 :8081 | xargs kill -9"
