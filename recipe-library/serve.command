#!/bin/bash
# 一锅出 · 菜谱库浏览页静态服务（不启代理、不接 plan-meal）
cd "$(dirname "$0")"
PORT="${PORT:-8092}"
echo "recipe-library browse → http://127.0.0.1:${PORT}/browse.html"
echo "局域网请用本机 IP:${PORT}"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
