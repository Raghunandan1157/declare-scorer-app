// --- Supabase Config ---
const SUPABASE_URL = "https://zovnmmdfthpbubrorsgh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvdm5tbWRmdGhwYnVicm9yc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzE3ODgsImV4cCI6MjA3NzE0Nzc4OH0.92BH2sjUOgkw6iSRj1_4gt0p3eThg3QT4VK-Q4EdmBE";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- State ---
let sessions = [];
let currentSessionId = null;
let view = "home";
let setupStep = 0;
let playerCount = "";
let playerNames = [];
let currentNameIdx = 0;
let nameInput = "";
let selectedPlayer = null;
let scoreInput = "";
let showWinConfirm = false;
let showWrongCall = false;

const app = document.getElementById("app");

// --- Player colors ---
const PLAYER_COLORS = [
  { bg: "#FEE2E2", accent: "#DC2626", text: "#991B1B" },
  { bg: "#DBEAFE", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#D1FAE5", accent: "#059669", text: "#064E3B" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#78350F" },
  { bg: "#EDE9FE", accent: "#7C3AED", text: "#4C1D95" },
  { bg: "#FCE7F3", accent: "#DB2777", text: "#831843" },
  { bg: "#CCFBF1", accent: "#0D9488", text: "#134E4A" },
  { bg: "#FFEDD5", accent: "#EA580C", text: "#7C2D12" },
];

function getColor(i) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }

// --- SVG Icons ---
const icons = {
  crown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M4 17l2-12 4 5 2-7 2 7 4-5 2 12"/></svg>`,
  plus: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  trophy: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 22V12M14 22V12M8 6h8a2 2 0 0 1 2 2v2a6 6 0 0 1-12 0V8a2 2 0 0 1 2-2z"/></svg>`,
  trophySm: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 22V12M14 22V12M8 6h8a2 2 0 0 1 2 2v2a6 6 0 0 1-12 0V8a2 2 0 0 1 2-2z"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  undo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  trophyLg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 22V12M14 22V12M8 6h8a2 2 0 0 1 2 2v2a6 6 0 0 1-12 0V8a2 2 0 0 1 2-2z"/></svg>`,
};

// --- Supabase helpers ---
async function loadSessions() {
  const { data, error } = await sb.from("declare_sessions").select("*").order("created_at", { ascending: false });
  if (error) { console.error("Load error:", error); return []; }
  return data.map(row => ({
    id: row.id,
    createdAt: row.created_at,
    players: row.players,
    rounds: row.rounds,
  }));
}

async function saveSession(session) {
  const { error } = await sb.from("declare_sessions").upsert({
    id: session.id,
    created_at: session.createdAt,
    players: session.players,
    rounds: session.rounds,
  });
  if (error) console.error("Save error:", error);
}

async function deleteSessionFromDB(id) {
  const { error } = await sb.from("declare_sessions").delete().eq("id", id);
  if (error) console.error("Delete error:", error);
}

// --- Helpers ---
function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || null;
}

function getSortedPlayers() {
  const session = getCurrentSession();
  if (!session) return [];
  return session.players
    .map((p, i) => ({ ...p, idx: i }))
    .sort((a, b) => a.total - b.total);
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// --- Render ---
function render() {
  if (view === "home") renderHome();
  else if (view === "setup") renderSetup();
  else if (view === "session") renderSession();
  else if (view === "player") renderPlayer();
}

// --- HOME ---
function renderHome() {
  let html = `
    <div class="header">
      <div class="header-left">
        <span class="logo">&spades;</span>
        <div>
          <h1 class="title">Declare</h1>
          <p class="subtitle">Card Game Scorer</p>
        </div>
      </div>
      <button class="fab-btn" id="newSessionBtn" title="New Session">${icons.plus}</button>
    </div>`;

  if (sessions.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon">&clubs;</div>
        <p class="empty-text">No sessions yet</p>
        <p class="empty-hint">Tap <b>+</b> to start a new game</p>
      </div>`;
  } else {
    html += `<div class="session-list">`;
    sessions.forEach(s => {
      const names = s.players.map(p => esc(p.name)).join(", ");
      const date = new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      html += `
        <div class="session-card" data-id="${s.id}">
          <div style="flex:1">
            <div class="session-players">${names}</div>
            <div class="session-meta">${s.players.length} players &middot; ${date}</div>
          </div>
          <button class="delete-btn" data-delete="${s.id}" title="Delete">${icons.trash}</button>
        </div>`;
    });
    html += `</div>`;
  }

  app.innerHTML = html;

  document.getElementById("newSessionBtn").onclick = () => {
    view = "setup"; setupStep = 0; playerCount = ""; playerNames = []; currentNameIdx = 0; nameInput = "";
    render();
  };

  document.querySelectorAll(".session-card").forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest("[data-delete]")) return;
      currentSessionId = card.dataset.id;
      view = "session";
      render();
    };
  });

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.delete;
      sessions = sessions.filter(s => s.id !== id);
      if (currentSessionId === id) { currentSessionId = null; view = "home"; }
      await deleteSessionFromDB(id);
      render();
    };
  });
}

