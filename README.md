# live2d-widget

网页 Live2D 看板娘组件 —— 在你的网站右下角放一只会说话、能换装、可交互的萌娘。

![License](https://img.shields.io/badge/license-MIT-green.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)

## 功能特性

- 一行 `<script>` 接入，无需构建工具、**零第三方运行时依赖**（拖拽等功能均为原生 JS 实现）
- 模型 / 材质（皮肤）在线切换，支持随机或顺序模式
- 消息系统：按时段问候、按来路（搜索引擎）欢迎、节日祝福、空闲吐槽
- 一言（Hitokoto）、古诗词等多种句子 API 可选
- 内置小彩蛋：打飞机（Asteroids）小游戏、看板娘截图
- 所有配置集中在 `js/autoload.js` 的 `waifuSettings` 对象中，开箱即改
- 小屏自适应：页面宽度不足时自动隐藏，关闭后 24 小时内显示"看板娘"恢复按钮

## 在线演示

- [demo1：基础接入示例](https://cnzeropro.github.io/live2d-widget/demo/demo1.html)
- [demo2：登录页"门帘"交互示例](https://cnzeropro.github.io/live2d-widget/demo/demo2.html)

本地查看：在仓库根目录启动任意静态服务器后访问 `demo/` 目录，例如：

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000/demo/demo1.html
```

## 快速开始

### 方式一：直接引入（使用公共 CDN 与公共模型 API）

在你的页面 `</body>` 前加入（推荐锁定版本号以保证稳定，追新可用 `@master`）：

```html
<script src="https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget@v1.6.1/js/autoload.js" defer></script>
```

### 方式二：自定义配置（推荐）

将 `js/autoload.js` 内容复制到你的站点，按需修改 `waifuSettings` 后引入：

```html
<script src="/path/to/your/autoload.js" defer></script>
```

> 注意：`resourcePath` 指向组件静态资源（CSS / JS / 字体 / 文案 JSON）的根目录，
> 自托管时请将它改为你的部署地址，并保持仓库目录结构不变。

### 方式三：自建模型 API

默认模型数据来自 [fghrsh/live2d_api](https://github.com/fghrsh/live2d_api) 的公共接口，
自建后将 `waifuApi` 改为你的接口地址即可（部署方式参考其仓库文档）。

## 配置项参考

`js/autoload.js` 中的全部配置项：

### 后端接口

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `resourcePath` | string | jsDelivr 自建源 | 资源根目录，CSS / JS / 字体及各相对路径配置均基于它解析 |
| `waifuApi` | string | `https://live2d.fghrsh.net/api` | 看板娘模型 API，自建参考 [live2d_api](https://github.com/fghrsh/live2d_api) |
| `tipsPath` | string | `json/waifu-tips.json` | 消息文案 JSON 路径（相对 `resourcePath` 解析，也可填完整 URL） |
| `hitokotoApi` | object | 见下 | 一言数据源（需返回 JSON），字段映射配置 |

`hitokotoApi` 为对象配置，换一言服务**只改配置、不改代码**：

```js
hitokotoApi: {
  url: "https://v1.hitokoto.cn", // 接口地址
  text: "hitokoto",              // 句子文本字段（支持点路径，如 "data.content"）
  from: "from",                  // 出处字段，填充文案 JSON 中 hitokoto.source 的 {from}（可选）
  creator: "creator"             // 投稿人字段，填充 {creator}（可选）
}
```

例如切换到古诗词接口：`{ url: "https://v2.jinrishici.com/one.json", text: "data.content", from: "data.origin.title" }`，并可配合修改 JSON 中 `hitokoto.source` 模板调整来源文案。

常用一言服务配置示例（直接替换 `hitokotoApi` 的值即可）：

```js
// hitokoto.cn（默认）
hitokotoApi: { url: "https://v1.hitokoto.cn", text: "hitokoto", from: "from", creator: "creator" };

// lwl12.com
hitokotoApi: { url: "https://api.lwl12.com/hitokoto/v1?encode=realjson", text: "text", from: "source", creator: "author" };

// jinrishici.com（古诗词）
hitokotoApi: { url: "https://v2.jinrishici.com/one.json", text: "data.content", from: "data.origin.title", creator: "data.origin.author" };
```

> 要求接口返回 JSON；原 ipayy.net 返回纯文本，不再适用。
> 来源说明文案模板在文案 JSON 的 `hitokoto.source` 中（`{from}` / `{creator}` 占位符，未配置的字段替换为空），可按所选服务自行调整措辞。

### 资源路径

以下路径均为**相对 `resourcePath`** 的形式（整体换源只改 `resourcePath` 一处），单项换源时改为完整 URL 即可：

```js
cssPath: "css/waifu.css",              // 部件样式
widgetPath: "js/waifu-tips.js",        // 部件核心逻辑
live2dCorePath: "lib/live2d.js",       // 详见"第三方库说明"
asteroidsPath: "lib/asteroids.min.js", // "打飞机"小游戏
```

### 模型与切换

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelId` | number | `1` | 默认模型 ID |
| `texturesId` | number | `53` | 默认材质 ID |
| `modelSwitchMode` | string | `sequential` | 模型切换方式：`random`（随机）/ `sequential`（顺序） |
| `texturesSwitchMode` | string | `random` | 材质切换方式：`random`（随机）/ `sequential`（顺序） |

### 工具栏按钮显隐

| 配置项 | 默认值 | 控制的按钮 |
| --- | --- | --- |
| `showToolMenu` | `true` | 工具栏整体 |
| `showTurnToHomePage` | `true` | 回到主页 |
| `showHitokoto` | `true` | 一言 |
| `showGame` | `true` | 打飞机小游戏 |
| `showSwitchModel` | `true` | 切换模型（换人） |
| `showSwitchTextures` | `true` | 切换材质（换装） |
| `showTakeScreenshot` | `true` | 看板娘截图 |
| `showTurnToAboutPage` | `true` | 跳转关于页 |
| `showCloseWaifu` | `true` | 关闭看板娘 |

### 提示消息

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showTips` | boolean | `true` | 是否显示提示框 |
| `showCopyMessage` | boolean | `true` | 用户复制内容时的提示 |
| `showF12Message` | boolean | `true` | 打开浏览器控制台时的提示 |

### 样式

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `waifuWidth` | string | `300px` | 看板娘宽度（支持任意 CSS 单位，画布分辨率取其像素数值） |
| `waifuHeight` | string | `380px` | 看板娘高度 |
| `waifuTipsWidth` | string | `250px` | 提示框宽度 |
| `waifuTipsHeight` | string | `70px` | 提示框高度 |
| `waifuFontSize` | string | `12px` | 提示框字号 |
| `waifuToolLineHeight` | string | `30px` | 工具栏行高 |
| `waifuToolTop` | string | `80px` | 工具栏顶部偏移（相对看板娘容器） |
| `waifuMinWidth` | number | `456` | 页面视口小于该宽度时隐藏看板娘 |
| `waifuEdge` | string | `left` | 贴边方向：`left` / `right` |
| `waifuEdgeOffset` | number | `0` | 贴边偏移（数字按像素处理，也可填带单位的字符串） |
| `waifuDraggable` | string | `disable` | 拖拽（原生 JS 实现）：`disable` / `axis-x`（水平） / `unlimited`（自由），拖拽把手为看板娘画布 |
| `waifuDraggableRevert` | boolean | `true` | 松开鼠标后是否平滑还原位置 |

### 杂项

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `homePageUrl` | string | `auto` | 主页地址，`auto` 时自动取当前域名根路径 |
| `aboutPageUrl` | string | 本仓库地址 | 关于页地址 |
| `screenshotCaptureName` | string | `waifu.png` | 截图保存文件名 |

### 行为参数

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `hiddenExpireMs` | number | `86400000` | 关闭看板娘后多少毫秒内保持隐藏（期间仅显示恢复按钮），86400000 即 24 小时 |
| `idleMessageInterval` | number | `25000` | 用户空闲后随机消息的轮播间隔（毫秒） |

## 自定义消息文案

全部文案集中维护在 `json/waifu-tips.json`，按场景顶层分组，**扩展任何消息都只需改 JSON、无需改代码**：

| 分组 | 结构 | 触发时机 |
| --- | --- | --- |
| `welcome.hourTips` | `[起始小时, 结束小时, 文案]` 数组 | 主页按时段问候（23 点 ~ 次日 5 点走 `welcome.night`） |
| `welcome.referrer` | `default` / `sameSite` / `baidu` / `so` / `google` / `other` 模板 | 非主页时按来路问候，支持 `{title}`（页面标题）、`{keyword}`（搜索词）、`{host}`（来路域名）占位符 |
| `idle` | 字符串数组 | 用户空闲后随机轮播（含命中节日的 `festival` 消息） |
| `hitokoto` | `error` 提示 + `source` 来源模板 | 一言；`source` 支持 `{from}` / `{creator}`（由 `hitokotoApi` 字段映射填充） |
| `interaction` | 按场景键值：`texturesNone` / `texturesNew` / `screenshot` / `hide` / `consoleOpen` / `copy` / `back` | 换装、截图、关闭、打开控制台、复制内容、切回页面 |
| `mouseover` / `click` | `{selector, text}` 规则数组 | 悬停 / 点击匹配元素，`{text}` 占位符引用元素文本 |
| `festival` | `{date, text}`，`date` 支持单日（`10/01`）或区间（`11/10-11/12`） | 命中时间区间的消息**追加到空闲池**随机轮播（并非进入页面立即弹出），支持 `{year}`、`{year-1949}` 占位符 |

常用扩展示例：

```jsonc
// 加一条空闲吐槽：直接往 idle 数组追加
"idle": ["好久不见……", "新加的一条吐槽~"]

// 加一个节日：往 festival 数组追加（date 写 "MM/DD" 或 "MM/DD-MM/DD" 区间）
{ "date": "05/04", "text": ["今天是<span style=\"color:#0099cc;\">青年节</span>呀！"] }

// 改一言来源文案：改 hitokoto.source 模板（{from}/{creator} 按配置映射填充）
"source": "这句话来自《{from}》，不错吧~"
```

`text` 均可传数组随机抽取一条，且支持内联 HTML（`<span>` 高亮等）。

## 目录结构

```text
live2d-widget/
├── css/
│   └── waifu.css          # 部件样式与图标字体定义
├── demo/
│   ├── demo1.html         # 基础接入示例
│   └── demo2.html         # 登录页"门帘"交互示例
├── font/                  # FontAwesome 4.7 图标字体（工具栏图标）
├── img/                   # 示例图片
├── js/
│   ├── autoload.js        # 入口：全局配置 + 资源自动加载
│   └── waifu-tips.js      # 核心逻辑：DOM、消息系统、模型切换
├── lib/                   # 第三方脚本（自托管，勿改）
│   ├── live2d.js          # Live2D Cubism 2 渲染核心（官方核心 + loadlive2d/截图封装）
│   └── asteroids.min.js   # 彩蛋小游戏（官方代码镜像，按需懒加载）
├── json/
│   └── waifu-tips.json    # 消息文案配置
├── favicon/
└── LICENSE                # MIT
```

## 本地调试

```bash
# 1. 启动静态服务器
python -m http.server 8000

# 2. 打开示例页
# http://localhost:8000/demo/demo1.html
```

调试本地代码时，将 `js/autoload.js` 中的 `resourcePath` 临时改为 `http://localhost:8000/` 即可。

## 已知行为说明

- 模型与材质选择会记在 `localStorage`（`modelId` / `texturesId`），下次访问自动恢复
- 关闭看板娘后状态保存 `hiddenExpireMs` 毫秒（默认 86400000 即 24 小时，存储键 `waifu-display`），期间刷新页面显示"看板娘"恢复按钮
- 视口宽度 ≤ `waifuMinWidth` 时不初始化部件；CSS 侧在 ≤ 567px 时也有一层兜底隐藏
- `waifuWidth` / `waifuHeight` 同时决定容器尺寸与画布分辨率（即模型渲染分辨率）

## 第三方库说明

两个第三方脚本位于 `lib/` 目录，均为自托管分发，版本现状如下：

| 文件 | 来源 | 版本现状 |
| --- | --- | --- |
| `lib/live2d.js` | Live2D Cubism 2 WebGL SDK（官方核心 + `loadlive2d` / 截图封装） | Cubism 2 SDK 已停止更新（约 2017 年最终版），**此份即最新兼容版，无可升级版本** |
| `lib/asteroids.min.js` | [websiteasteroids.com](http://www.websiteasteroids.com/) 官方代码镜像 | 上游多年未更新，v1.6.1 已替换为与官方一致的压缩版 |

- `live2d.js.map`（source map）已于 v1.6.1 移除，仅调试用途，生产环境无需加载
- **为什么不直接换"官方最新核心"**：官方现行分发的 Cubism 核心（如 npm `live2d-widgets@1` 内的 `live2d.min.js`、Cubism 5 的 `live2dcubismcore.min.js`）不暴露 `loadlive2d` / `Live2D.captureFrame` 接口，与本组件的模型 API 不兼容；如需迁移请参考 [stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget) 的 TypeScript 重写版
- 若希望直接使用第三方 CDN 源，可通过配置项覆盖（留空则使用自托管默认值）：

```js
// 注意：社区 CDN 上的 live2d 核心（如下例）不含 loadlive2d，与本组件不兼容，仅 asteroids 镜像可直接使用
waifuSettings.live2dCorePath = ""; // 保持自托管
waifuSettings.asteroidsPath = "https://cdn.jsdelivr.net/gh/benjy8001/websiteasteroids@master/asteroids.min.js"; // 官方代码的 jsDelivr 镜像（已验证可用）
```

> 自托管为默认推荐方式：版本锁定、无跨域 / 可用性风险；第三方源仅在自建资源不可用时作为备选。
> 注意：asteroids 官网（websiteasteroids.com）的 HTTPS 证书已失效、仅支持 HTTP，在 HTTPS 站点直连会被浏览器混合内容策略拦截，不建议作为 `asteroidsPath`。

## 致谢

- [stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget) —— 项目原型
- [fghrsh/live2d_api](https://github.com/fghrsh/live2d_api) —— 模型 API 与分发格式
- [Live2D](https://www.live2d.com/) —— 渲染技术
- [FontAwesome 4.7](https://fontawesome.com/v4.7.0/) —— 工具栏图标
- [websiteasteroids.com](http://www.websiteasteroids.com/) —— 打飞机小游戏

## 许可证

[MIT](LICENSE) Copyright (c) 2019-2026 Zero
