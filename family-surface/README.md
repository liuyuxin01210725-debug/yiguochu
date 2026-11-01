# family-surface · S1 新表面静态原型

**场景：** 女儿 · 工作日早餐  
**分支：** `family-restart`  
**日期：** 2026-11-01 Asia/Taipei  

## 三道菜

1. **白菜豆腐焖饭**（待试）— catalog `home-cabbage-tofu-rice`
2. **肉糜青菜饭**（待试）— catalog `home-greens-minced-pork-rice`
3. **青菜豆腐汤泡饭**（家常 · 口述 / 待补步骤）— 不经旧 matcher

## 打开方式

### 本机文件

```bash
open "/Users/liuyuxin/Documents/一锅出/family-surface/index.html"
```

或浏览器地址栏：

`file:///Users/liuyuxin/Documents/一锅出/family-surface/index.html`

### 局域网静态服务（手机 Safari 可开）

在仓根或本目录：

```bash
cd "/Users/liuyuxin/Documents/一锅出/family-surface"
python3 -m http.server 8091 --bind 0.0.0.0
```

然后手机打开：`http://192.168.0.88:8091/`（IP 以本机局域网为准）。

也可用仓内脚本：`./family-surface/serve.command`

## 反馈

页内「吃光 / 剩了 / 没做成」写入浏览器 localStorage，可导出 `feedback.md`。  
正式回写 `docs/family-meals.md` 实做栏属 S2；本切片不改 selector / 不修代理 / 不合 main / 不部署公网。

## 明确不是

- 不是旧 `index.html` 推荐流
- 不调用 `/plan-meal` / `/generate-plan`
- 不是把旧 PWA 装手机冒充完成
