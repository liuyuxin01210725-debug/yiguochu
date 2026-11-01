#!/bin/bash
# 双击启动「一锅出」本地家庭入口：构建 ready 范围 dist、拉起本地网页，并打开页面。
#
# 2026-11 家庭重启阶段约定（见终案 triad-final）：
# - 构建必须用 --rice-catalog-scope ready（禁止 calibration，避免冲垮家庭可见白名单）
# - 家庭验收理想状态是代理关闭且主路径不打 localhost:8765
# - 当前 UI（runtime + rice-meal-v1）关键路径仍强依赖代理：
#     index.html PROXY_BASE → http://localhost:8765
#     runRiceMealPlanning → POST /plan-meal
#     chooseRiceMealPlan  → POST /generate-plan
#   故此处「最小保留」启动 ai_proxy；不是重新打开 DeepSeek/LLM 主线。
#   确定性 generationMode=deterministic；不部署、不合 main。
# - 第一次双击若被 macOS 拦, 右键 → 打开 → 确认

cd "$(dirname "$0")"

# 当前本地入口只服务来源菜谱 / 菜饭产品。Node.js 仅用于构建 dist。
NODE_BIN="${PLANNER_NODE_EXECUTABLE:-}"
if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node 2>/dev/null)"
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "错误：本地菜饭页面构建需要 Node.js。" >&2
  exit 1
fi

# 家庭范围：与 dist 意图对齐，只出 ready 集。
export YIGUOCHU_PRODUCT_FOCUS="rice-meal-v1"
export YIGUOCHU_GENERATION_MODE="deterministic"
export YIGUOCHU_RICE_CATALOG_SCOPE="ready"
# 每次双击都换缓存版本，避免浏览器继续显示上一次本地构建。
LOCAL_BUILD_ID="rice-meal-local-$(date +%Y%m%d%H%M%S)"
if ! "$NODE_BIN" tools/build-dist.mjs --out-dir dist --build-id "$LOCAL_BUILD_ID" --planner-rollout direct-recommend --generation-mode deterministic --product-focus rice-meal-v1 --rice-catalog-scope ready >/dev/null; then
  echo "错误：本地菜饭页面构建失败。" >&2
  exit 1
fi

# 清掉可能残留的本地端口（8081 必清；8765 仅在最小保留代理时复用）
lsof -ti :8081 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti :8765 2>/dev/null | xargs kill -9 2>/dev/null

# 最小保留：当前家庭关键路径仍打 8765（见文件头注释）。确认 UI 改成纯静态前不要删。
# 可选关掉：YIGUOCHU_DISABLE_AI_PROXY=1 ./start.command （仅用于验收「无代理」；推荐菜饭会失败）
if [ "${YIGUOCHU_DISABLE_AI_PROXY:-0}" = "1" ]; then
  echo "⚠ 已按 YIGUOCHU_DISABLE_AI_PROXY=1 跳过 ai_proxy（8765）。静态页仍可开，但推荐菜饭主路径会失败。"
  PROXY_PID=""
else
  nohup python3 ai_proxy.py > proxy.log 2>&1 &
  PROXY_PID=$!
  echo "proxy 最小保留启动 (PID $PROXY_PID), 日志: proxy.log"
  # 软等待就绪，不把失败当成硬退出（静态服仍可开）
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fs http://localhost:8765/health -m 1 >/dev/null 2>&1; then
      echo "✓ proxy 就绪（家庭路径仍依赖 /plan-meal 与 /generate-plan）"
      break
    fi
    sleep 0.5
  done
fi

# 通过 localhost 提供本次构建产物，避免 raw index.html 的构建占位符回退 legacy 产品。
nohup python3 -m http.server 8081 --bind 127.0.0.1 --directory dist > static.log 2>&1 &
STATIC_PID=$!
echo "网页服务启动中 (PID $STATIC_PID), 日志: static.log"

# 等本地网页服务就绪 (最多 5 秒)
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs http://localhost:8081/ -m 1 >/dev/null 2>&1; then
    echo "✓ 网页服务就绪"
    break
  fi
  sleep 0.5
done

open "http://localhost:8081"

echo ""
echo "✅ 启动完成。Terminal 窗口可以关掉，本地服务会继续在后台运行。"
if [ "${YIGUOCHU_DISABLE_AI_PROXY:-0}" = "1" ]; then
  echo "构建范围: ready · generationMode: deterministic · 代理: 已关闭（推荐菜饭主路径不可用）"
else
  echo "构建范围: ready · generationMode: deterministic · 代理: 最小保留（关键路径仍需 8765）"
fi
echo "想停止网页: lsof -ti :8081 | xargs kill -9"
echo "若代理残留可杀: lsof -ti :8765 | xargs kill -9"
