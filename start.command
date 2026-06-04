#!/bin/bash
# 双击启动「今天吃什么」: 拉起 AI 代理 + 打开 HTML
# 第一次双击若被 macOS 拦, 右键 → 打开 → 确认

cd "$(dirname "$0")"

# 杀掉旧的 proxy (端口 8765 占用)
lsof -ti :8765 2>/dev/null | xargs kill -9 2>/dev/null

# 后台启 proxy (日志写到 proxy.log)
nohup python3 ai_proxy.py > proxy.log 2>&1 &
PROXY_PID=$!
echo "proxy 启动中 (PID $PROXY_PID), 日志: proxy.log"

# 等 proxy 就绪 (最多 5 秒)
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs http://localhost:8765/health -m 1 >/dev/null 2>&1; then
    echo "✓ proxy 就绪"
    break
  fi
  sleep 0.5
done

# 默认浏览器打开 HTML
open "index.html"

echo ""
echo "✅ 启动完成。Terminal 窗口可以关掉, proxy 在后台跑。"
echo "想停 proxy: lsof -ti :8765 | xargs kill -9"