// --- SETUP ---
function renderSetup() {
  if (setupStep === 0) {
    app.innerHTML = `
      <button class="back-btn" id="backBtn">${icons.back} <span>Back</span></button>
      <div class="setup-box">
        <div class="setup-emoji">&#128101;</div>
        <h2 class="setup-title">How many players?</h2>
        <input class="setup-input" id="countInput" type="number" min="2" max="8" placeholder="e.g. 4" value="${esc(playerCount)}" />
        <button class="primary-btn" id="continueBtn" ${(+playerCount >= 2 && +playerCount <= 8) ? "" : "disabled"}>Continue</button>
        <p class="hint">Between 2 and 8 players</p>
      </div>`;

    document.getElementById("backBtn").onclick = () => { view = "home"; render(); };
    const input = document.getElementById("countInput");
    input.focus();
    input.oninput = () => {
      playerCount = input.value;
      document.getElementById("continueBtn").disabled = !(+playerCount >= 2 && +playerCount <= 8);
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter" && +playerCount >= 2 && +playerCount <= 8) {
        setupStep = 1; playerNames = []; currentNameIdx = 0; nameInput = "";
        render();
      }
    };
    document.getElementById("continueBtn").onclick = () => {
      setupStep = 1; playerNames = []; currentNameIdx = 0; nameInput = "";
      render();
    };
  } else {
    const total = +playerCount;
    const color = getColor(currentNameIdx);
    let chipsHtml = "";
    if (playerNames.length > 0) {
      chipsHtml = `<div class="name-chips">${playerNames.map((n, i) => `<span class="chip" style="background:${getColor(i).bg};color:${getColor(i).text}">${esc(n)}</span>`).join("")}</div>`;
    }

    app.innerHTML = `
      <button class="back-btn" id="backBtn">${icons.back} <span>Back</span></button>
      <div class="setup-box">
        <div class="setup-badge" style="background:${color.bg};color:${color.text}">Player ${currentNameIdx + 1} of ${total}</div>
        <h2 class="setup-title">Enter player name</h2>
        <input class="setup-input" id="nameInput" type="text" placeholder="Player ${currentNameIdx + 1}" maxlength="16" value="${esc(nameInput)}" />
        <button class="primary-btn" id="nextBtn" ${nameInput.trim() ? "" : "disabled"}>${currentNameIdx + 1 === total ? "Start Game" : "Next"}</button>
        ${chipsHtml}
      </div>`;

    document.getElementById("backBtn").onclick = () => {
      if (currentNameIdx > 0) { currentNameIdx--; playerNames.pop(); nameInput = ""; }
      else setupStep = 0;
      render();
    };

    const input = document.getElementById("nameInput");
    input.focus();
    input.oninput = () => {
      nameInput = input.value;
      document.getElementById("nextBtn").disabled = !nameInput.trim();
    };

    const advanceName = async () => {
      if (!nameInput.trim()) return;
      playerNames.push(nameInput.trim());
      nameInput = "";
      if (playerNames.length === total) {
        await createSession(playerNames);
      } else {
        currentNameIdx++;
        render();
      }
    };

    input.onkeydown = (e) => { if (e.key === "Enter") advanceName(); };
    document.getElementById("nextBtn").onclick = advanceName;
  }
}

// --- Create session ---
async function createSession(names) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const session = {
    id,
    createdAt: new Date().toISOString(),
    players: names.map(n => ({ name: n, scores: [], total: 0, won: false })),
    rounds: 0,
  };
  sessions.unshift(session);
  currentSessionId = id;
  view = "session";
  await saveSession(session);
  render();
}

