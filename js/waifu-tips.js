//加载部件
function loadWidget(waifuJson, apiPath) {
  if (typeof apiPath === "string") {
    if (!apiPath.endsWith("/")) apiPath += "/";
  } else {
    console.error("Waifu API路径设置错误！！！");
    return;
  }
  //清空存储的状态
  localStorage.removeItem("waifu-display");
  sessionStorage.removeItem("waifu-text");
  //添加部件
  document.body.insertAdjacentHTML("beforeend",
      `<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="300" height="300"></canvas>
			<div id="waifu-tool">
			  <span class="faui-home"></span>
				<span class="faui-msg"></span>
				<span class="faui-game"></span>
				<span class="faui-model"></span>
				<span class="faui-textures"></span>
				<span class="faui-photo"></span>
				<span class="faui-about"></span>
				<span class="faui-remove"></span>
			</div>
		</div>`
  );

  //获取设置及相关元素
  live2d_settings.waifuSize = live2d_settings.waifuSize.split('x');
  live2d_settings.waifuTipsSize = live2d_settings.waifuTipsSize.split('x');
  live2d_settings.waifuEdgeSide = live2d_settings.waifuEdgeSide.split(':');
  let toggle = document.getElementById("waifu-toggle");
  let waifu = document.getElementById("waifu");
  let tips = document.getElementById("waifu-tips");
  let live2d = document.getElementById("live2d");
  let tool = document.getElementById("waifu-tool");

  // 加载看板娘样式
  waifu.style.width = live2d_settings.waifuSize[0] + "px";
  waifu.style.height = live2d_settings.waifuSize[1] + "px";
  tips.style.width = live2d_settings.waifuTipsSize[0] + "px";
  tips.style.height = live2d_settings.waifuTipsSize[1] + "px";
  tips.style.top = live2d_settings.waifuToolTop;
  tips.style.fontSize = live2d_settings.waifuFontSize;
  if (!live2d_settings.showOneSentence) tips.style.display = "none";
  if (!live2d_settings.showToolMenu) tool.style.display = "none";
  if (!live2d_settings.showTurnToHomePage) tool.getElementsByTagName("span")[0].style.display = "none";// 主页按钮
  if (!live2d_settings.showSwitchOneSentence) tool.getElementsByTagName("span")[1].style.display = "none";// 一言按钮
  if (!live2d_settings.showGame) tool.getElementsByTagName("span")[2].style.display = "none";// game按钮
  if (!live2d_settings.showSwitchModel) tool.getElementsByTagName("span")[3].style.display = "none";// 模型切换按钮
  if (!live2d_settings.showSwitchTextures) tool.getElementsByTagName("span")[4].style.display = "none";// 材质切换按钮
  if (!live2d_settings.showTakeScreenshot) tool.getElementsByTagName("span")[5].style.display = "none";// 截图按钮
  if (!live2d_settings.showTurnToAboutPage) tool.getElementsByTagName("span")[6].style.display = "none";// 关于页按钮
  if (!live2d_settings.showCloseWaifu) tool.getElementsByTagName("span")[7].style.display = "none";// 关闭看板娘按钮
  if (live2d_settings.waifuEdgeSide[0] == "left") {
    waifu.style.left = live2d_settings.waifuEdgeSide[1] + "px";
  } else if (live2d_settings.waifuEdgeSide[0] == "right") {
    waifu.style.right = live2d_settings.waifuEdgeSide[1] + "px";
  }
  for (let i = 0; i < tool.getElementsByTagName("span").length; i++) {
    tool.getElementsByTagName("span")[i].style.lineHeight = live2d_settings.waifuToolLine;
  }
  live2d_settings.homePageURL = live2d_settings.homePageURL == "auto" ? window.location.protocol + "//" + window.location.hostname + '/' : live2d_settings.homePageURL;
  if (window.location.protocol == "file:" && live2d_settings.waifuAPI.substr(0, 2) == "//") live2d_settings.waifuAPI = "http:" + live2d_settings.waifuAPI;

  // 拖拽操作需要 JQuery 和 JQuery UI 的支持
  try {
    if (live2d_settings.waifuDraggable == "axis-x") {
      $(".waifu").draggable({
        axis: "x",
        revert: live2d_settings.waifuDraggableRevert
      });
    } else if (live2d_settings.waifuDraggable == "unlimited") {
      $(".waifu").draggable({revert: live2d_settings.waifuDraggableRevert});
    } else {
      $(".waifu").css("transition", 'all .3s ease-in-out');
    }
  } catch (err) {
    console.log("[Error] JQuery and JQuery UI are not defined.");
  }

  // 部件浮现
  setTimeout(() => {
    waifu.style.bottom = 0;
  }, 100);

  // 检测用户活动状态，并在空闲时显示消息
  let userAction = false,
      messageTimer,
      userActionTimer,
      messageArray = ["好久不见，时间过得好快呢~~",
        "大坏蛋！你都多久没理人家了呀，嘤嘤嘤～",
        "嗨~快来逗我玩吧！",
        "拿小拳拳锤你胸口！",
        "记得把小家加入拦截白名单哦！"];
  //检测用户活动状态
  window.addEventListener("mousemove", () => userAction = true);
  window.addEventListener("keydown", () => userAction = true);
  //每隔一秒探测用户活动状态
  setInterval(() => {
    if (userAction) {
      //用户活动中，清空用户活动计时器
      userAction = false;
      clearInterval(userActionTimer);
      userActionTimer = null;
    } else if (!userActionTimer) {
      //用户未活动,每隔25秒显示一言
      userActionTimer = setInterval(() => {
        showMessage(randomSelection(messageArray), 6000, 5);
      }, 25000);
    }
  }, 1000);

  //初始化模型
  (function initModel() {
    let modelId = localStorage.getItem("modelId"),
        texturesId = localStorage.getItem("texturesId");

    // 首次访问加载指定模型的指定材质
    if (modelId == null) {
      modelId = live2d_settings.modelId;
      texturesId = live2d_settings.texturesId;
    }
    loadModelAndTextures(modelId, texturesId).then(() => console.log("欢迎使用 Live2d 看板娘"));

    //waifu-tips.json解析
    fetch(waifuJson)
        .then(response => response.json())
        .then(result => {
          //"mouseover"事件处理
          window.addEventListener("mouseover", event => {
            for (let {selector, text} of result.mouseover) {
              if (!event.target.matches(selector)) continue;
              text = randomSelection(text);
              text = text.replace("{text}", event.target.innerText);
              showMessage(text, 4000, 8);
              return;
            }
          });

          //"click"事件处理
          window.addEventListener("click", event => {
            for (let {selector, text} of result.click) {
              if (!event.target.matches(selector)) continue;
              text = randomSelection(text);
              text = text.replace("{text}", event.target.innerText);
              showMessage(text, 4000, 8);
              return;
            }
          });

          // "festival"处理
          result.festival.forEach(({date, text}) => {
            let dateNow = new Date(),
                before = date.split("-")[0],
                after = date.split("-")[1] || before,
                now;

            // 重写时间格式为XX/XX
            if (dateNow.getMonth() + 1 < 10) {
              now = "0";
            }
            now += dateNow.getMonth() + 1 + "/";
            if (dateNow.getDate() < 10) {
              now += "0";
            }
            now += dateNow.getDate();

            // 利用字符串对比规则判断当前是否处于节日时间段
            if (before <= now && after >= now) {
              text = randomSelection(text);
              text = text.replace("{year}", dateNow.getFullYear()); // 普通处理
              text = text.replace("{year-1949}", dateNow.getFullYear() - 1949); //国庆节处理
              messageArray.push(text);
              // showMessage(text, 7000, 5);
            }
          });
        });
  })();

  //添加事件监听
  (function registerEventListener() {
    //为faui-home图标添加“回到主页”方法
    document.querySelector("#waifu-tool .faui-home").addEventListener("click", () => {
      open(live2d_settings.homePageURL, "_self");
    });
    //为faui-msg图标添加"一言"接口
    document.querySelector("#waifu-tool .faui-msg").addEventListener("click", showOneSentence);
    //为faui-game图标添加"打飞机"小游戏
    document.querySelector("#waifu-tool .faui-game").addEventListener("click", () => {
      if (window.Asteroids) {
        if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
        window.ASTEROIDSPLAYERS.push(new Asteroids());
      } else {
        const script = document.createElement("script");
        script.src = live2d_settings.resourcePath + "js/asteroids.js";
        document.head.appendChild(script);
      }
    });
    //为faui-model图标添加"换角色"方法
    document.querySelector("#waifu-tool .faui-model").addEventListener("click", switchModel);
    //为faui-textures图标添加"换装"方法
    document.querySelector("#waifu-tool .faui-textures").addEventListener("click", switchTextures);
    //为faui-photo图标添加"照相"方法
    document.querySelector("#waifu-tool .faui-photo").addEventListener("click", () => {
      showMessage("照好了嘛，是不是很可爱呢？", 5000, 9);
      Live2D.captureName = live2d_settings.screenshotCaptureName;
      Live2D.captureFrame = true;
    });
    //为faui-about图标添加“关于项目”方法
    document.querySelector("#waifu-tool .faui-about").addEventListener("click", () => {
      open(live2d_settings.aboutPageURL);
    });
    //为faui-remove图标添加“隐藏”方法
    document.querySelector("#waifu-tool .faui-remove").addEventListener("click", () => {
      localStorage.setItem("waifu-display", Date.now()); //存储“隐藏”状态
      showMessage("愿你有一天能和重要的人重逢。", 2000, 9);
      waifu.style.bottom = "-1000px";
      setTimeout(() => {
        waifu.style.display = "none";
        toggle.classList.add("waifu-toggle-active");
      }, 3000);
    });

    if (live2d_settings.showF12Message) {
      //打开控制台判断
      const devtools = () => {
      };
      console.log("%c", devtools);
      devtools.toString = () => {
        showMessage("嘿嘿，你打开了控制台，是想要看看我的小秘密吗？", 5000, 7);
      };
    }
    //复制
    if (live2d_settings.showCopyMessage) {
      window.addEventListener("copy", () => {
        showMessage("你都复制了些什么呀，转载记得加上出处哦！", 5000, 7);
      });
    }
    //“离开”后“回来”
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) showMessage("哇，你终于回来了~", 5000, 7);
    });
  })();

  //显示欢迎信息
  (function welcomeMessage() {
    let text;
    if (location.pathname == "/") { // 如果是主页
      const now = new Date().getHours();
      if (now > 5 && now <= 7) {
        text = "hi！早上好！一日之计在于晨，美好的一天就要开始了。";
      } else if (now > 7 && now <= 11) {
        text = "上午好！工作学习顺利嘛，不要久坐，多起来走动走动哦！";
      } else if (now > 11 && now <= 13) {
        text = "中午了，工作了一个上午，我都快饿了，一起去干饭吧！";
      } else if (now > 13 && now <= 17) {
        text = "午后很容易犯困呢，不过还是要打起十二分的精神，小家会陪您一起努力的 q(≧▽≦q)";
      } else if (now > 17 && now <= 19) {
        text = "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~";
      } else if (now > 19 && now <= 21) {
        text = "晚上好，今天过得怎么样？工作学习目标完成了吗？";
      } else if (now > 21 && now <= 23) {
        text = ["已经这么晚了呀，早点休息吧,晚安～", "深夜时要爱护眼睛呀！"];
      } else {
        text = "你是夜猫子呀？这么晚还不睡觉，明天起得来嘛？";
      }
    } else if (document.referrer != "") {// 如果是直接访问页面或通过搜索访问页面的方式
      const referrer = new URL(document.referrer),
          domain = referrer.hostname.split(".")[1];
      if (location.hostname == referrer.hostname) {
        text = `欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      } else if (domain == "baidu") {
        text = `Hello！来自 百度搜索 的朋友<br/>你是搜索 <span>${referrer.search.split("&wd=")[1].split("&")[0]}</span> 找到的我吗？<br/>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      } else if (domain == "so") {
        text = `Hello！来自 360搜索 的朋友<br/>你是搜索 <span>${referrer.search.split("&q=")[1].split("&")[0]}</span> 找到的我吗？<br/>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      } else if (domain == "google") {
        text = `Hello！来自 谷歌搜索 的朋友<br/>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      } else {
        text = `Hello！来自 <span>${referrer.hostname}</span> 的朋友<br/>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      }
    } else {
      text = `不知名星球的朋友，欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
    }
    showMessage(text, 7000, 9);
  })();

  // 随机选择信息
  function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
  }

  // 显示一言
  function showOneSentence() {
    switch (live2d_settings.oneSentenceAPI) {
      case "lwl12.com":
        fetch("https://api.lwl12.com/hitokoto/v1?encode=realjson")
            .then(response => response.json())
            .then(result => {
              showMessage(result.text, 6000, 9);
              const text = `这一句来自 <span>${result.source}</span>`;
              setTimeout(() => {
                showMessage(text, 4000, 8);
              }, 6000);
            }).catch(error => console.error(error));
        break;
      case "hitokoto.cn":
        fetch("https://v1.hitokoto.cn")
            .then(response => response.json())
            .then(result => {
              showMessage(result.hitokoto, 6000, 9);
              const text = `这一句来自 <span>「${result.from}」</span>，喜欢吗？ φ(゜▽゜*)♪ 是 <span>${result.creator}</span> 投稿的喔`;
              setTimeout(() => {
                showMessage(text, 4000, 8);
              }, 6000);
            }).catch(error => console.error(error));
        break;
      case "jinrishici.com":
        fetch("https://v2.jinrishici.com/one.json")
            .then(response => response.json())
            .then(result => {
              showMessage(result.data.content, 5000, 9);
              const text =
                  `偷偷告述你这一句诗词来自<span>${result.data.origin.dynasty}</span>·<span>${result.data.origin.author}</span><span>【${result.data.origin.title}】</span>~ 要熟背古诗词呀! ＞︿＜`;
              setTimeout(() => {
                showMessage(text, 4000, 8);
              }, 5000);
            }).catch(error => console.error(error));
        break;
      case "ipayy.net":
        fetch("https://cdn.ipayy.net/says/api.php")
            .then(response => response.json())
            .then(result => {
              showMessage(result, 6000, 9);
            }).catch(error => console.error(error));
        break;
      default:
        showMessage(`一言 API 设置错误哟~`, 4000, 8);
    }
  }

  /*
   * 消息显示函数
   * 三个参数分别是:
   * 1.要显示的文本
   * 2.显示文本的持续时间
   * 3.消息优先级:数字越大优先级越高
   */
  function showMessage(text, timeout, priority) {
    if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    text = randomSelection(text); //如果有多句，随机选择一句
    sessionStorage.setItem("waifu-text", priority);
    tips.innerHTML = text;
    tips.classList.add("waifu-tips-active"); //激活活动状态
    messageTimer = setTimeout(() => {
      sessionStorage.removeItem("waifu-text");
      tips.classList.remove("waifu-tips-active");
    }, timeout);
  }

  //"换人"方法
  async function switchModel() {
    const modelId = localStorage.getItem("modelId");
    // 可选 "rand"(随机), "switch"(顺序)
    fetch(`${apiPath}/` + live2d_settings.modelRandMode + `/?id=${modelId}`)
        .then(response => response.json())
        .then(result => {
          loadModelAndTextures(result.model.id);
          showMessage(result.model.message, 4000, 8);
        }).catch(error => console.error(error));
  }

  //”换装“方法
  async function switchTextures() {
    const modelId = localStorage.getItem("modelId"),
        texturesId = localStorage.getItem("texturesId");
    fetch(`${apiPath}/` + live2d_settings.texturesRandMode + `_textures/?id=${modelId}-${texturesId}`)
        .then(response => response.json())
        .then(result => {
          loadModelAndTextures(modelId, result.textures.id);
          if (result.textures.id === 1 && (texturesId == 1 || texturesId == 0)) {
            showMessage("我还没有其他衣服呢！", 4000, 8);
          } else {
            showMessage("我的新衣服好看嘛？", 4000, 8);
          }
        }).catch(error => console.error(error));
  }

  //模型和材质
  async function loadModelAndTextures(modelId, texturesId) {
    localStorage.setItem("modelId", modelId); //存储模型ID
    if (texturesId === undefined) {
      //如果未传入材质ID,默认使用0号材质
      texturesId = 0;
    }
    localStorage.setItem("texturesId", texturesId); //存储材质ID
    loadlive2d("live2d", `${apiPath}/get/?id=${modelId}-${texturesId}`, console.log(
        `Live2D 模型 ${modelId}-${texturesId} 加载完成`));
  }
}

