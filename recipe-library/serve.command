#!/bin/bash
# 一锅出 · 菜谱库浏览页（备用端口）。家庭手机默认入口是仓库根目录的 ./start.command（8081）。
cd "$(dirname "$0")"
PORT="${PORT:-8092}"
LAN_IP=""
if command -v ipconfig >/dev/null 2>&1; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$LAN_IP" ] && command -v hostname >/dev/null 2>&1; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
echo "菜谱库浏览 → http://127.0.0.1:${PORT}/browse.html"
if [ -n "$LAN_IP" ]; then
  echo "同一 Wi-Fi 的手机 → http://${LAN_IP}:${PORT}/browse.html"
fi
echo "Ctrl+C 结束。不启推荐代理。"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
