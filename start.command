#!/bin/bash
# 双击启动「一锅出」家庭手机入口。
# 只在局域网提供菜谱库整库浏览（可搜、可翻、本周待试置顶）。
# 不构建旧菜饭页面，不启动推荐代理。旧推荐页仍留在仓库里，但不是这个首页。
# 第一次双击若被 macOS 拦，右键 → 打开 → 确认。

cd "$(dirname "$0")"
PORT=8081
LIB="$(pwd)/recipe-library"

if [ ! -f "$LIB/browse.html" ] || [ ! -f "$LIB/index.json" ]; then
  echo "错误：找不到菜谱库浏览页（recipe-library/browse.html）。" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "错误：需要 python3 才能打开浏览页。" >&2
  exit 1
fi

# 停掉上次占着的网页端口。若以前开过推荐代理，把 8765 也关掉，避免手机还打到旧接口。
stop_port() {
  local port="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  local pids
  pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
  fi
}
stop_port "$PORT"
stop_port 8765

LAN_IP=""
if command -v ipconfig >/dev/null 2>&1; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [ -z "$LAN_IP" ]; then
    LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
  fi
fi
if [ -z "$LAN_IP" ] && command -v hostname >/dev/null 2>&1; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi

nohup python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$LIB" > static.log 2>&1 &
STATIC_PID=$!

if command -v curl >/dev/null 2>&1; then
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fs "http://127.0.0.1:${PORT}/browse.html" -m 1 >/dev/null 2>&1; then
      echo "✓ 菜谱库浏览页就绪"
      break
    fi
    sleep 0.5
  done
fi

URL="http://127.0.0.1:${PORT}/browse.html"
if command -v open >/dev/null 2>&1; then
  open "$URL"
fi

echo ""
echo "✅ 一锅出菜谱库已在局域网打开。本周待试在列表最上面。"
echo "💻 Mac 浏览器: ${URL}"
echo "   打开 http://127.0.0.1:${PORT}/ 也会进同一页。"
if [ -n "$LAN_IP" ]; then
  echo "📱 同一 Wi-Fi 的 iPhone，用 Safari 打开: http://${LAN_IP}:${PORT}/browse.html"
  echo "   分享 → 添加到主屏幕。步骤见 docs/mobile-pwa.md"
else
  echo "⚠ 没读到局域网 IP。到 Mac「系统设置 → 网络」看 Wi-Fi 地址，再打开 http://<那个IP>:${PORT}/browse.html"
fi
echo "旧推荐页不再由此脚本打开，也不监听 8765。"
echo "停止: lsof -ti :${PORT} | xargs kill -9"
echo "日志: static.log · PID ${STATIC_PID}"
echo "Terminal 可以关掉，网页会继续在后台跑。"
