(function () {
  // すでに挿入済みなら一度消す
  const oldBtn = document.getElementById("miniTweetPadBtn");
  if (oldBtn) oldBtn.remove();
  const oldPanel = document.getElementById("miniTweetPadPanel");
  if (oldPanel) oldPanel.remove();

  // 設定値のデフォルト
  const DEFAULTS = {
    opacity: 0.85,
    width: 320,
    height: 300,
    theme: "dark"
  };

  // 設定を取得してからUIを作る
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    createUI(cfg);
  });

  function createUI(cfg) {
    // 右下の＋ボタン
    const btn = document.createElement("div");
    btn.id = "miniTweetPadBtn";
    btn.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      background: #1d9bf0;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 32px;
      z-index: 2147483647;
    `;
    btn.textContent = "+";
    document.body.appendChild(btn);

    // パネル本体
    const panel = document.createElement("div");
    panel.id = "miniTweetPadPanel";
    panel.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 90px;
      width: ${cfg.width}px;
      height: ${cfg.height}px;
      background: rgba(21,32,43,${cfg.opacity});
      backdrop-filter: blur(6px);
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      display: none;
      flex-direction: column;
      z-index: 2147483647;
      resize: both;
      overflow: hidden;
    `;

    panel.innerHTML = `
      <div style="padding:10px;color:white;font-size:14px;font-weight:bold;border-bottom:1px solid #38444d;">
        いまどうしてる？
      </div>
      <textarea id="mtp_text" style="
        flex:1;
        background:#192734;
        color:white;
        border:none;
        padding:10px;
        resize:none;
        outline:none;
        font-size:14px;
      "></textarea>
      <div style="
        padding:8px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        border-top:1px solid #38444d;
      ">
        <span id="mtp_count" style="font-size:12px;opacity:0.8;">0 / 280</span>
        <button id="mtp_post" style="
          background:#1d9bf0;
          border:none;
          color:white;
          padding:6px 14px;
          border-radius:14px;
          font-size:12px;
          cursor:pointer;
        ">投稿</button>
      </div>
      <div id="mtp_confirm" style="
        position:absolute;
        left:0;top:0;
        width:100%;height:100%;
        background:rgba(0,0,0,0.6);
        display:none;
        justify-content:center;
        align-items:center;
      ">
        <div style="
          background:#192734;
          padding:16px;
          border-radius:10px;
          width:80%;
          max-width:260px;
        ">
          <p style="margin-bottom:16px;font-size:14px;">本当に投稿しますか？</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button id="mtp_cancel" style="
              background:#555;
              color:white;
              border:none;
              padding:6px 12px;
              border-radius:6px;
              font-size:12px;
            ">キャンセル</button>
            <button id="mtp_ok" style="
              background:#1d9bf0;
              color:white;
              border:none;
              padding:6px 12px;
              border-radius:6px;
              font-size:12px;
            ">投稿</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const textarea = panel.querySelector("#mtp_text");
    const count = panel.querySelector("#mtp_count");
    const postBtn = panel.querySelector("#mtp_post");
    const confirmBox = panel.querySelector("#mtp_confirm");
    const okBtn = panel.querySelector("#mtp_ok");
    const cancelBtn = panel.querySelector("#mtp_cancel");

    // テーマ適用
    applyTheme(cfg.theme, panel, textarea, count);

    // 下書き自動保存（単一スロット版）
    chrome.storage.sync.get({ miniTweetPadDraft: "" }, (v) => {
      textarea.value = v.miniTweetPadDraft || "";
      updateCount();
    });

    function updateCount() {
      const len = [...textarea.value].length;
      count.textContent = `${len} / 280`;
      if (len > 280) {
        count.style.color = "red";
        postBtn.disabled = true;
        postBtn.style.opacity = "0.5";
      } else {
        count.style.color = cfg.theme === "light" ? "#111" : "white";
        postBtn.disabled = false;
        postBtn.style.opacity = "1";
      }
      chrome.storage.sync.set({ miniTweetPadDraft: textarea.value });
    }

    textarea.addEventListener("input", updateCount);

    // ＋ボタンで開閉
    btn.onclick = () => {
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    };

    // ショートカットからのメッセージ
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "toggle-panel") {
        panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      }
    });

    // 投稿ボタン → 確認ダイアログ
    postBtn.onclick = () => {
      confirmBox.style.display = "flex";
    };

    cancelBtn.onclick = () => {
      confirmBox.style.display = "none";
    };

    okBtn.onclick = () => {
      const text = encodeURIComponent(textarea.value);
      window.open("https://twitter.com/intent/tweet?text=" + text, "_blank");
      confirmBox.style.display = "none";
    };

    // Ctrl+Enter で投稿
    textarea.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        postBtn.click();
      }
    });
  }

  function applyTheme(theme, panel, textarea, count) {
    if (theme === "light") {
      panel.style.backgroundColor = "rgba(255,255,255,0.95)";
      textarea.style.background = "#f5f5f5";
      textarea.style.color = "#111";
      count.style.color = "#111";
    } else {
      // ダーク
      // 背景の透明度は opacity 設定で上書きされるのでここでは色だけ
      textarea.style.background = "#192734";
      textarea.style.color = "#fff";
      count.style.color = "#fff";
    }
  }
})();
