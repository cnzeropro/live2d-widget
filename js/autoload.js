// 注意：live2d_path 参数应使用绝对路径
const live2d_path = "https://cdn.jsdelivr.net/gh/Zero-CN/live2d/";

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
		// else if(type === "logo") {
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
		loadResourceAsync(live2d_path + "waifu.css", "css"),
		loadResourceAsync(live2d_path + "live2d.min.js", "js"),
		loadResourceAsync(live2d_path + "waifu-tips.js", "js"),
		// loadResourceAsync(live2d_path + "logo.png", "logo")
	]).then(() => {
		initWidget(live2d_path + "waifu-tips.json", "https://live2d.fghrsh.net/api");
	});
}
// initWidget 第一个参数为 waifu-tips.json 的路径，第二个参数为 API 地址
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
