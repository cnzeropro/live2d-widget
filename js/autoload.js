/*!
 * live2d-widget 看板娘配置与自动加载入口（v1.6.1）
 *
 * 接入方式：在页面底部引入本文件即可
 *   <script src="autoload.js" defer></script>
 *
 * 说明：本组件不依赖任何第三方库，拖拽等功能均为原生 JS 实现
 */

/**
 * 全局配置对象
 * 部件（waifu-tips.js）会读取这里的全部字段
 */
window.waifuSettings = {
  // ---------- 后端接口 ----------
  resourcePath: "https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget/", // 资源根目录，下方相对路径均基于它解析，整体换源只改这一处
  waifuApi: "https://live2d.fghrsh.net/api", // 看板娘 API，自建参考 https://github.com/fghrsh/live2d_api
  tipsPath: "json/waifu-tips.json", // 消息文案 JSON 路径（相对 resourcePath）

  // ---------- 一言（Hitokoto）数据源（需返回 JSON） ----------
  // url 为接口地址；text / from / creator 为响应中的字段名，支持点路径（如 "data.content"）；
  // from / creator 可选，用于拼接文案 JSON 中 hitokoto.source 模板的 {from} / {creator} 占位符
  hitokotoApi: {
    url: "https://v1.hitokoto.cn",  // 接口地址
    text: "hitokoto",               // 句子文本字段
    from: "from",                   // 出处字段（书名 / 来源）
    creator: "creator"              // 投稿人字段
  },

  // ---------- 资源路径（相对 resourcePath 解析，单项换源时改为完整 URL） ----------
  cssPath: "css/waifu.css",              // 部件样式
  widgetPath: "js/waifu-tips.js",        // 部件核心逻辑
  live2dCorePath: "lib/live2d.js",       // Live2D Cubism 2 渲染核心（官方已停发，仓库内置兼容构建，勿换官方核心版——其不含 loadlive2d）
  asteroidsPath: "lib/asteroids.min.js", // "打飞机"小游戏脚本

  // ---------- 默认模型 ----------
  modelId: 1,      // 默认模型 ID
  texturesId: 53,  // 默认材质 ID

  // ---------- 工具栏按钮显隐 ----------
  showToolMenu: true,          // 显示工具栏
  showTurnToHomePage: true,    // 显示回到主页按钮
  showHitokoto: true,          // 显示一言按钮
  showGame: true,              // 显示 game 按钮
  showSwitchModel: true,       // 显示模型切换按钮
  showSwitchTextures: true,    // 显示材质切换按钮
  showTakeScreenshot: true,    // 显示看板娘截图按钮
  showTurnToAboutPage: true,   // 显示跳转关于页按钮
  showCloseWaifu: true,        // 显示关闭看板娘按钮

  // ---------- 切换方式（可选 "random" 随机 / "sequential" 顺序） ----------
  modelSwitchMode: "sequential",  // 模型切换方式
  texturesSwitchMode: "random",   // 材质切换方式

  // ---------- 提示消息选项 ----------
  showTips: true,         // 显示提示框
  showCopyMessage: true,  // 显示复制内容提示
  showF12Message: true,   // 显示进入控制台提示

  // ---------- 看板娘样式 ----------
  waifuWidth: "300px",         // 看板娘宽度（支持任意 CSS 单位，画布分辨率取其像素数值）
  waifuHeight: "380px",        // 看板娘高度
  waifuTipsWidth: "250px",     // 提示框宽度
  waifuTipsHeight: "70px",     // 提示框高度
  waifuFontSize: "12px",       // 提示框字体，例如 "12px", "30px"
  waifuToolLineHeight: "30px", // 工具栏行高，例如 "20px", "36px"
  waifuToolTop: "80px",        // 工具栏顶部偏移（相对看板娘容器）
  waifuMinWidth: 456,          // 页面视口小于该宽度时隐藏看板娘
  waifuEdge: "left",           // 贴边方向，可选 "left"(靠左), "right"(靠右)
  waifuEdgeOffset: 0,          // 贴边偏移（数字按像素处理，也可填带单位的字符串）
  // 原生 JS 拖拽（无第三方依赖），拖拽把手为看板娘画布
  waifuDraggable: "disable",  // 可选 "disable"(禁用), "axis-x"(只能水平拖拽), "unlimited"(自由拖拽)
  waifuDraggableRevert: true, // 松开鼠标后是否平滑还原拖拽位置

  // ---------- 行为参数 ----------
  hiddenExpireMs: 86400000,   // 关闭看板娘后，多少毫秒内保持隐藏（期间仅显示恢复按钮），86400000 即 24 小时
  idleMessageInterval: 25000, // 用户空闲后随机消息的轮播间隔（毫秒）

  // ---------- 杂项设置 ----------
  homePageUrl: "auto", // 主页地址，可选 "auto"(自动), "{URL 网址}"
  aboutPageUrl: "https://github.com/cnzeropro/live2d-widget", // 关于页地址
  screenshotCaptureName: "waifu.png" // 看板娘截图文件名
};

