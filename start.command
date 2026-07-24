#!/bin/bash
# 双击启动「一锅出」: 拉起 AI 代理、本地网页服务器并打开页面
# 第一次双击若被 macOS 拦, 右键 → 打开 → 确认

cd "$(dirname "$0")"

# V2 本地规划依赖 Node.js 和共享 Worker bridge。必须在清理旧服务前完成真实预检。
NODE_BIN="${PLANNER_NODE_EXECUTABLE:-}"
if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node 2>/dev/null)"
fi
BRIDGE_FILE="$(pwd)/tools/planner-v2-local-bridge.mjs"
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "错误：本地规划组件未就绪，需要 Node.js。" >&2
  exit 1
fi
if [ ! -f "$BRIDGE_FILE" ]; then
  echo "错误：本地规划组件未就绪，规划 bridge 文件缺失。" >&2
  exit 1
fi

PREFLIGHT_REQUEST='{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"recommend","intent":"normal","servings":2,"must_use":[],"prefer_use":["番茄"],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}}'
if ! DEEPSEEK_API_KEY='' PLANNER_NODE_EXECUTABLE="$NODE_BIN" python3 ai_proxy.py --plan-meal "$PREFLIGHT_REQUEST" >/dev/null 2>&1; then
  echo "错误：本地规划组件未就绪，请确认 Node.js 和规划文件完整。" >&2
  exit 1
fi

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