//初始化部件
function initWidget(waifuJson = live2d_settings.resourcePath + "json/waifu-tips.json", apiPath) {
  //窗口小于live2d_settings['waifuMinWidth']不显示部件
  if (screen.width <= live2d_settings.waifuMinWidth) return;

  // 添加看板娘切换按钮
  document.body.insertAdjacentHTML("beforeend", `
		<div id="waifu-toggle">
			<span>看板娘</span>
		</div>`);

  const toggle = document.getElementById("waifu-toggle");
  //添加"点击"事件监听
  toggle.addEventListener("click", () => {
    toggle.classList.remove("waifu-toggle-active");
    if (toggle.getAttribute("first-time")) {
      loadWidget(waifuJson, apiPath);
      toggle.removeAttribute("first-time");
    } else {
      //重置显示状态
      localStorage.removeItem("waifu-display");
      document.getElementById("waifu").style.display = "";
      setTimeout(() => {
        document.getElementById("waifu").style.bottom = 0;
      }, 0);
    }
  });

  if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
    toggle.setAttribute("first-time", true);
    // 隐藏看板娘（显示看板娘激活按钮）
    setTimeout(() => {
      toggle.classList.add("waifu-toggle-active");
    }, 0);
  } else { //如果二次使用时相较前一次使用大于一天
    loadWidget(waifuJson, apiPath);
  }
}
