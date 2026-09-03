/*!
 * live2d-widget 看板娘核心逻辑
 * 依赖: js/live2d.js (Live2D 渲染核心)、js/autoload.js (全局配置 live2d_settings)
 */
(function () {
  "use strict";

  /* ---------- 常量 ---------- */

  const STORAGE_KEYS = {
    display: "waifu-display",
    text: "waifu-text",
    modelId: "modelId",
    texturesId: "texturesId"
  };

  // 关闭看板娘后，再次自动展示的间隔（24 小时）
  const DISPLAY_EXPIRE_MS = 86400000;

  /* ---------- 模块状态 ---------- */

  let apiPath = "";         // 看板娘 API 地址（loadWidget 时初始化）
  let tips = null;          // 提示框元素
  let messageTimer = null;  // 当前消息的定时器
  let userAction = false;   // 用户活动状态
  let userActionTimer = null;
  const messageArray = [    // 空闲时随机显示的消息（节日消息会追加进来）
    "好久不见，时间过得好快呢~~",
    "大坏蛋！你都多久没理人家了呀，嘤嘤嘤～",
    "嗨~快来逗我玩吧！",
    "拿小拳拳锤你胸口！",
    "记得把小家加入拦截白名单哦！"
  ];

  /* ---------- 通用工具 ---------- */

  // 随机选择信息（数组随机取一，字符串原样返回）
  function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
  }

  // 转义 HTML，防止页面文本 / URL 参数注入提示框
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text == null ? "" : String(text);
    return div.innerHTML;
  }

  // 从 search 字符串中安全取查询参数，不存在时返回空字符串
  function getSearchParam(search, key) {
    const match = search.match(new RegExp(`[?&]${key}=([^&]*)`));
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
  }

  // 将日期格式化为 MM/DD，用于节日区间比较
  function formatMonthDay(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  }

  async function fetchJSON(url) {
    const response = await fetch(url);
    return response.json();
  }

  /* ---------- 消息系统 ---------- */

  /**
   * 显示提示消息
   * @param {string|string[]} text - 要显示的文本（多句时随机选择）
   * @param {number} timeout - 显示持续时间（毫秒）
   * @param {number} priority - 优先级，数字越大越高
   */
  function showMessage(text, timeout, priority) {
    const current = sessionStorage.getItem(STORAGE_KEYS.text);
    if (!text || (current && current > priority)) return;
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    sessionStorage.setItem(STORAGE_KEYS.text, priority);
    tips.innerHTML = randomSelection(text);
    tips.classList.add("waifu-tips-active");
    messageTimer = setTimeout(() => {
      sessionStorage.removeItem(STORAGE_KEYS.text);
      tips.classList.remove("waifu-tips-active");
      messageTimer = null;
    }, timeout);
  }

  /* ---------- 模型与材质 ---------- */

  // 加载模型和材质
  function loadModelAndTextures(modelId, texturesId) {
    if (texturesId === undefined) texturesId = 0; // 未传入材质 ID 时默认使用 0 号材质
    localStorage.setItem(STORAGE_KEYS.modelId, modelId);
    localStorage.setItem(STORAGE_KEYS.texturesId, texturesId);
    loadlive2d("live2d", `${apiPath}/get/?id=${modelId}-${texturesId}`);
    console.log(`Live2D 模型 ${modelId}-${texturesId} 加载完成`);
  }

  // "换人"：切换模型
  async function switchModel() {
    const modelId = localStorage.getItem(STORAGE_KEYS.modelId);
    try {
      const result = await fetchJSON(`${apiPath}/${live2d_settings.modelRandMode}/?id=${modelId}`);
      loadModelAndTextures(result.model.id);
      showMessage(result.model.message, 4000, 8);
    } catch (error) {
      console.error(error);
    }
  }

  // "换装"：切换材质
  async function switchTextures() {
    const modelId = localStorage.getItem(STORAGE_KEYS.modelId);
    const texturesId = localStorage.getItem(STORAGE_KEYS.texturesId);
    try {
      const result = await fetchJSON(`${apiPath}/${live2d_settings.texturesRandMode}_textures/?id=${modelId}-${texturesId}`);
      loadModelAndTextures(modelId, result.textures.id);
      if (result.textures.id === 1 && (texturesId === "1" || texturesId === "0")) {
        showMessage("我还没有其他衣服呢！", 4000, 8);
      } else {
        showMessage("我的新衣服好看嘛？", 4000, 8);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* ---------- 一言 API ---------- */

  const oneSentenceHandlers = {
    "lwl12.com": async () => {
      const result = await fetchJSON("https://api.lwl12.com/hitokoto/v1?encode=realjson");
      showMessage(result.text, 6000, 9);
      setTimeout(() => {
        showMessage(`这一句来自 <span>${escapeHtml(result.source)}</span>`, 4000, 8);
      }, 6000);
    },
    "hitokoto.cn": async () => {
      const result = await fetchJSON("https://v1.hitokoto.cn");
      showMessage(result.hitokoto, 6000, 9);
      const text = `这一句来自 <span>「${escapeHtml(result.from)}」</span>，喜欢吗？ φ(゜▽゜*)♪ 是 <span>${escapeHtml(result.creator)}</span> 投稿的喔`;
      setTimeout(() => {
        showMessage(text, 4000, 8);
      }, 6000);
    },
    "jinrishici.com": async () => {
      const result = await fetchJSON("https://v2.jinrishici.com/one.json");
      showMessage(result.data.content, 5000, 9);
      const text = `偷偷告述你这一句诗词来自<span>${escapeHtml(result.data.origin.dynasty)}</span>·<span>${escapeHtml(result.data.origin.author)}</span><span>【${escapeHtml(result.data.origin.title)}】</span>~ 要熟背古诗词呀! ＞︿＜`;
      setTimeout(() => {
        showMessage(text, 4000, 8);
      }, 5000);
    },
    "ipayy.net": async () => {
      const result = await fetchJSON("https://cdn.ipayy.net/says/api.php");
      showMessage(escapeHtml(result), 6000, 9);
    }
  };

  // 显示一言
  async function showOneSentence() {
    const handler = oneSentenceHandlers[live2d_settings.oneSentenceAPI];
    if (!handler) {
      showMessage("一言 API 设置错误哟~", 4000, 8);
      return;
    }
    try {
      await handler();
    } catch (error) {
      console.error(error);
    }
  }

  /* ---------- 部件 DOM 与样式 ---------- */

  // 插入部件 DOM（重复调用时先移除旧节点，避免 id 重复）
  function createWidgetDOM() {
    document.getElementById("waifu")?.remove();
    document.body.insertAdjacentHTML("beforeend", `
      <div id="waifu">
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
      </div>`);
  }

  // 按配置应用部件样式
  function applyWidgetStyles(waifu, tool) {
    const [waifuWidth, waifuHeight] = live2d_settings.waifuSize.split("x");
    const [tipsWidth, tipsHeight] = live2d_settings.waifuTipsSize.split("x");
    const [edgeSide, edgeOffset] = live2d_settings.waifuEdgeSide.split(":");

    waifu.style.width = `${waifuWidth}px`;
    waifu.style.height = `${waifuHeight}px`;
    tips.style.width = `${tipsWidth}px`;
    tips.style.height = `${tipsHeight}px`;
    tips.style.top = live2d_settings.waifuToolTop;
    tips.style.fontSize = live2d_settings.waifuFontSize;
    if (!live2d_settings.showOneSentence) tips.style.display = "none";
    if (!live2d_settings.showToolMenu) tool.style.display = "none";

    // 工具栏按钮显隐（顺序与 DOM 中 span 一一对应）
    const buttonVisibility = [
      live2d_settings.showTurnToHomePage,   // 主页按钮
      live2d_settings.showSwitchOneSentence,// 一言按钮
      live2d_settings.showGame,             // game 按钮
      live2d_settings.showSwitchModel,      // 模型切换按钮
      live2d_settings.showSwitchTextures,   // 材质切换按钮
      live2d_settings.showTakeScreenshot,   // 截图按钮
      live2d_settings.showTurnToAboutPage,  // 关于页按钮
      live2d_settings.showCloseWaifu        // 关闭看板娘按钮
    ];
    const spans = tool.getElementsByTagName("span");
    buttonVisibility.forEach((visible, index) => {
      if (!visible) spans[index].style.display = "none";
    });
    for (const span of spans) {
      span.style.lineHeight = live2d_settings.waifuToolLine;
    }

    // 贴边方向
    if (edgeSide === "left") {
      waifu.style.left = `${edgeOffset}px`;
    } else if (edgeSide === "right") {
      waifu.style.right = `${edgeOffset}px`;
    }
  }

  // 规范化部分配置项
  function normalizeSettings() {
    live2d_settings.homePageURL = live2d_settings.homePageURL === "auto"
      ? `${location.protocol}//${location.hostname}/`
      : live2d_settings.homePageURL;
    if (location.protocol === "file:" && live2d_settings.waifuAPI.startsWith("//")) {
      live2d_settings.waifuAPI = `http:${live2d_settings.waifuAPI}`;
    }
  }

  // 拖拽操作需要 jQuery 和 jQuery UI 的支持（可选依赖）
  function setupDraggable() {
    try {
      if (live2d_settings.waifuDraggable === "axis-x") {
        $("#waifu").draggable({
          axis: "x",
          revert: live2d_settings.waifuDraggableRevert
        });
      } else if (live2d_settings.waifuDraggable === "unlimited") {
        $("#waifu").draggable({ revert: live2d_settings.waifuDraggableRevert });
      } else {
        $("#waifu").css("transition", "all .3s ease-in-out");
      }
    } catch (error) {
      console.log("[Error] JQuery and JQuery UI are not defined.");
    }
  }

  /* ---------- 空闲检测 ---------- */

  // 检测用户活动状态，空闲时每隔 25 秒显示一条消息
  function startIdleDetection() {
    window.addEventListener("mousemove", () => (userAction = true));
    window.addEventListener("keydown", () => (userAction = true));
    // 每隔一秒探测用户活动状态
    setInterval(() => {
      if (userAction) {
        userAction = false;
        clearInterval(userActionTimer);
        userActionTimer = null;
      } else if (!userActionTimer) {
        userActionTimer = setInterval(() => {
          showMessage(randomSelection(messageArray), 6000, 5);
        }, 25000);
      }
    }, 1000);
  }

  /* ---------- 消息文案配置（waifu-tips.json） ---------- */

  // 为 mouseover / click 事件绑定选择器消息
  function bindSelectorMessages(type, rules) {
    window.addEventListener(type, event => {
      for (const { selector, text } of rules) {
        if (!event.target.matches(selector)) continue;
        let message = randomSelection(text);
        message = message.replace("{text}", escapeHtml(event.target.innerText));
        showMessage(message, 4000, 8);
        return;
      }
    });
  }

  // 加载节日消息，命中时间区间的追加到空闲消息池
  function loadFestivalMessages(festivals) {
    const now = formatMonthDay(new Date());
    const dateNow = new Date();
    festivals.forEach(({ date, text }) => {
      const [start, end = start] = date.split("-");
      // 利用字符串对比规则判断当前是否处于节日时间段
      if (start <= now && now <= end) {
        let message = randomSelection(text);
        message = message.replace("{year}", dateNow.getFullYear());          // 普通处理
        message = message.replace("{year-1949}", dateNow.getFullYear() - 1949); // 国庆节处理
        messageArray.push(message);
      }
    });
  }

  // 加载并解析 waifu-tips.json
  function loadTipsJson(waifuJson) {
    fetch(waifuJson)
      .then(response => response.json())
      .then(result => {
        bindSelectorMessages("mouseover", result.mouseover);
        bindSelectorMessages("click", result.click);
        loadFestivalMessages(result.festival);
      })
      .catch(error => console.error("waifu-tips.json 加载失败", error));
  }

  /* ---------- 欢迎消息 ---------- */

  // 主页按时段问候
  function getHomeGreeting() {
    const hour = new Date().getHours();
    const greetings = [
      [5, 7, "hi！早上好！一日之计在于晨，美好的一天就要开始了。"],
      [7, 11, "上午好！工作学习顺利嘛，不要久坐，多起来走动走动哦！"],
      [11, 13, "中午了，工作了一个上午，我都快饿了，一起去干饭吧！"],
      [13, 17, "午后很容易犯困呢，不过还是要打起十二分的精神，小家会陪您一起努力的 q(≧▽≦q)"],
      [17, 19, "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~"],
      [19, 21, "晚上好，今天过得怎么样？工作学习目标完成了吗？"],
      [21, 23, ["已经这么晚了呀，早点休息吧,晚安～", "深夜时要爱护眼睛呀！"]]
    ];
    for (const [start, end, greeting] of greetings) {
      if (hour > start && hour <= end) return greeting;
    }
    return "你是夜猫子呀？这么晚还不睡觉，明天起得来嘛？";
  }

  // 非主页时按来源（referrer）问候
  function getReferrerGreeting() {
    const title = escapeHtml(document.title.split(" - ")[0]);
    const unknown = `不知名星球的朋友，欢迎阅读<span>「${title}」</span>`;
    if (document.referrer === "") return unknown;

    let referrer;
    try {
      referrer = new URL(document.referrer);
    } catch (error) {
      return unknown;
    }
    if (location.hostname === referrer.hostname) {
      return `欢迎阅读<span>「${title}」</span>`;
    }
    const domain = referrer.hostname.split(".")[1];
    if (domain === "baidu") {
      const keyword = escapeHtml(getSearchParam(referrer.search, "wd"));
      return `Hello！来自 百度搜索 的朋友<br/>你是搜索 <span>${keyword}</span> 找到的我吗？<br/>欢迎阅读<span>「${title}」</span>`;
    }
    if (domain === "so") {
      const keyword = escapeHtml(getSearchParam(referrer.search, "q"));
      return `Hello！来自 360搜索 的朋友<br/>你是搜索 <span>${keyword}</span> 找到的我吗？<br/>欢迎阅读<span>「${title}」</span>`;
    }
    if (domain === "google") {
      return `Hello！来自 谷歌搜索 的朋友<br/>欢迎阅读<span>「${title}」</span>`;
    }
    return `Hello！来自 <span>${escapeHtml(referrer.hostname)}</span> 的朋友<br/>欢迎阅读<span>「${title}」</span>`;
  }

  function welcomeMessage() {
    const text = location.pathname === "/" ? getHomeGreeting() : getReferrerGreeting();
    showMessage(text, 7000, 9);
  }

  /* ---------- 工具栏事件 ---------- */

  function registerToolListeners(waifu, toggle) {
    // 回到主页
    document.querySelector("#waifu-tool .faui-home").addEventListener("click", () => {
      location.href = live2d_settings.homePageURL;
    });
    // 一言
    document.querySelector("#waifu-tool .faui-msg").addEventListener("click", showOneSentence);
    // "打飞机"小游戏（按需加载脚本）
    document.querySelector("#waifu-tool .faui-game").addEventListener("click", () => {
      if (window.Asteroids) {
        window.ASTEROIDSPLAYERS = window.ASTEROIDSPLAYERS || [];
        window.ASTEROIDSPLAYERS.push(new Asteroids());
      } else {
        const script = document.createElement("script");
        script.src = `${live2d_settings.resourcePath}js/asteroids.js`;
        document.head.appendChild(script);
      }
    });
    // "换人"
    document.querySelector("#waifu-tool .faui-model").addEventListener("click", switchModel);
    // "换装"
    document.querySelector("#waifu-tool .faui-textures").addEventListener("click", switchTextures);
    // "照相"
    document.querySelector("#waifu-tool .faui-photo").addEventListener("click", () => {
      showMessage("照好了嘛，是不是很可爱呢？", 5000, 9);
      Live2D.captureName = live2d_settings.screenshotCaptureName;
      Live2D.captureFrame = true;
    });
    // 关于项目
    document.querySelector("#waifu-tool .faui-about").addEventListener("click", () => {
      window.open(live2d_settings.aboutPageURL, "_blank");
    });
    // 关闭看板娘
    document.querySelector("#waifu-tool .faui-remove").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEYS.display, Date.now()); // 存储"隐藏"状态
      showMessage("愿你有一天能和重要的人重逢。", 2000, 9);
      waifu.style.bottom = "-1000px";
      setTimeout(() => {
        waifu.style.display = "none";
        toggle.classList.add("waifu-toggle-active");
      }, 3000);
    });

    // 打开控制台提示
    if (live2d_settings.showF12Message) {
      const devtools = () => {};
      console.log("%c", devtools);
      devtools.toString = () => {
        showMessage("嘿嘿，你打开了控制台，是想要看看我的小秘密吗？", 5000, 7);
      };
    }
    // 复制提示
    if (live2d_settings.showCopyMessage) {
      window.addEventListener("copy", () => {
        showMessage("你都复制了些什么呀，转载记得加上出处哦！", 5000, 7);
      });
    }
    // "离开"后"回来"
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) showMessage("哇，你终于回来了~", 5000, 7);
    });
  }

  /* ---------- 初始化 ---------- */

  // 初始化模型并加载消息文案
  function initModel(waifuJson) {
    let modelId = localStorage.getItem(STORAGE_KEYS.modelId);
    let texturesId = localStorage.getItem(STORAGE_KEYS.texturesId);
    // 首次访问加载指定模型的指定材质
    if (modelId === null) {
      modelId = live2d_settings.modelId;
      texturesId = live2d_settings.texturesId;
    }
    loadModelAndTextures(modelId, texturesId);
    console.log("欢迎使用 Live2d 看板娘");
    loadTipsJson(waifuJson);
  }

  // 加载部件
  function loadWidget(waifuJson, waifuAPI) {
    if (typeof waifuAPI !== "string") {
      console.error("Waifu API路径设置错误！！！");
      return;
    }
    apiPath = waifuAPI.endsWith("/") ? waifuAPI : `${waifuAPI}/`;

    // 清空存储的状态
    localStorage.removeItem(STORAGE_KEYS.display);
    sessionStorage.removeItem(STORAGE_KEYS.text);

    // 添加部件
    createWidgetDOM();
    const waifu = document.getElementById("waifu");
    const toggle = document.getElementById("waifu-toggle");
    const tool = document.getElementById("waifu-tool");
    tips = document.getElementById("waifu-tips");

    // 加载看板娘样式
    applyWidgetStyles(waifu, tool);
    normalizeSettings();
    setupDraggable();

    // 部件浮现
    setTimeout(() => (waifu.style.bottom = 0), 100);

    startIdleDetection();
    initModel(waifuJson);
    registerToolListeners(waifu, toggle);
    welcomeMessage();
  }

  // 初始化部件
  function initWidget(waifuJson = `${live2d_settings.resourcePath}json/waifu-tips.json`, waifuAPI) {
    // 页面宽度小于 waifuMinWidth 时不显示部件
    if (window.innerWidth <= live2d_settings.waifuMinWidth) return;

    // 添加看板娘切换按钮
    document.body.insertAdjacentHTML("beforeend", `
      <div id="waifu-toggle">
        <span>看板娘</span>
      </div>`);

    const toggle = document.getElementById("waifu-toggle");
    // 添加"点击"事件监听
    toggle.addEventListener("click", () => {
      toggle.classList.remove("waifu-toggle-active");
      if (toggle.getAttribute("first-time")) {
        toggle.removeAttribute("first-time");
        loadWidget(waifuJson, waifuAPI);
      } else {
        // 重置显示状态
        localStorage.removeItem(STORAGE_KEYS.display);
        const waifu = document.getElementById("waifu");
        waifu.style.display = "";
        setTimeout(() => (waifu.style.bottom = 0), 0);
      }
    });

    const hiddenAt = localStorage.getItem(STORAGE_KEYS.display);
    if (hiddenAt && Date.now() - hiddenAt <= DISPLAY_EXPIRE_MS) {
      toggle.setAttribute("first-time", "true");
      // 隐藏看板娘（显示看板娘激活按钮）
      setTimeout(() => toggle.classList.add("waifu-toggle-active"), 0);
    } else { // 距上次隐藏已超过一天，直接加载部件
      loadWidget(waifuJson, waifuAPI);
    }
  }

  // 暴露全局接口（autoload.js 通过 <script> 标签调用）
  window.initWidget = initWidget;
  window.loadWidget = loadWidget;
})();
