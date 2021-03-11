// 注意：live2d_path 参数应使用绝对路径
const live2d_path = "https://cdn.jsdelivr.net/gh/cnzeropro/live2d-widget/";

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
if (screen.width >= 567) {
  Promise.all([
    // loadResourceAsync(live2d_path + "favicon/favicon.ico", "icon")
    loadResourceAsync(live2d_path + "css/waifu.css", "css"),
    // loadResourceAsync(live2d_path + "css/fontawesome.min.css", "css"),
    loadResourceAsync(live2d_path + "js/live2dcubismcore.min.js", "js"),
    loadResourceAsync(live2d_path + "js/waifu-tips.js", "js"),
  ]).then(() => {
    initWidget(live2d_path + "json/waifu-tips.json", "https://live2d.fghrsh.net/api");
  });
}
// API 后端可自行搭建，参考 https://github.com/fghrsh/live2d_api

console.log(
    `
  く__,.ヘヽ.        /  ,ー､ 〉
           ＼ ', !-─‐-i  /  /´
           ／｀ｰ'       L/／｀ヽ､
         /   ／,   /|   ,   ,       ',
       ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
        ﾚ ﾍ 7ｲ｀ﾄ   ﾚ'ｧ-ﾄ､!ハ|   |	|
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
`
);
