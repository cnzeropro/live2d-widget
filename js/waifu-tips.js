/*
 * Live2D Widget
 * https://github.com/Zero-CN/live2d
 */

//加载部件
function loadWidget(waifuPath, apiPath) {
	//清空存储的状态
	localStorage.removeItem("waifu-display");
	sessionStorage.removeItem("waifu-text");
	/*
	 * 添加元素——
	 * beforebegin: 元素自身的前面。
	 * afterbegin: 插入元素内部的第一个子节点之前。
	 * beforeend: 插入元素内部的最后一个子节点之后。
	 * afterend: 元素自身的后面。
	 */
	document.body.insertAdjacentHTML("beforeend",
		`<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="300" height="300"></canvas>
			<div id="waifu-tool">
				<span class="fa fa-lg fa-comment"></span>
				<span class="fa fa-lg fa-paper-plane"></span>
				<span class="fa fa-lg fa-user-circle"></span>
				<span class="fa fa-lg fa-street-view"></span>
				<span class="fa fa-lg fa-camera-retro"></span>
				<span class="fa fa-lg fa-info-circle"></span>
				<span class="fa fa-lg fa-times"></span>
			</div>
		</div>`
	);
	//部件立即浮现
	setTimeout(() => {
		document.getElementById("waifu").style.bottom = 0;
	}, 0);

	function registerEventListener() {
		//为fa-comment图标添加"一言"接口
		document.querySelector("#waifu-tool .fa-comment").addEventListener("click", showOneSentence);
		//为fa-paper-plane图标添加"打飞机"小游戏
		document.querySelector("#waifu-tool .fa-paper-plane").addEventListener("click", () => {
			if (window.Asteroids) {
				if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
				window.ASTEROIDSPLAYERS.push(new Asteroids());
			} else {
				var script = document.createElement("script");
				script.src = "https://cdn.jsdelivr.net/gh/Zero-CN/live2d/asteroids.js";
				document.head.appendChild(script);
			}
		});
		//为fa-user-circle图标添加"换角色"方法
		document.querySelector("#waifu-tool .fa-user-circle").addEventListener("click", loadAnother);
		//为fa-street-view图标添加"换装"方法
		document.querySelector("#waifu-tool .fa-street-view").addEventListener("click", loadShift);
		//为fa-camera-retro图标添加"照相"方法
		document.querySelector("#waifu-tool .fa-camera-retro").addEventListener("click", () => {
			showMessage("照好了嘛，是不是很可爱呢？", 5000, 7);
			Live2D.captureName = "photo.png"; //照片名字
			Live2D.captureFrame = true;
		});
		//为fa-info-circle图标添加"消息显示"方法
		document.querySelector("#waifu-tool .fa-info-circle").addEventListener("click", () => {
			open("https://github.com/Zero-CN/live2d");
		});
		//为fa-times图标添加"隐藏"方法
		document.querySelector("#waifu-tool .fa-times").addEventListener("click", () => {
			localStorage.setItem("waifu-display", Date.now()); //存储隐藏状态
			showMessage("愿你有一天能与重要的人重逢。", 2000, 9);
			document.getElementById("waifu").style.bottom = "-500px";
			setTimeout(() => {
				document.getElementById("waifu").style.display = "none";
				document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
			}, 3000);
		});
		//打开控制台判断
		var devtools = () => {};
		console.log("%c", devtools);
		devtools.toString = () => {
			showMessage("嘿嘿,你打开了控制台,是想要看看我的小秘密吗？", 5000, 7);
		};
		//"复制"判断
		window.addEventListener("copy", () => {
			showMessage("你都复制了些什么呀,转载记得加上出处哦！", 5000, 7);
		});
		//"离开"后"回来"判断
		window.addEventListener("visibilitychange", () => {
			if (!document.hidden) showMessage("哇,你终于回来了~", 5000, 7);
		});
	}
	registerEventListener();

	function welcomeMessage() {
		var text;
		if (location.pathname === "/") { // 如果是主页
			var now = new Date().getHours();
			if (now > 5 && now <= 7) text = "早上好！一日之计在于晨,美好的一天就要开始了。";
			else if (now > 7 && now <= 11) text = "上午好！工作顺利嘛,不要久坐,多起来走动走动哦！";
			else if (now > 11 && now <= 13) text = "中午了,工作了一个上午，现在是午餐时间！";
			else if (now > 13 && now <= 17) text = "午后很容易犯困呢,今天的运动目标完成了吗？";
			else if (now > 17 && now <= 19) text = "傍晚了！窗外夕阳的景色很美丽呢,最美不过夕阳红~";
			else if (now > 19 && now <= 21) text = "晚上好,今天过得怎么样？";
			else if (now > 21 && now <= 23) text = ["已经这么晚了呀,早点休息吧,晚安～", "深夜时要爱护眼睛呀！"];
			else text = "你是夜猫子呀？这么晚还不睡觉,明天起的来嘛？";
		} else if (document.referrer !== "") {
			var referrer = new URL(document.referrer),
				domain = referrer.hostname.split(".")[1];

			if (location.hostname == referrer.hostname) {
				text = `欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
			} else if (domain == "baidu") {
				text = `Hello！来自 百度搜索 的朋友<br/>你是搜索 <span>${referrer.search.split("&wd=")[1].split("&")[0]}</span> 找到的我吗？`;
			} else if (domain == "so") {
				text = `Hello！来自 360搜索 的朋友<br/>你是搜索 <span>${referrer.search.split("&q=")[1].split("&")[0]}</span> 找到的我吗？`;
			} else if (domain == "google") {
				text = `Hello！来自 谷歌搜索 的朋友<br/>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
			} else {
				text = `Hello！来自 <span>${referrer.hostname}</span> 的朋友`;
			}
		} else {
			text = `欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
		}
		showMessage(text, 7000, 8);
	}
	welcomeMessage();

	// 检测用户活动状态，并在空闲时显示消息
	var userAction = false,
		userActionTimer = null,
		messageArray = ["好久不见，时间过得好快呢~~", "大坏蛋！你都多久没理人家了呀,嘤嘤嘤～", "嗨~快来逗我玩吧！", "拿小拳拳锤你胸口！", "记得把小家加入 Adblock 白名单哦！"];
	//检测用户活动状态
	window.addEventListener("mousemove", () => userAction = true);
	window.addEventListener("keydown", () => userAction = true);
	//每隔一秒探测用户活动状态
	setInterval(() => {
		if (userAction) {
			//用户活动中,清空用户活动计时器
			userAction = false;
			clearInterval(userActionTimer);
			userActionTimer = null;
		} else if (!userActionTimer) {
			//用户未活动,每隔25秒显示一言
			userActionTimer = setInterval(() => {
				showMessage(messageArray[Math.floor(Math.random() * messageArray.length)], 6000, 5);
			}, 25000);
		}
	}, 1000);

	// 一言 API,可选 "lwl12.com", "hitokoto.cn", "jinrishici.com"(古诗词), "ipayy.net"
	function showOneSentence() {
		var oneSentenceAPI = "jinrishici.com";
		var text;
		switch (oneSentenceAPI) {
			case "lwl12.com":
				fetch("https://api.lwl12.com/hitokoto/v1?encode=realjson")
					.then(response => response.json())
					.then(result => {
						text = `这一句是 <span>${result.author}</span> 在 lwl12.com 投稿的喔。`;
						showMessage(result.source, 6000, 7);
					});
				break;
			case "hitokoto.cn":
				fetch("https://v1.hitokoto.cn")
					.then(response => response.json())
					.then(result => {
						text = `这句来自 <span>「${result.from}」</span>，是 <span>${result.creator}</span> 在 hitokoto.cn 投稿的喔。`;
						showMessage(result.hitokoto, 6000, 7);
					});
				break;
			case "jinrishici.com":
				fetch("https://v2.jinrishici.com/one.json")
					.then(response => response.json())
					.then(result => {
						text =
							`这一句诗词来自<span>${result.data.origin.dynasty}</span>·<span>${result.data.origin.author}</span><span>【${result.data.origin.title}】</span>~ 要熟背古诗词呀!`;
						showMessage(result.data.origin.content, 6000, 7);
					});
				break;
			case "ipayy.net":
				fetch("https://cdn.ipayy.net/says/api.php")
					.then(response => response.json())
					.then(result => {
						showMessage(result, 6000, 7);
					});
				break;
		}
		setTimeout(() => {
			showMessage(text, 5000, 7);
		}, 500);
	}

	/*
	 * 消息显示函数
	 * 三个参数分别是:
	 * 1.要显示的文本
	 * 2.显示文本的持续时间
	 * 3.消息优先级:数字越大优先级越高
	 */
	function showMessage(text, timeout, priority) {
		if (!text) return;
		var messageTimer = null;
		if (!sessionStorage.getItem("waifu-text") || sessionStorage.getItem("waifu-text") <= priority) {
			if (messageTimer) {
				//清空消息计时器
				clearTimeout(messageTimer);
				messageTimer = null;
			}
			if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)]; //如果text是数组形式,随机选择一句
			sessionStorage.setItem("waifu-text", priority);
			var tips = document.getElementById("waifu-tips");
			tips.innerHTML = text;
			tips.classList.add("waifu-tips-active"); //增加活动状态
			messageTimer = setTimeout(() => {
				sessionStorage.removeItem("waifu-text");
				tips.classList.remove("waifu-tips-active");
			}, timeout);
		}
	}

	//初始化模型
	function initModel() {
		var modelId = localStorage.getItem("modelId"),
			modelTexturesId = localStorage.getItem("modelTexturesId");

		// 首次访问加载指定模型的指定材质
		if (modelId == null) {
			var modelId = 1, // 模型 ID
				modelTexturesId = 53; // 材质 ID
		}
		loadModel(modelId, modelTexturesId);

		//waifu-tips.json解析
		fetch(waifuPath)
			.then(response => response.json())
			.then(result => {
				//"mouseover"事件处理
				result.mouseover.forEach(tips => {
					window.addEventListener("mouseover", event => {
						if (!event.target.matches(tips.selector)) return;
						var text = Array.isArray(tips.text) ? tips.text[Math.floor(Math.random() * tips.text.length)] : tips.text;
						text = text.replace("{text}", event.target.innerText);
						showMessage(text, 5000, 6);
					});
				});

				//"click"事件处理
				result.click.forEach(tips => {
					window.addEventListener("click", event => {
						if (!event.target.matches(tips.selector)) return;
						var text = Array.isArray(tips.text) ? tips.text[Math.floor(Math.random() * tips.text.length)] : tips.text;
						text = text.replace("{text}", event.target.innerText);
						showMessage(text, 5000, 6);
					});
				});

				//"festival"事件处理
				result.festival.forEach(tips => {
					var dateNow = new Date(),
						before = tips.date.split("-")[0],
						after = tips.date.split("-")[1] || before,
						now;

					//重写时间格式为XX/XX
					if (dateNow.getMonth() + 1 < 10) {
						now = "0";
					}
					now += dateNow.getMonth() + 1 + "/";
					if (dateNow.getDate() < 10) {
						now += "0";
					}
					now += dateNow.getDate();

					if (before <= now && after >= now) { //利用字符串对比规则
						var text = Array.isArray(tips.text) ? tips.text[Math.floor(Math.random() * tips.text.length)] : tips.text;
						text = text.replace("{year}", now.getFullYear()); //普通处理
						text = text.replace("{year-1949}", dateNow.getFullYear() - 1949); //国庆节处理
						messageArray.push(text);
						//showMessage(text, 7000, 5);
					}
				});
			});
	}
	initModel();

	function loadModel(modelId, modelTexturesId) {
		localStorage.setItem("modelId", modelId); //存储模型ID
		if (modelTexturesId === undefined) modelTexturesId = 0; //如果未传入材质ID,默认使用0号材质
		localStorage.setItem("modelTexturesId", modelTexturesId); //存储材质ID
		loadlive2d("live2d", `${apiPath}/get/?id=${modelId}-${modelTexturesId}`, console.log(
			`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`));
	}

	//"换装"方法,默认随机
	function loadShift() {
		var modelId = localStorage.getItem("modelId"),
			modelTexturesId = localStorage.getItem("modelTexturesId");
		// 可选 "rand"(随机), "switch"(顺序)
		fetch(`${apiPath}/rand_textures/?id=${modelId}-${modelTexturesId}`)
			.then(response => response.json())
			.then(result => {
				if (result.textures.id == 1 && (modelTexturesId == 1 || modelTexturesId == 0)) {
					showMessage("我还没有其他衣服呢！", 4000, 8);
				} else {
					showMessage("我的新衣服好看嘛？", 4000, 8);
				}
				loadModel(modelId, result.textures.id);
			});
	}

	//"换人"方法,默认顺序
	function loadAnother() {
		var modelId = localStorage.getItem("modelId");
		// 可选 "rand"(随机), "switch"(顺序)
		fetch(`${apiPath}/switch/?id=${modelId}`)
			.then(response => response.json())
			.then(result => {
				loadModel(result.model.id);
				showMessage(result.model.message, 4000, 8);
			});
	}
}

//初始化部件
function initWidget(waifuPath = "json/waifu-tips.json", apiPath = "") {
	//窗口小于567px不显示部件
	if (screen.width <= 567) return;

	document.body.insertAdjacentHTML("beforeend", `
		<div id="waifu-toggle">
			<span>看板娘</span>
		</div>`);

	var toggle = document.getElementById("waifu-toggle");
	//添加"点击"事件监听
	toggle.addEventListener("click", () => {
		toggle.classList.remove("waifu-toggle-active"); //去除"看板娘"按钮激活状态
		//第一次使用部件
		if (toggle.getAttribute("first-time")) {
			loadWidget(waifuPath, apiPath);
			toggle.removeAttribute("first-time");
		} else {
			localStorage.removeItem("waifu-display");
			document.getElementById("waifu").style.display = ""; //重置显示状态
			setTimeout(() => {
				document.getElementById("waifu").style.bottom = 0;
			}, 0);
		}
	});

	//如果存储了"waifu-display",且超过一天
	if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") >= 86400000) {
		toggle.setAttribute("first-time", true); //存储为第一次使用状态
		setTimeout(() => {
			toggle.classList.add("waifu-toggle-active");
		}, 0);
	} else {
		loadWidget(waifuPath, apiPath); //加载部件
	}
}
