window.live2d_settings = Array();

// 后端接口
live2d_settings['resourcePath'] = "https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget/" //资源根目录
live2d_settings['waifuAPI'] = "https://live2d.fghrsh.net/api";   // 自建 API 修改这里，自行搭建参考 https://github.com/fghrsh/live2d_api
live2d_settings['oneSentenceAPI'] = "jinrishici.com";  // 一言 API，可选 "lwl12.com", "hitokoto.cn", "jinrishici.com"(古诗词), "ipayy.net"

// 默认模型
live2d_settings['modelId'] = 1;            // 默认模型 ID
live2d_settings['texturesId'] = 53;   // 默认材质 ID

// 工具栏设置
live2d_settings['showToolMenu'] = true;         // 显示 工具栏
live2d_settings['showSwitchOneSentence'] = true;         // 显示 一言切换按钮
live2d_settings['showGame'] = true;         // 显示 game按钮
live2d_settings['showSwitchModel'] = true;         // 显示 模型切换按钮
live2d_settings['showSwitchTextures'] = true;         // 显示 材质切换按钮
live2d_settings['showTakeScreenshot'] = true;         // 显示 看板娘截图按钮
live2d_settings['showTurnToAboutPage'] = true;         // 显示 跳转关于页按钮
live2d_settings['showCloseWaifu'] = true;         // 显示 关闭看板娘按钮

// 模型切换模式
live2d_settings['modelRandMode'] = 'switch';     // 模型切换，可选 'rand'(随机), 'switch'(顺序)
live2d_settings['texturesRandMode'] = 'rand';       // 材质切换，可选 'rand'(随机), 'switch'(顺序)

// 提示消息选项
live2d_settings['showOneSentence'] = true;         // 显示一言
live2d_settings['showCopyMessage'] = true;         // 显示 复制内容 提示
live2d_settings['showF12Message'] = true;         // 显示进入控制台提示

//看板娘样式设置
live2d_settings['waifuSize'] = '280x250';    // 看板娘大小，例如 '280x250', '600x535'
live2d_settings['waifuTipsSize'] = '250x70';     // 提示框大小，例如 '250x70', '570x150'
live2d_settings['waifuFontSize'] = '12px';       // 提示框字体，例如 '12px', '30px'
live2d_settings['waifuToolLine'] = '20px';       // 工具栏行高，例如 '20px', '36px'
live2d_settings['waifuToolTop'] = '0px'         // 工具栏顶部边距，例如 '0px', '-60px'
live2d_settings['waifuMinWidth'] = 567;      // 面页小于 指定宽度 隐藏看板娘
live2d_settings['waifuEdgeSide'] = 'left:0';     // 看板娘贴边方向，例如 'left:0'(靠左 0px), 'right:30'(靠右 30px)

live2d_settings['waifuDraggable'] = 'disable';    // 拖拽样式，例如 'disable'(禁用), 'axis-x'(只能水平拖拽), 'unlimited'(自由拖拽)
live2d_settings['waifuDraggableRevert'] = true;         // 松开鼠标还原拖拽位置，可选 true(真), false(假)

// 其他杂项设置
live2d_settings['liv2dVersion'] = '1.4.2';        // 当前版本
live2d_settings['liv2dUpdateDate'] = '2020.7.28'; // 版本更新日期
live2d_settings['aboutPageURL'] = 'https://github.com/cnzeropro/live2d-widget';   // 关于页地址, '{URL 网址}'
live2d_settings['screenshotCaptureName'] = 'live2d.png'; // 看板娘截图文件名，例如 'live2d.png'

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
    // else if(type === "icon") {
    // 	tag = document.createElement("link");
    // 	tag.rel = "icon";
    // 	tag.href = url;
    // }

    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

// 加载所需资源
Promise.all([
  // loadResourceAsync(live2d_settings.resourcePath + "favicon/favicon.ico", "icon")
  loadResourceAsync(live2d_settings.resourcePath + "css/waifu.css", "css"),
  // loadResourceAsync(live2d_settings.resourcePath + "css/fontawesome.min.css", "css"),
  loadResourceAsync(live2d_settings.resourcePath + "js/live2.min.js", "js"),
  loadResourceAsync(live2d_settings.resourcePath + "js/waifu-tips.js", "js"),
]).then(() => {
  initWidget(live2d_settings.resourcePath + "json/waifu-tips.json", live2d_settings.waifuAPI);
});

console.log(`
  く__,.ヘヽ.        /  ,ー､ 〉
           ＼ ', !-─‐-i  /  /´
           ／｀ｰ'       L/／｀ヽ､
         /   ／,   /|   ,   ,       ',
       ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
        ﾚ ﾍ 7ｲ｀ﾄ   ﾚ'ｧ-ﾄ､!ハ|   |
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