// --- SESSION ---
function renderSession() {
  const session = getCurrentSession();
  if (!session) { view = "home"; render(); return; }

  const sorted = getSortedPlayers();
  let html = `
    <div class="session-header">
      <button class="back-btn" id="backBtn">${icons.back} <span>Sessions</span></button>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="wrong-call-btn" id="wrongCallBtn">${icons.alert} Wrong Call</button>
        <div class="round-badge">Round ${session.rounds + 1}</div>
      </div>
    </div>`;

  html += `<div class="leaderboard">`;
  sorted.forEach((p, rank) => {
    const color = getColor(p.idx);
    const isLeader = rank === 0 && p.total < (sorted[sorted.length - 1]?.total ?? p.total);
    const rankHtml = isLeader ? icons.crown : `<span style="opacity:0.5;font-weight:700">#${rank + 1}</span>`;

    let scoreHistoryHtml = "";
    if (p.scores.length === 0) {
      scoreHistoryHtml = `<span style="opacity:0.4;font-size:12px">No scores yet</span>`;
    } else {
      scoreHistoryHtml = p.scores.map(s => {
        const bg = s < 0 ? "#D1FAE5" : s === 10 ? "#FEE2E2" : "rgba(0,0,0,0.06)";
        const clr = s < 0 ? "#059669" : s === 10 ? "#DC2626" : color.text;
        return `<span class="score-bubble" style="background:${bg};color:${clr}">${s < 0 ? s : "+" + s}</span>`;
      }).join("");
    }

    const wonHtml = p.won ? `<span class="won-badge">&#127942; Declared</span>` : "";
    const totalColor = p.total <= 0 ? "#059669" : color.text;

    html += `
      <div class="player-row" style="background:${color.bg};border-left:4px solid ${color.accent};animation-delay:${rank * 60}ms" data-player="${p.idx}">
        <div class="player-rank">${rankHtml}</div>
        <div style="flex:1">
          <div class="player-name" style="color:${color.text}">${esc(p.name)} ${wonHtml}</div>
          <div class="score-history">${scoreHistoryHtml}</div>
        </div>
        <div class="total-score" style="color:${totalColor}">${p.total}</div>
      </div>`;
  });
  html += `</div>`;
  html += `<p class="tap-hint">Tap a player to add score</p>`;

  // Wrong call overlay
  if (showWrongCall) {
    html += `<div class="overlay" id="wrongCallOverlay">
      <div class="overlay-card">
        <div class="overlay-icon">&#9888;&#65039;</div>
        <h3 class="overlay-title">Wrong Call</h3>
        <p class="overlay-subtext">Who made the false declare? They'll get <b>+10</b> penalty.</p>
        <div class="overlay-player-list">`;
    session.players.forEach((p, i) => {
      const c = getColor(i);
      html += `<button class="overlay-player-btn" style="background:${c.bg};border-color:${c.accent};color:${c.text}" data-wrong="${i}">
        <span>${esc(p.name)}</span><span class="overlay-penalty">+10</span>
      </button>`;
    });
    html += `</div>
        <button class="overlay-cancel-btn" id="cancelWrongBtn">Cancel</button>
      </div>
    </div>`;
  }

  app.innerHTML = html;

  document.getElementById("backBtn").onclick = () => { view = "home"; currentSessionId = null; render(); };
  document.getElementById("wrongCallBtn").onclick = () => { showWrongCall = true; render(); };

  if (showWrongCall) {
    document.getElementById("cancelWrongBtn").onclick = () => { showWrongCall = false; render(); };
    document.querySelectorAll("[data-wrong]").forEach(btn => {
      btn.onclick = async () => {
        const idx = +btn.dataset.wrong;
        session.players.forEach((p, i) => {
          p.scores.push(i === idx ? 10 : 0);
          p.total = p.scores.reduce((a, b) => a + b, 0);
        });
        session.rounds++;
        showWrongCall = false;
        await saveSession(session);
        render();
      };
    });
  }

  document.querySelectorAll("[data-player]").forEach(row => {
    row.onclick = () => {
      selectedPlayer = +row.dataset.player;
      view = "player"; scoreInput = ""; showWinConfirm = false;
      render();
    };
  });
}

