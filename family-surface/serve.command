#!/bin/bash
cd "$(dirname "$0")"
PORT=8091
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
echo "一锅出 S1 family-surface"
echo "本机:   http://127.0.0.1:${PORT}/"
echo "局域网: http://${IP}:${PORT}/"
echo "Ctrl+C 结束。不开公网部署。"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
