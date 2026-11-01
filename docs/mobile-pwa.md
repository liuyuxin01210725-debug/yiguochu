# 一锅出 · iPhone 加到主屏幕（家庭局域网）

家庭自用。**不合 main、不 wrangler 部署线上 pages.dev。** 优先 PWA「添加到主屏幕」，不做原生壳/上架。

## 前提

1. Mac 与 iPhone 连**同一 Wi‑Fi**。
2. 在仓库目录双击或运行 `./start.command`（分支 `family-restart`）。
3. 终端里会出现类似：

   `📱 手机同 WiFi 打开: http://192.168.x.x:8081`

   记下这个地址（IP 以你家里为准）。

## iPhone 装到主屏幕（逐步）

1. 打开 **Safari**（不要用微信内置浏览器）。
2. 地址栏输入上面的 `http://192.168.x.x:8081`，回车。
3. 确认能看到「一锅出」首页。
4. 点底部分享按钮（方框+向上箭头）。
5. 滑到 **「添加到主屏幕」** → 名称保持「一锅出」→ 添加。
6. 回主屏幕点图标；应近似全屏（standalone），无 Safari 地址栏。

## 代理（推荐菜饭）

- 当前家庭关键路径仍可能打 Mac 上的 `8765` 代理（`plan-meal` / `generate-plan`）。
- `start.command` 在家庭 LAN 模式下会把静态页和代理都绑到 `0.0.0.0`，手机打开局域网 IP 时，前端会自动请求 `http://同一IP:8765`。
- 若只想看静态页、关掉代理：`YIGUOCHU_DISABLE_AI_PROXY=1 ./start.command`（推荐菜饭主路径会失败）。

## 限制（请先读）

| 点 | 说明 |
| --- | --- |
| **HTTP 局域网** | 家庭路径用 `http://局域网IP:8081`，**不**偷偷部署 https 生产站。 |
| **Service Worker** | iOS 只在安全上下文（`https` 或本机 `localhost`）装 SW。手机走局域网 HTTP 时 **不会**装 SW，离线缓存不可用；加主屏幕仍可靠 `apple-mobile-web-app-*` + manifest。 |
| **证书** | 若以后要手机也装 SW，需自签/内网 HTTPS 并在 iPhone「信任证书」——本页不默认启用，避免家庭门槛升高。 |
| **防火墙** | 若手机打不开，检查 macOS「防火墙」是否拦了传入的 Python/`http.server`。 |
| **IP 会变** | 路由器重开后局域网 IP 可能变；重跑 `start.command` 看新地址，主屏幕图标若失效需按新 URL 再加一次。 |
| **范围** | 仍是 ready 菜饭家庭重启；不扩菜谱、不 DeepSeek 主线、不碰 923/lab。 |

## 本机 Mac 验收

- Mac 浏览器：`http://localhost:8081`（与以前一致）。
- 手机：用终端打印的局域网 URL，再「添加到主屏幕」。

## 停止

```bash
lsof -ti :8081 | xargs kill -9
lsof -ti :8765 | xargs kill -9
```
