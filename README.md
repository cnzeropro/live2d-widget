# live2d-widget

网页 Live2D 看板娘组件 —— 在你的网站右下角放一只会说话、能换装、可交互的萌娘。

![License](https://img.shields.io/badge/license-MIT-green.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)

## 功能特性

- 一行 `<script>` 接入，无需构建工具、无第三方运行时依赖（jQuery 为可选依赖，仅用于拖拽）
- 模型 / 材质（皮肤）在线切换，支持随机或顺序模式
- 消息系统：按时段问候、按来路（搜索引擎）欢迎、节日祝福、空闲吐槽
- 一言（Hitokoto）、古诗词等多种句子 API 可选
- 内置小彩蛋：打飞机（Asteroids）小游戏、看板娘截图
- 所有配置集中在 `js/autoload.js` 的 `live2d_settings` 对象中，开箱即改
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
<script src="https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget@v1.6.0/js/autoload.js" defer></script>
```

### 方式二：自定义配置（推荐）

将 `js/autoload.js` 内容复制到你的站点，按需修改 `live2d_settings` 后引入：

```html
<script src="/path/to/your/autoload.js" defer></script>
```

> 注意：`resourcePath` 指向组件静态资源（CSS / JS / 字体 / 文案 JSON）的根目录，
> 自托管时请将它改为你的部署地址，并保持仓库目录结构不变。

### 方式三：自建模型 API

默认模型数据来自 [fghrsh/live2d_api](https://github.com/fghrsh/live2d_api) 的公共接口，
自建后将 `waifuAPI` 改为你的接口地址即可（部署方式参考其仓库文档）。

## 配置项参考

`js/autoload.js` 中的全部配置项：

### 后端接口

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `resourcePath` | string | jsDelivr CDN | 资源根目录，CSS/JS/字体/JSON 都相对它加载 |
| `waifuAPI` | string | `https://live2d.fghrsh.net/api` | 看板娘模型 API，自建参考 [live2d_api](https://github.com/fghrsh/live2d_api) |
| `jsonPath` | string | 自动拼接 | 消息文案 `waifu-tips.json` 路径 |
| `oneSentenceAPI` | string | `hitokoto.cn` | 一言 API，可选 `lwl12.com`、`hitokoto.cn`、`jinrishici.com`（古诗词）、`ipayy.net` |

### 模型与切换

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelId` | number | `1` | 默认模型 ID |
| `texturesId` | number | `53` | 默认材质 ID |
| `modelRandMode` | string | `switch` | 模型切换方式：`rand`（随机）/ `switch`（顺序） |
| `texturesRandMode` | string | `rand` | 材质切换方式：`rand`（随机）/ `switch`（顺序） |

### 工具栏按钮显隐

| 配置项 | 默认值 | 控制的按钮 |
| --- | --- | --- |
| `showToolMenu` | `true` | 工具栏整体 |
| `showTurnToHomePage` | `true` | 回到主页 |
| `showSwitchOneSentence` | `true` | 切换一言 |
| `showGame` | `true` | 打飞机小游戏 |
| `showSwitchModel` | `true` | 切换模型（换人） |
| `showSwitchTextures` | `true` | 切换材质（换装） |
| `showTakeScreenshot` | `true` | 看板娘截图 |
| `showTurnToAboutPage` | `true` | 跳转关于页 |
| `showCloseWaifu` | `true` | 关闭看板娘 |

### 提示消息

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showOneSentence` | boolean | `true` | 是否显示提示框（一言） |
| `showCopyMessage` | boolean | `true` | 用户复制内容时的提示 |
| `showF12Message` | boolean | `true` | 打开浏览器控制台时的提示 |

### 样式

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `waifuSize` | string | `300x380` | 看板娘大小（宽x高） |
| `waifuTipsSize` | string | `250x70` | 提示框大小 |
| `waifuFontSize` | string | `12px` | 提示框字号 |
| `waifuToolLine` | string | `30px` | 工具栏行高 |
| `waifuToolTop` | string | `-70px` | 工具栏顶部偏移 |
| `waifuMinWidth` | number | `456` | 页面视口小于该宽度时隐藏看板娘 |
| `waifuEdgeSide` | string | `left:0` | 贴边方向与偏移，如 `left:0`、`right:30` |
| `waifuDraggable` | string | `disable` | 拖拽：`disable` / `axis-x`（水平） / `unlimited`（自由），需引入 jQuery 与 jQuery UI |
| `waifuDraggableRevert` | boolean | `true` | 松开鼠标后是否还原位置 |

### 杂项

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `homePageURL` | string | `auto` | 主页地址，`auto` 时自动取当前域名根路径 |
| `aboutPageURL` | string | 本仓库地址 | 关于页地址 |
| `screenshotCaptureName` | string | `waifu.png` | 截图保存文件名 |

## 自定义消息文案

消息文案位于 `json/waifu-tips.json`，分三部分：

- `mouseover`：鼠标悬停在匹配 `selector` 的元素上时显示 `text`（可用 `{text}` 占位符引用元素文本）
- `click`：点击匹配元素时显示
- `festival`：节日祝福，`date` 支持单日（`10/01`）或区间（`11/10-11/12`），可用 `{year}`、`{year-1949}` 占位符

`text` 均可传数组随机抽取一条，且支持内联 HTML（`<span>` 高亮等）。

## 目录结构

```text
live2d-widget/
├── css/
│   └── waifu.css          # 部件样式与图标字体定义
├── demo/
│   ├── demo1.html         # 基础接入示例
│   └── demo2.html         # 登录页"门帘"交互示例
├── fonts/                 # FontAwesome 4.7 图标字体（工具栏图标）
├── img/                   # 示例图片
├── js/
│   ├── autoload.js        # 入口：全局配置 + 资源自动加载
│   ├── waifu-tips.js      # 核心逻辑：DOM、消息系统、模型切换
│   ├── live2d.js          # Live2D 渲染核心（第三方，勿改）
│   └── asteroids.js       # 彩蛋小游戏（第三方，按需懒加载）
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
- 关闭看板娘后状态保存 24 小时（`waifu-display`），期间刷新页面显示"看板娘"恢复按钮
- 视口宽度 ≤ `waifuMinWidth` 时不初始化部件；CSS 侧在 ≤ 567px 时也有一层兜底隐藏

## 致谢

- [stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget) —— 项目原型
- [fghrsh/live2d_api](https://github.com/fghrsh/live2d_api) —— 模型 API 与分发格式
- [Live2D](https://www.live2d.com/) —— 渲染技术
- [FontAwesome 4.7](https://fontawesome.com/v4.7.0/) —— 工具栏图标
- [websiteasteroids.com](http://www.websiteasteroids.com/) —— 打飞机小游戏

## 许可证

[MIT](LICENSE) Copyright (c) 2019-2026 Zero
