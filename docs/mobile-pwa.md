# 一锅出 · 手机打开菜谱库（家庭局域网）

家庭自用。**不合 main、不部署线上。** 手机主界面是整库浏览：106 张可执行卡，可搜可翻，本周待试置顶。

## Mac

1. Mac 与 iPhone 连**同一 Wi-Fi**。
2. 在仓库根目录双击或运行 `./start.command`（分支 `family-restart`）。
3. Mac 浏览器会打开：

   `http://127.0.0.1:8081/browse.html`

   直接打开 `http://127.0.0.1:8081/` 也会进同一页。
4. 终端里会出现手机地址，类似：

   `📱 同一 Wi-Fi 的 iPhone，用 Safari 打开: http://192.168.x.x:8081/browse.html`

   IP 以你家里为准。

这个入口只提供 `recipe-library` 静态页，绑定 `0.0.0.0:8081`。不构建 rice-meal，不启动推荐代理，不监听 8765。

备用：只想在 `recipe-library` 目录里开另一端口时，运行 `./recipe-library/serve.command`（默认 8092）。家庭默认仍用根目录 `./start.command`。

## iPhone

1. 打开 **Safari**（不要用微信内置浏览器）。
2. 地址栏输入终端里的 `http://192.168.x.x:8081/browse.html`，回车。
3. 确认第一屏是菜谱库，最上面有「本周待试」（白菜豆腐焖饭、肉糜青菜饭）。
4. 点底部分享按钮（方框 + 向上箭头）。
5. 滑到 **「添加到主屏幕」** → 名称保持「一锅出」→ 添加。
6. 回主屏幕点图标。局域网 HTTP 下不会装上离线缓存，但页面可以全屏打开。

## 原生壳

本仓库没有 `ios/YiGuoChu`。如果本机另有壳工程把首页写死成 `http://127.0.0.1:8081/`、旧 `index.html` 或 rice-meal 页面，把地址改成：

`http://<Mac 的局域网 IP>:8081/browse.html`

`/` 会转到同一浏览页。不要改回会调用 plan-meal 的旧首页。

## 限制

| 点 | 说明 |
| --- | --- |
| **HTTP 局域网** | 用 `http://局域网IP:8081/browse.html`，不部署 https 生产站。 |
| **Service Worker** | iOS 只在 `https` 或本机 `localhost` 装 SW。手机走局域网 HTTP 时不会装 SW，离线缓存不可用。加主屏幕仍可靠 `apple-mobile-web-app-*`。 |
| **防火墙** | 若手机打不开，检查 macOS 防火墙是否拦住传入的 Python `http.server`。 |
| **IP 会变** | 路由器重开后局域网 IP 可能变。重跑 `start.command` 看新地址；主屏幕图标失效就按新 URL 再加一次。 |

## 停止

```bash
lsof -ti :8081 | xargs kill -9
```