// --- PLAYER ---
function renderPlayer() {
  const session = getCurrentSession();
  if (!session || selectedPlayer === null) { view = "session"; render(); return; }

  const p = session.players[selectedPlayer];
  const color = getColor(selectedPlayer);

  let historyHtml = "";
  if (p.scores.length > 0) {
    historyHtml = `<div class="history-row">${p.scores.map(s => {
      const bg = s < 0 ? "#D1FAE5" : "rgba(0,0,0,0.08)";
      const clr = s < 0 ? "#059669" : color.text;
      return `<span class="history-chip" style="background:${bg};color:${clr}">${s < 0 ? s : "+" + s}</span>`;
    }).join("")}</div>`;
  }

  const totalColor = p.total <= 0 ? "#059669" : color.text;

  let html = `
    <button class="back-btn" id="backBtn">${icons.back} <span>Scoreboard</span></button>
    <div class="player-card" style="background:${color.bg};border-color:${color.accent}">
      <h2 class="player-card-name" style="color:${color.text}">${esc(p.name)}</h2>
      <div class="player-card-total" style="color:${totalColor}">${p.total}</div>
      <div class="player-card-label">Total Score</div>
      ${historyHtml}
    </div>`;

  if (showWinConfirm) {
    html += `
      <div class="win-confirm-box">
        ${icons.trophyLg}
        <p class="win-text">Did <b>${esc(p.name)}</b> win this round?</p>
        <p class="win-subtext">This will add <b>&minus;5</b> to their score</p>
        <div class="win-actions">
          <button class="win-yes" id="winYesBtn">Yes, Declare!</button>
          <button class="win-no" id="winNoBtn">Cancel</button>
        </div>
      </div>`;
  } else {
    html += `
      <div class="score-section">
        <label class="score-label">Add Round Score</label>
        <div class="score-row">
          <input class="score-input" id="scoreInput" type="number" placeholder="Enter points" value="${esc(scoreInput)}" style="border-color:${color.accent}" />
          <button class="add-btn" id="addScoreBtn" style="background:${color.accent}" ${(scoreInput !== "" && !isNaN(+scoreInput)) ? "" : "disabled"}>Add</button>
        </div>
        <div class="action-row">
          <button class="declare-btn" id="declareBtn">${icons.trophySm} Declare Win (&minus;5)</button>
          ${p.scores.length > 0 ? `<button class="undo-btn" id="undoBtn">${icons.undo} Undo Last</button>` : ""}
        </div>
      </div>`;
  }

  app.innerHTML = html;

  document.getElementById("backBtn").onclick = () => { view = "session"; selectedPlayer = null; render(); };

  if (showWinConfirm) {
    document.getElementById("winYesBtn").onclick = async () => {
      p.scores.push(-5);
      p.total = p.scores.reduce((a, b) => a + b, 0);
      p.won = true;
      session.rounds++;
      showWinConfirm = false;
      view = "session"; selectedPlayer = null;
      await saveSession(session);
      render();
    };
    document.getElementById("winNoBtn").onclick = () => { showWinConfirm = false; render(); };
  } else {
    const input = document.getElementById("scoreInput");
    input.focus();
    input.oninput = () => {
      scoreInput = input.value;
      document.getElementById("addScoreBtn").disabled = scoreInput === "" || isNaN(+scoreInput);
    };

    const addScore = async () => {
      if (scoreInput === "" || isNaN(+scoreInput)) return;
      p.scores.push(+scoreInput);
      p.total = p.scores.reduce((a, b) => a + b, 0);
      scoreInput = "";
      view = "session"; selectedPlayer = null;
      await saveSession(session);
      render();
    };

    input.onkeydown = (e) => { if (e.key === "Enter") addScore(); };
    document.getElementById("addScoreBtn").onclick = addScore;
    document.getElementById("declareBtn").onclick = () => { showWinConfirm = true; render(); };

    const undoBtn = document.getElementById("undoBtn");
    if (undoBtn) {
      undoBtn.onclick = async () => {
        if (p.scores.length > 0) {
          p.scores.pop();
          p.total = p.scores.reduce((a, b) => a + b, 0);
          p.won = false;
          await saveSession(session);
          render();
        }
      };
    }
  }
}

// --- Init ---
async function init() {
  app.innerHTML = `<div class="loading">Loading...</div>`;
  sessions = await loadSessions();
  render();
}

init();
