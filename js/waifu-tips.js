/*!
 * live2d-widget 看板娘核心逻辑（v1.6.1）
 *
 * 职责：
 *  - 创建看板娘 DOM 并按 waifuSettings 应用样式
 *  - 消息系统：欢迎语、一言、节日祝福、空闲吐槽、复制 / 控制台提示
 *  - 模型 / 材质（皮肤）在线切换，并持久化到 localStorage
 *  - 工具栏事件绑定与原生拖拽（无任何第三方依赖）
 *
 * 文案策略：
 *  - 全部提示文案维护在 waifu-tips.json（按 welcome / idle / hitokoto / interaction /
 *    mouseover / click / festival 分组），本文件只定义读取逻辑，不含任何文案内容；
 *    扩展消息、节日等只需修改 JSON，无需改动代码
 *
 * 依赖：
 *  - lib/live2d.js   Live2D Cubism 2 渲染核心（提供全局 loadlive2d / Live2D）
 *  - js/autoload.js  全局配置 waifuSettings
 */
(function () {
  "use strict";

  /* ---------- 常量 ---------- */

  // localStorage / sessionStorage 键名集中管理，避免魔法字符串散落各处
  const STORAGE_KEYS = {
    display: "waifu-display", // 看板娘关闭时间戳（毫秒）
    text: "waifu-text",       // 当前提示消息的优先级（用于打断判断）
    modelId: "modelId",       // 上次选择的模型 ID
    texturesId: "texturesId"  // 上次选择的材质 ID
  };

  // 切换方式配置值（"random" / "sequential"）-> 模型 API 端点片段映射
  const SWITCH_MODE_ENDPOINTS = {
    model: { random: "rand", sequential: "switch" },
    textures: { random: "rand_textures", sequential: "switch_textures" }
  };

  /* ---------- 模块状态 ---------- */

  let apiPath = "";       // 看板娘 API 地址（loadWidget 时初始化）
  let tipsEl = null;        // 提示框元素（#waifu-tips）
  let messageTimer = null;  // 当前消息的隐藏定时器
  let isUserActive = false;   // 用户活动状态（用于空闲检测）
  let idleMessageTimer = null;
  let messages = null;                      // waifu-tips.json 全量文案（loadTipsJson 成功后赋值）
  const messageArray = [];                  // 空闲消息池（JSON 的 idle + 命中区间的节日消息）

  /* ---------- 通用工具 ---------- */

  /**
   * 随机选择消息
   * @param {string|string[]} obj - 数组时随机取一条，字符串原样返回
   * @returns {string}
   */
  function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
  }

  /**
   * 转义 HTML，防止页面文本 / URL 参数被注入提示框
   * （消息文案本身允许内联 HTML，因此仅在拼接动态内容时使用）
   * @param {*} text - 任意值，null/undefined 转为空字符串
   * @returns {string}
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text == null ? "" : String(text);
    return div.innerHTML;
  }

  /**
   * 消息模板占位符替换：将 {key} 替换为 vars 中对应的值，缺失的占位符替换为空字符串
   * @param {string} template - 消息模板
   * @param {Object<string, string>} vars - 占位符键值对（值应为已转义的文本）
   * @returns {string}
   */
  function formatMessage(template, vars) {
    return String(template ?? "").replace(/\{([a-zA-Z_]+)\}/g, (placeholder, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : "");
  }

  /**
   * 按点路径从对象取值（如 "data.origin.title"），路径无效时返回 undefined
   * 用于一言等配置化的响应字段映射
   * @param {object} obj - 目标对象
   * @param {string} path - 字段路径
   * @returns {*}
   */
  function getField(obj, path) {
    return String(path).split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  /**
   * 从 search 字符串中安全取查询参数，不存在时返回空字符串
   * @param {string} search - URL 的 query 部分（含 "?"）
   * @param {string} key - 参数名
   * @returns {string}
   */
  function getSearchParam(search, key) {
    const match = search.match(new RegExp(`[?&]${key}=([^&]*)`));
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
  }

  /**
   * 将日期格式化为 MM/DD，用于节日区间比较（利用字符串字典序即可比较区间）
   * @param {Date} date
   * @returns {string}
   */
  function formatMonthDay(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  }

  /**
   * 解析资源地址：绝对 URL（http(s):// 或协议相对 //）原样返回，相对路径基于 resourcePath 拼接
   * @param {string} path - 完整 URL 或相对 resourcePath 的路径
   * @returns {string}
   */
  function resolveResource(path) {
    return /^(https?:)?\/\//.test(path) ? path : waifuSettings.resourcePath + path;
  }

  /**
   * 请求 JSON 接口（自动校验 HTTP 状态码）
   * @param {string} url
   * @returns {Promise<object>}
   */
  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${url} (HTTP ${response.status})`);
    return response.json();
  }

  /* ---------- 消息系统 ---------- */

  /**
   * 显示提示消息
   * 优先级机制：会话内已存在更高（数值更大）优先级的消息时，低优先级消息不打断
   * @param {string|string[]} text - 要显示的文本（多句时随机选择；空值直接忽略）
   * @param {number} timeout - 显示持续时间（毫秒）
   * @param {number} priority - 优先级，数字越大越高
   */
  function showMessage(text, timeout, priority) {
    // current 为字符串，与数字比较时自动按数值处理
    const current = sessionStorage.getItem(STORAGE_KEYS.text);
    if (!text || (current && current > priority)) return;
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    sessionStorage.setItem(STORAGE_KEYS.text, priority);
    tipsEl.innerHTML = randomSelection(text);
    tipsEl.classList.add("waifu-tips-active");
    messageTimer = setTimeout(() => {
      sessionStorage.removeItem(STORAGE_KEYS.text);
      tipsEl.classList.remove("waifu-tips-active");
      messageTimer = null;
    }, timeout);
  }

  /* ---------- 模型与材质 ---------- */

  /**
   * 加载模型和材质，并持久化当前选择
   * @param {number|string} modelId - 模型 ID
   * @param {number|string} [texturesId] - 材质 ID，缺省时使用 0 号材质
   */
  function loadModelAndTextures(modelId, texturesId) {
    if (texturesId === undefined) texturesId = 0; // 未传入材质 ID 时默认使用 0 号材质
    localStorage.setItem(STORAGE_KEYS.modelId, modelId);
    localStorage.setItem(STORAGE_KEYS.texturesId, texturesId);
    loadlive2d("live2d", `${apiPath}/get/?id=${modelId}-${texturesId}`);
    console.log(`[waifu] Live2D model ${modelId}-${texturesId} loaded`);
  }

  /** "换人"：按配置的随机 / 顺序方式切换模型 */
  async function switchModel() {
    const modelId = localStorage.getItem(STORAGE_KEYS.modelId);
    // 配置值映射为 API 端点，非法配置回退为顺序切换
    const endpoint = SWITCH_MODE_ENDPOINTS.model[waifuSettings.modelSwitchMode] || "switch";
    try {
      const result = await fetchJson(`${apiPath}/${endpoint}/?id=${modelId}`);
      loadModelAndTextures(result.model.id);
      showMessage(result.model.message, 4000, 8);
    } catch (error) {
      console.error(error);
    }
  }

  /** "换装"：按配置的随机 / 顺序方式切换材质 */
  async function switchTextures() {
    const modelId = localStorage.getItem(STORAGE_KEYS.modelId);
    const texturesId = localStorage.getItem(STORAGE_KEYS.texturesId);
    // 配置值映射为 API 端点，非法配置回退为随机切换
    const endpoint = SWITCH_MODE_ENDPOINTS.textures[waifuSettings.texturesSwitchMode] || "rand_textures";
    try {
      const result = await fetchJson(`${apiPath}/${endpoint}/?id=${modelId}-${texturesId}`);
      loadModelAndTextures(modelId, result.textures.id);
      // 切换后仍是 1 号材质，说明该模型没有其他衣服
      if (result.textures.id === 1 && (texturesId === "1" || texturesId === "0")) {
        showMessage(messages?.interaction?.texturesNone, 4000, 8);
      } else {
        showMessage(messages?.interaction?.texturesNew, 4000, 8);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* ---------- 一言（Hitokoto） ---------- */

  /**
   * 显示一言：按 hitokotoApi 配置请求数据源并按字段映射解析，
   * 来源说明文案使用 JSON 的 hitokoto.source 模板（{from} / {creator} 占位符）
   */
  async function showHitokoto() {
    const api = waifuSettings.hitokotoApi;
    if (!api || !api.url || !api.text) {
      showMessage(messages?.hitokoto?.error, 4000, 8);
      return;
    }
    try {
      const result = await fetchJson(api.url);
      showMessage(getField(result, api.text), 6000, 9);
      // 按配置的字段映射填充来源模板（未配置的字段替换为空字符串）
      const vars = {};
      if (api.from) vars.from = escapeHtml(String(getField(result, api.from) ?? ""));
      if (api.creator) vars.creator = escapeHtml(String(getField(result, api.creator) ?? ""));
      const sourceText = formatMessage(messages?.hitokoto?.source, vars);
      setTimeout(() => showMessage(sourceText, 4000, 8), 6000);
    } catch (error) {
      console.error(error);
    }
  }

  /* ---------- 部件 DOM 与样式 ---------- */

  /** 插入部件 DOM（重复调用时先移除旧节点，避免 id 重复） */
  function createWidgetDom() {
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

  /**
   * 按配置应用部件样式（尺寸类配置支持任意 CSS 单位）
   * @param {HTMLElement} waifu - 看板娘容器（#waifu）
   * @param {HTMLElement} tool - 工具栏（#waifu-tool）
   */
  function applyWidgetStyles(waifu, tool) {
    waifu.style.width = waifuSettings.waifuWidth;
    waifu.style.height = waifuSettings.waifuHeight;

    // 画布分辨率取配置的像素数值（canvas 宽高属性仅接受整数像素）
    const canvas = waifu.querySelector("#live2d");
    canvas.width = parseInt(waifuSettings.waifuWidth, 10);
    canvas.height = parseInt(waifuSettings.waifuHeight, 10);

    tipsEl.style.width = waifuSettings.waifuTipsWidth;
    tipsEl.style.height = waifuSettings.waifuTipsHeight;
    tipsEl.style.fontSize = waifuSettings.waifuFontSize;
    // 工具栏顶部偏移（相对 #waifu 容器）
    tool.style.top = waifuSettings.waifuToolTop;

    if (!waifuSettings.showTips) tipsEl.style.display = "none";
    if (!waifuSettings.showToolMenu) tool.style.display = "none";

    // 工具栏按钮显隐（顺序与 DOM 中 span 一一对应）
    const buttonVisibility = [
      waifuSettings.showTurnToHomePage,  // 主页按钮
      waifuSettings.showHitokoto,        // 一言按钮
      waifuSettings.showGame,            // game 按钮
      waifuSettings.showSwitchModel,     // 模型切换按钮
      waifuSettings.showSwitchTextures,  // 材质切换按钮
      waifuSettings.showTakeScreenshot,  // 截图按钮
      waifuSettings.showTurnToAboutPage, // 关于页按钮
      waifuSettings.showCloseWaifu       // 关闭看板娘按钮
    ];
    const spans = tool.getElementsByTagName("span");
    buttonVisibility.forEach((visible, index) => {
      if (!visible) spans[index].style.display = "none";
    });
    for (const span of spans) {
      span.style.lineHeight = waifuSettings.waifuToolLineHeight;
    }

    // 贴边方向与偏移（偏移为数字时按像素处理，也可填带单位的字符串）
    const edgeOffset = typeof waifuSettings.waifuEdgeOffset === "number"
      ? `${waifuSettings.waifuEdgeOffset}px`
      : waifuSettings.waifuEdgeOffset;
    if (waifuSettings.waifuEdge === "right") {
      waifu.style.right = edgeOffset;
    } else {
      waifu.style.left = edgeOffset;
    }
  }

  /** 规范化部分配置项（主页地址、file: 协议下的 API 地址） */
  function normalizeSettings() {
    waifuSettings.homePageUrl = waifuSettings.homePageUrl === "auto"
      ? `${location.protocol}//${location.hostname}/`
      : waifuSettings.homePageUrl;
    if (location.protocol === "file:" && waifuSettings.waifuApi.startsWith("//")) {
      waifuSettings.waifuApi = `http:${waifuSettings.waifuApi}`;
    }
  }

  /* ---------- 原生拖拽（无第三方依赖） ---------- */

  /**
   * 为看板娘启用原生 Pointer Events 拖拽
   * 拖拽把手为 #live2d 画布，避免与工具栏按钮、提示框的点击冲突
   *
   * waifuSettings.waifuDraggable 取值：
   *  - "disable"   禁用拖拽（保持部件快速滑入动画）
   *  - "axis-x"    仅水平方向拖拽
   *  - "unlimited" 自由拖拽
   * waifuSettings.waifuDraggableRevert：松开后是否平滑回到原位
   *
   * @param {HTMLElement} waifu - 看板娘容器（#waifu）
   */
  function setupDraggable(waifu) {
    const mode = waifuSettings.waifuDraggable;
    if (mode !== "axis-x" && mode !== "unlimited") {
      // 禁用拖拽：还原为整体过渡，保持部件快速滑入的观感
      waifu.style.transition = "all .3s ease-in-out";
      return;
    }

    const revert = waifuSettings.waifuDraggableRevert;
    const handle = waifu.querySelector("#live2d");
    // 触屏拖拽时阻止把手上的页面滚动手势（仅拖拽启用时生效）
    handle.style.touchAction = "none";

    handle.addEventListener("pointerdown", event => {
      // 仅响应主按钮（鼠标左键 / 触摸主指针）
      if (event.button !== 0) return;
      event.preventDefault();

      // 记录起始状态：指针坐标 + 部件当前渲染位置
      const startX = event.clientX;
      const startY = event.clientY;
      const rect = waifu.getBoundingClientRect();
      const originLeft = rect.left;
      const originTop = rect.top;

      // #waifu 默认以 bottom 贴边定位，拖拽期间切换为 left/top 定位
      waifu.style.transition = "none"; // 拖拽过程禁用过渡，保证跟手
      waifu.style.right = "auto";
      waifu.style.bottom = "auto";
      waifu.style.left = `${originLeft}px`;
      waifu.style.top = `${originTop}px`;

      // 指针捕获：即使指针移出把手范围，仍可持续接收 move / up 事件
      handle.setPointerCapture(event.pointerId);

      const onMove = moveEvent => {
        waifu.style.left = `${originLeft + moveEvent.clientX - startX}px`;
        if (mode === "unlimited") {
          waifu.style.top = `${originTop + moveEvent.clientY - startY}px`;
        }
      };
      const onFinish = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onFinish);
        handle.removeEventListener("pointercancel", onFinish);
        if (revert) {
          // 松开后平滑回到原位，动画结束后恢复默认过渡
          waifu.style.transition = "left .3s ease-out, top .3s ease-out";
          waifu.style.left = `${originLeft}px`;
          waifu.style.top = `${originTop}px`;
          setTimeout(() => (waifu.style.transition = ""), 300);
        }
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onFinish);
      handle.addEventListener("pointercancel", onFinish);
    });
  }

  /* ---------- 空闲检测 ---------- */

  /**
   * 检测用户活动状态：鼠标 / 键盘有输入视为活跃；
   * 持续空闲后每隔 idleMessageInterval 从消息池随机显示一条
   */
  function startIdleDetection() {
    window.addEventListener("mousemove", () => (isUserActive = true));
    window.addEventListener("keydown", () => (isUserActive = true));
    // 每隔一秒探测用户活动状态
    setInterval(() => {
      if (isUserActive) {
        isUserActive = false;
        clearInterval(idleMessageTimer);
        idleMessageTimer = null;
      } else if (!idleMessageTimer) {
        idleMessageTimer = setInterval(() => {
          showMessage(randomSelection(messageArray), 6000, 5);
        }, waifuSettings.idleMessageInterval);
      }
    }, 1000);
  }

  /* ---------- 消息文案配置（waifu-tips.json） ---------- */

  /**
   * 应用 JSON 文案：以 JSON 的 idle 池初始化空闲消息池
   * @param {object} result - waifu-tips.json 解析结果
   */
  function applyMessages(result) {
    messages = result;
    messageArray.length = 0;
    messageArray.push(...messages.idle);
  }

  /**
   * 为 mouseover / click 事件绑定选择器消息
   * @param {"mouseover"|"click"} type - 事件类型
   * @param {Array<{selector: string, text: string|string[]}>} rules - 触发规则
   */
  function bindSelectorMessages(type, rules) {
    window.addEventListener(type, event => {
      // 点击滚动条等场景下 target 可能不是元素节点，避免 matches 调用报错
      if (!(event.target instanceof Element)) return;
      for (const { selector, text } of rules) {
        if (!event.target.matches(selector)) continue;
        let message = randomSelection(text);
        message = message.replace("{text}", escapeHtml(event.target.innerText)); // {text} 占位符引用命中元素的文本
        showMessage(message, 4000, 8);
        return;
      }
    });
  }

  /**
   * 加载节日消息，命中时间区间的追加到空闲消息池
   * @param {Array<{date: string, text: string|string[]}>} festivals - date 支持单日（"10/01"）或区间（"11/10-11/12"）
   */
  function loadFestivalMessages(festivals) {
    const now = formatMonthDay(new Date());
    const dateNow = new Date();
    festivals.forEach(({ date, text }) => {
      const [start, end = start] = date.split("-");
      // 利用字符串对比规则判断当前是否处于节日时间段
      if (start <= now && now <= end) {
        let message = randomSelection(text);
        message = message.replace("{year}", dateNow.getFullYear());            // 普通处理
        message = message.replace("{year-1949}", dateNow.getFullYear() - 1949); // 国庆节处理
        messageArray.push(message);
      }
    });
  }

  /**
   * 加载并解析 waifu-tips.json：
   * 应用文案 -> 绑定选择器消息 -> 追加节日消息 -> 显示欢迎语
   * @param {string} waifuJson - JSON 路径
   */
  function loadTipsJson(waifuJson) {
    fetch(waifuJson)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(result => {
        applyMessages(result);
        bindSelectorMessages("mouseover", result.mouseover);
        bindSelectorMessages("click", result.click);
        loadFestivalMessages(result.festival);
        showWelcome(); // 文案就绪后再显示欢迎语
      })
      .catch(error => console.error("[waifu] Failed to load waifu-tips.json:", error));
  }

  /* ---------- 欢迎消息 ---------- */

  /** 主页按时段问候（welcome.hourTips 分段，23 点 ~ 次日 5 点走 welcome.night） */
  function getHomeGreeting() {
    const hour = new Date().getHours();
    for (const [start, end, greeting] of messages.welcome.hourTips) {
      if (hour > start && hour <= end) return greeting;
    }
    return messages.welcome.night;
  }

  /** 非主页时按来源（referrer）问候，识别常见搜索引擎并提取搜索词 */
  function getReferrerGreeting() {
    const referrerMessages = messages.welcome.referrer;
    const title = escapeHtml(document.title.split(" - ")[0]);
    const vars = { title };
    if (document.referrer === "") {
      return formatMessage(referrerMessages.default, vars);
    }

    let referrer;
    try {
      referrer = new URL(document.referrer);
    } catch (error) {
      return formatMessage(referrerMessages.default, vars);
    }
    if (location.hostname === referrer.hostname) {
      return formatMessage(referrerMessages.sameSite, vars);
    }
    // 取主域名（如 www.baidu.com -> baidu）匹配常见搜索引擎
    const domain = referrer.hostname.split(".")[1];
    if (domain === "baidu" || domain === "so") {
      vars.keyword = escapeHtml(getSearchParam(referrer.search, domain === "baidu" ? "wd" : "q"));
      return formatMessage(domain === "baidu" ? referrerMessages.baidu : referrerMessages.so, vars);
    }
    if (domain === "google") {
      return formatMessage(referrerMessages.google, vars);
    }
    vars.host = escapeHtml(referrer.hostname);
    return formatMessage(referrerMessages.other, vars);
  }

  /** 显示欢迎消息：主页按时段问候，其余页面按来源问候（文案未就绪时跳过） */
  function showWelcome() {
    if (!messages) return;
    const isHome = ["/", "/index.html"].includes(location.pathname);
    const text = isHome ? getHomeGreeting() : getReferrerGreeting();
    showMessage(text, 7000, 9);
  }

  /* ---------- 工具栏事件 ---------- */

  /**
   * 注册工具栏与全局事件
   * @param {HTMLElement} waifu - 看板娘容器（#waifu）
   * @param {HTMLElement} toggle - 恢复按钮（#waifu-toggle）
   */
  function registerToolListeners(waifu, toggle) {
    // 回到主页
    document.querySelector("#waifu-tool .faui-home").addEventListener("click", () => {
      location.href = waifuSettings.homePageUrl;
    });
    // 一言
    document.querySelector("#waifu-tool .faui-msg").addEventListener("click", showHitokoto);
    // "打飞机"小游戏（按需懒加载脚本；asteroids 脚本加载后会自动开始游戏）
    document.querySelector("#waifu-tool .faui-game").addEventListener("click", () => {
      if (window.Asteroids) {
        window.ASTEROIDSPLAYERS = window.ASTEROIDSPLAYERS || [];
        window.ASTEROIDSPLAYERS.push(new Asteroids());
      } else {
        const script = document.createElement("script");
        script.src = waifuSettings.asteroidsPath;
        script.onerror = () => console.error("[waifu] Failed to load asteroids script");
        document.head.appendChild(script);
      }
    });
    // "换人"
    document.querySelector("#waifu-tool .faui-model").addEventListener("click", switchModel);
    // "换装"
    document.querySelector("#waifu-tool .faui-textures").addEventListener("click", switchTextures);
    // "照相"
    document.querySelector("#waifu-tool .faui-photo").addEventListener("click", () => {
      showMessage(messages?.interaction?.screenshot, 5000, 9);
      Live2D.captureName = waifuSettings.screenshotCaptureName;
      Live2D.captureFrame = true;
    });
    // 关于项目
    document.querySelector("#waifu-tool .faui-about").addEventListener("click", () => {
      window.open(waifuSettings.aboutPageUrl, "_blank");
    });
    // 关闭看板娘
    document.querySelector("#waifu-tool .faui-remove").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEYS.display, Date.now()); // 存储"隐藏"状态
      showMessage(messages?.interaction?.hide, 2000, 9);
      // 自由拖拽后 #waifu 以 top 定位，需先换算回 bottom 定位，滑出动画才能生效
      const draggedTop = parseFloat(waifu.style.top);
      if (!Number.isNaN(draggedTop)) {
        waifu.style.transition = "none";
        waifu.style.top = "auto";
        waifu.style.bottom = `${window.innerHeight - draggedTop - waifu.offsetHeight}px`;
        void waifu.offsetHeight; // 强制回流，避免定位切换产生跳动
        waifu.style.transition = "";
      }
      waifu.style.bottom = "-1000px";
      setTimeout(() => {
        waifu.style.display = "none";
        toggle.classList.add("waifu-toggle-active");
      }, 3000);
    });

    // 打开控制台提示：利用控制台展开打印对象时会调用 toString 的特性
    if (waifuSettings.showF12Message) {
      const devtools = () => {};
      console.log("%c", devtools);
      devtools.toString = () => {
        showMessage(messages?.interaction?.consoleOpen, 5000, 7);
        return "";
      };
    }
    // 复制提示
    if (waifuSettings.showCopyMessage) {
      window.addEventListener("copy", () => {
        showMessage(messages?.interaction?.copy, 5000, 7);
      });
    }
    // "离开"后"回来"
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) showMessage(messages?.interaction?.back, 5000, 7);
    });
  }

  /* ---------- 初始化 ---------- */

  /**
   * 初始化模型并加载消息文案
   * @param {string} waifuJson - waifu-tips.json 路径
   */
  function initModel(waifuJson) {
    // 恢复上次的模型 / 材质选择，首次访问（无记录）时使用配置默认值
    const modelId = localStorage.getItem(STORAGE_KEYS.modelId) ?? waifuSettings.modelId;
    const texturesId = localStorage.getItem(STORAGE_KEYS.texturesId) ?? waifuSettings.texturesId;
    loadModelAndTextures(modelId, texturesId);
    console.log("[waifu] Live2D widget initialized");
    loadTipsJson(waifuJson);
  }

  /**
   * 加载部件（DOM、样式、事件、模型）
   * @param {string} waifuJson - waifu-tips.json 路径
   * @param {string} waifuApi - 看板娘 API 地址
   */
  function loadWidget(waifuJson, waifuApi) {
    if (typeof waifuApi !== "string") {
      console.error("[waifu] Invalid waifuApi setting, widget loading aborted");
      return;
    }
    apiPath = waifuApi.endsWith("/") ? waifuApi : `${waifuApi}/`;

    // 清空存储的状态
    localStorage.removeItem(STORAGE_KEYS.display);
    sessionStorage.removeItem(STORAGE_KEYS.text);

    // 添加部件
    createWidgetDom();
    const waifu = document.getElementById("waifu");
    const toggle = document.getElementById("waifu-toggle");
    const tool = document.getElementById("waifu-tool");
    tipsEl = document.getElementById("waifu-tips");

    // 加载看板娘样式
    applyWidgetStyles(waifu, tool);
    normalizeSettings();
    setupDraggable(waifu);

    // 部件浮现
    setTimeout(() => (waifu.style.bottom = 0), 100);

    startIdleDetection();
    initModel(waifuJson); // 欢迎语在 loadTipsJson 完成后触发
    registerToolListeners(waifu, toggle);
  }

  /**
   * 初始化部件（暴露给外部 / autoload.js 调用的入口）
   * @param {string} [waifuJson] - waifu-tips.json 地址，默认取配置 tipsPath（支持相对 / 完整 URL）
   * @param {string} [waifuApi] - 看板娘 API 地址
   */
  function initWidget(waifuJson = resolveResource(waifuSettings.tipsPath), waifuApi) {
    // 页面宽度小于 waifuMinWidth 时不显示部件
    if (window.innerWidth <= waifuSettings.waifuMinWidth) return;

    // 添加看板娘切换按钮（重复初始化时先移除旧节点，避免 id 重复）
    document.getElementById("waifu-toggle")?.remove();
    document.body.insertAdjacentHTML("beforeend", `
      <div id="waifu-toggle">
        <span>看板娘</span>
      </div>`);

    const toggle = document.getElementById("waifu-toggle");
    // 添加"点击"事件监听
    toggle.addEventListener("click", () => {
      toggle.classList.remove("waifu-toggle-active");
      if (toggle.getAttribute("first-time")) {
        // 上次会话隐藏过看板娘：移除标记并完整加载部件
        toggle.removeAttribute("first-time");
        loadWidget(waifuJson, waifuApi);
      } else {
        // 重置显示状态
        localStorage.removeItem(STORAGE_KEYS.display);
        const waifu = document.getElementById("waifu");
        waifu.style.display = "";
        setTimeout(() => (waifu.style.bottom = 0), 0);
      }
    });

    const hiddenAt = localStorage.getItem(STORAGE_KEYS.display);
    if (hiddenAt && Date.now() - hiddenAt <= waifuSettings.hiddenExpireMs) {
      // 有效期内关闭过：仅显示恢复按钮，不加载部件
      toggle.setAttribute("first-time", "true");
      setTimeout(() => toggle.classList.add("waifu-toggle-active"), 0);
    } else { // 距上次隐藏已超过有效期，直接加载部件
      loadWidget(waifuJson, waifuApi);
    }
  }

  // 暴露全局接口（autoload.js 通过 <script> 标签调用）
  window.initWidget = initWidget;
  window.loadWidget = loadWidget;
})();