/**
 * 异步加载 CSS / JS 资源
 * @param {string} url - 资源地址
 * @param {"css"|"js"} type - 资源类型
 * @returns {Promise<string>} 加载成功时 resolve(url)，失败时 reject(Error)
 */
function loadResourceAsync(url, type) {
  return new Promise((resolve, reject) => {
    let tag;
    if (type === "css") {
      tag = document.createElement("link");
      tag.rel = "stylesheet";
      tag.href = url;
    } else if (type === "js") {
      tag = document.createElement("script");
      tag.src = url;
    } else {
      reject(new Error(`Unsupported resource type: ${type}`));
      return;
    }
    tag.onload = () => resolve(url);
    tag.onerror = () => reject(new Error(`Failed to load resource: ${url}`));
    document.head.appendChild(tag);
  });
}

/**
 * 解析资源地址：绝对 URL（http(s):// 或协议相对 //）原样返回，相对路径基于 resourcePath 拼接
 * （配置块中的路径均为相对 resourcePath 的形式，统一在此解析）
 * @param {string} path - 完整 URL 或相对 resourcePath 的路径
 * @returns {string}
 */
function resolveResource(path) {
  return /^(https?:)?\/\//.test(path) ? path : waifuSettings.resourcePath + path;
}

// 加载样式、渲染核心与部件逻辑
Promise.all([
  loadResourceAsync(resolveResource(waifuSettings.cssPath), "css"),
  loadResourceAsync(resolveResource(waifuSettings.live2dCorePath), "js"),
  loadResourceAsync(resolveResource(waifuSettings.widgetPath), "js")
]).then(() => {
  // 资源就绪后初始化部件（initWidget 由 waifu-tips.js 暴露）
  initWidget(resolveResource(waifuSettings.tipsPath), waifuSettings.waifuApi);
}).catch(error => {
  console.error("[waifu] Failed to load widget assets:");
  console.error(error);
});

// 控制台彩蛋：输出看板娘 ASCII 艺术
console.log(`
  く__,.ヘヽ.        /  ,ー､ 〉
           ＼ ', !-─‐-i  /  /´
           ／｀ー'       L/／｀ヽ、
         /   ／,   /|   ,   ,       ',
       ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
        ﾚ ﾍ 7イ｀ﾄ   ﾚ'ｧ-ﾄ、!ハ|   |
          !,/7 '0'     ´0iソ|    |
          |.从"    _     ,,,, / |./    |
          ﾚ'| i＞.､,,__  _,.イ /   .i   |
            ﾚ'| | / k_７_/ﾚ'ヽ,  ﾊ.  |
              | |/i 〈|/   i  ,.ﾍ |  i  |
             .|/ /  ｉ：    ﾍ!    ＼  |
              kヽ>､ﾊ    _,.ﾍ､    /､!
              !'〈//｀Ｔ´', ＼  ｀7'ｰr'
              ﾚ'ヽL__|___i,___,ンﾚ|ノ
                  ﾄ-,/  |___./
                  'ｰ'    !_,.:
`);
