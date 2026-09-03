// live2d-widget 看板娘配置与自动加载入口
// 在页面底部引入本文件即可接入：<script src="autoload.js" defer></script>
window.live2d_settings = {
  // 后端接口
  resourcePath: "https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget/", // 资源根目录
  waifuAPI: "https://live2d.fghrsh.net/api", // 看板娘 API，自建参考 https://github.com/fghrsh/live2d_api
  jsonPath: "", // 消息文案 json 路径（下方自动拼接）
  oneSentenceAPI: "hitokoto.cn", // 一言 API，可选 "lwl12.com", "hitokoto.cn", "jinrishici.com"(古诗词), "ipayy.net"

  // 默认模型
  modelId: 1, // 默认模型 ID
  texturesId: 53, // 默认材质 ID

  // 工具栏设置
  showToolMenu: true, // 显示工具栏
  showTurnToHomePage: true, // 显示回到主页按钮
  showSwitchOneSentence: true, // 显示一言切换按钮
  showGame: true, // 显示 game 按钮
  showSwitchModel: true, // 显示模型切换按钮
  showSwitchTextures: true, // 显示材质切换按钮
  showTakeScreenshot: true, // 显示看板娘截图按钮
  showTurnToAboutPage: true, // 显示跳转关于页按钮
  showCloseWaifu: true, // 显示关闭看板娘按钮

  // 切换模式
  modelRandMode: "switch", // 模型切换，可选 "rand"(随机), "switch"(顺序)
  texturesRandMode: "rand", // 材质切换，可选 "rand"(随机), "switch"(顺序)

  // 提示消息选项
  showOneSentence: true, // 显示一言
  showCopyMessage: true, // 显示复制内容提示
  showF12Message: true, // 显示进入控制台提示

  // 看板娘样式设置
  waifuSize: "300x380", // 看板娘大小，例如 "280x250", "600x535"
  waifuTipsSize: "250x70", // 提示框大小，例如 "250x70", "570x150"
  waifuFontSize: "12px", // 提示框字体，例如 "12px", "30px"
  waifuToolLine: "30px", // 工具栏行高，例如 "20px", "36px"
  waifuToolTop: "-70px", // 工具栏顶部边距，例如 "0px", "-60px"
  waifuMinWidth: 456, // 页面小于指定宽度时隐藏看板娘
  waifuEdgeSide: "left:0", // 看板娘贴边方向，例如 "left:0"(靠左 0px), "right:30"(靠右 30px)
  // 拖拽样式需要 jQuery 和 jQuery UI 的加持
  waifuDraggable: "disable", // 可选 "disable"(禁用), "axis-x"(只能水平拖拽), "unlimited"(自由拖拽)
  waifuDraggableRevert: true, // 松开鼠标还原拖拽位置

  // 杂项设置
  homePageURL: "auto", // 主页地址，可选 "auto"(自动), "{URL 网址}"
  aboutPageURL: "https://github.com/cnzeropro/live2d-widget", // 关于页地址
  screenshotCaptureName: "waifu.png" // 看板娘截图文件名
};

live2d_settings.jsonPath = live2d_settings.resourcePath + "json/waifu-tips.json";

// 封装异步加载资源方法
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
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

// 加载所需资源并初始化部件
Promise.all([
  loadResourceAsync(live2d_settings.resourcePath + "css/waifu.css", "css"),
  loadResourceAsync(live2d_settings.resourcePath + "js/live2d.js", "js"),
  loadResourceAsync(live2d_settings.resourcePath + "js/waifu-tips.js", "js")
]).then(() => {
  initWidget(live2d_settings.jsonPath, live2d_settings.waifuAPI);
}).catch(error => {
  console.error("Waifu 资源文件加载出错！！！");
  console.error(error);
});

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
              !'〈//｀Ｔ´', ＼ ｀'7'ｰr'
              ﾚ'ヽL__|___i,___,ンﾚ|ノ
                  ﾄ-,/  |___./
                  'ｰ'    !_,.:
`);
