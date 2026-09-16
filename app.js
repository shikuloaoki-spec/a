const KEY = "nl_simulator_events_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const data = load();
  data[el.dataset.action] = true;
  data.lastActionAt = new Date().toISOString();
  save(data);
});

/* ---- ①読み込み→カクつき ---- */
const player = document.querySelector("#player");
const overlay = document.querySelector("#alertOverlay");
const mainCard = document.querySelector("#mainCard");

if (player) {
  const badge = document.querySelector("#playerBadge");
  const stutterMsgs = ["読み込み中…", "バッファリング中…", "接続が不安定です…", "再試行しています…"];
  let i = 0;
  player.classList.add("stutter");

  const stutterInterval = setInterval(() => {
    i = (i + 1) % stutterMsgs.length;
    badge.textContent = stutterMsgs[i];
    player.classList.remove("jump");
    void player.offsetWidth;
    player.classList.add("jump");
  }, 480);

  setTimeout(() => {
    clearInterval(stutterInterval);
    player.classList.remove("stutter");
    showAlertOverlay();
  }, 2200);
}

/* ---- ②セキュリティ警告テイクオーバー ---- */
function showAlertOverlay() {
  if (!overlay) return finishToError();
  overlay.classList.add("show");
  document.body.classList.add("shake");

  const bar = document.querySelector("#alertBar");
  const sub = document.querySelector("#alertSub");
  const title = document.querySelector("#alertTitle");
  const body = document.querySelector("#alertBody");

  let pct = 0;
  const steps = [
    { at: 0,  title: "不審な動作を検出しました", body: "このページで異常なスクリプトの実行が検出されました。安全のため接続を確認しています…" },
    { at: 40, title: "接続を分析しています", body: "外部サーバーとの不審な通信パターンが見つかりました。" },
    { at: 75, title: "リスクレベル: 高", body: "このまま操作を続けると、デバイスに影響が及ぶ可能性があります。" },
  ];
  let stepIdx = 0;

  const barInterval = setInterval(() => {
    pct += Math.floor(Math.random() * 9) + 4;
    if (pct > 100) pct = 100;
    bar.style.width = pct + "%";
    sub.textContent = `スキャン中: ${pct}%`;

    if (stepIdx < steps.length - 1 && pct >= steps[stepIdx + 1].at) {
      stepIdx++;
      title.textContent = steps[stepIdx].title;
      body.textContent = steps[stepIdx].body;
    }

    if (pct >= 100) {
      clearInterval(barInterval);
      sub.textContent = "スキャン完了";
      setTimeout(() => {
        overlay.classList.remove("show");
        document.body.classList.remove("shake");
        finishToError();
      }, 900);
    }
  }, 260);
}

/* ---- ③エラー画面＋ダウンロード誘導 ---- */
function finishToError() {
  const badge = document.querySelector("#playerBadge");
  const title = document.querySelector("#mainTitle");
  const text = document.querySelector("#mainText");
  const dlBtn = document.querySelector("#dlBtn");
  const countdown = document.querySelector("#countdownText");
  if (!title) return;

  player.classList.add("frozen");
  badge.textContent = "エラー";
  title.textContent = "動画が正しく再生されません";
  text.innerHTML = 'お使いのブラウザでは再生に必要なコーデックが不足しています。<strong>下の高画質版をダウンロード</strong>して視聴してください。';
  dlBtn.style.display = "block";
  countdown.style.display = "block";
  mainCard.classList.add("pulse-danger");
}

/* ---- ④一定時間後に突然出現するスケアウェア風ポップアップ ---- */
const scareOverlay = document.querySelector("#scareOverlay");
if (scareOverlay) {
  // ページ滞在から20〜35秒後のランダムなタイミングで、脈絡なく出現させる
  const delay = 20000 + Math.random() * 15000;
  setTimeout(() => {
    scareOverlay.classList.add("show");
    document.body.classList.add("shake");
    const data = load();
    data.scare_shown = true;
    save(data);
  }, delay);

  const installBtn = document.querySelector("#scareInstallBtn");
  const dismissBtn = document.querySelector("#scareDismissBtn");

  // 「今すぐ駆除する」を押しても実際には何も起きず、種明かしへ
  if (installBtn) installBtn.addEventListener("click", () => {
    const data = load();
    data.scare_install_clicked = true;
    save(data);
    location.href = "result.html";
  });

  // 「閉じる」を押した場合はポップアップを消すだけ
  if (dismissBtn) dismissBtn.addEventListener("click", () => {
    scareOverlay.classList.remove("show");
    document.body.classList.remove("shake");
    const data = load();
    data.scare_dismissed = true;
    save(data);
  });
}

const timerEl = document.querySelector("#timer");
if (timerEl) {
  let sec = 299;
  const tick = () => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
    if (sec > 0) sec--;
  };
  tick();
  setInterval(tick, 1000);
}

const result = document.querySelector("#result");
if (result) {
  const d = load();
  const rows = [
    ["ダウンロードを押した", !!d.file_download],
    ["「今すぐ駆除する」を押した", !!d.scare_install_clicked]
  ];
  result.innerHTML = rows.map(([label, yes]) =>
    `<div class="result-row"><span>${label}</span><span class="${yes ? "attention":"ok"}">${yes ? "実行した" : "実行していない"}</span></div>`
  ).join("");
}

const reset = document.querySelector("#reset");
if (reset) reset.addEventListener("click", () => {
  localStorage.removeItem(KEY);
  location.href = "index.html";
});
