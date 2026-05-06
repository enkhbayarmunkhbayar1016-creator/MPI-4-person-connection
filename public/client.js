/* ─── Particles ───────────────────────────────────────────────── */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = ['#00d4ff', '#a855f7', '#00ff88', '#ff8800'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;` +
      `background:${colors[i%colors.length]};animation-duration:${10+Math.random()*20}s;` +
      `animation-delay:${Math.random()*15}s;`;
    container.appendChild(p);
  }
})();

/* ─── Client config from URL ──────────────────────────────────── */
const params    = new URLSearchParams(location.search);
const clientId  = parseInt(params.get('id')) || 1;
const urlName   = params.get('name') || '';

const ORIGINAL_SRV = { 1: 'A', 2: 'A', 3: 'B', 4: 'B' };
const SRV_PORT     = { A: 3001, B: 3002 };
const SERVER_URLS  = {
  A: `${location.origin}/server-a`,
  B: `${location.origin}/server-b`
};
const CLIENT_GIFS  = {
  1: 'https://tenor.com/embed/7908236508981105506',
  2: 'https://tenor.com/embed/8640564821222907754',
  3: 'https://tenor.com/embed/13942174665313107907',
  4: 'https://tenor.com/embed/13097109864427045880'
};

let currentSrv = params.get('srv') || ORIGINAL_SRV[clientId];
let userName   = '';
let sock       = null;
const SESS_KEY = `client_${clientId}_join`;

/* ─── Static UI setup ─────────────────────────────────────────── */
document.title = `Client ${clientId} — Lab4`;
const origSrv  = ORIGINAL_SRV[clientId];

document.getElementById('join-badge').textContent  = `C${clientId}`;
document.getElementById('join-badge').className    = `client-badge c${clientId}`;
document.getElementById('join-title').textContent  = `Client ${clientId}`;
document.getElementById('join-sub').textContent    = `→ Server ${origSrv} · :${SRV_PORT[origSrv]}`;

document.getElementById('client-badge').textContent = `C${clientId}`;
document.getElementById('client-badge').className   = `client-badge c${clientId}`;
document.getElementById('client-title').textContent = `Client ${clientId}`;

/* ─── Helpers ─────────────────────────────────────────────────── */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function onServerChange(srv) {
  currentSrv = srv;
  document.getElementById('join-sub').textContent = `→ Server ${srv} · :${SRV_PORT[srv]}`;
}

function switchServer(newSrv) {
  if (newSrv === currentSrv && sock) return;
  const saved = JSON.parse(sessionStorage.getItem(SESS_KEY) || '{}');
  disconnect(false);
  currentSrv = newSrv;
  saved.srv  = newSrv;
  sessionStorage.setItem(SESS_KEY, JSON.stringify(saved));
  addSys(`Сервер солиж байна → Server ${newSrv}...`);
  setTimeout(() => connect(), 400);
}

function updateSrvLabel() {
  const isFailover = currentSrv !== ORIGINAL_SRV[clientId];
  document.getElementById('srv-label').textContent =
    isFailover ? `→ Server ${currentSrv} (failover)` : `→ Server ${currentSrv}`;
}

function setStatus(s) {
  const el  = document.getElementById('status');
  el.querySelector('.dot').className        = 'dot ' + (s === 'online' ? 'online' : s === 'connecting' ? 'reconnecting' : 'offline');
  el.querySelector('.status-text').textContent = s === 'online' ? 'Connected' : s === 'connecting' ? 'Connecting...' : 'Disconnected';
}

function addSys(text) {
  appendChat('msg-bubble sys', null, text);
}

function addGif() {
  const div = document.createElement('div');
  div.className = 'msg-bubble gif-msg';
  div.innerHTML = `<iframe src="${CLIENT_GIFS[clientId]}" frameborder="0" allowfullscreen></iframe>`;
  appendRaw(div);
}

function appendChat(cls, msg, text) {
  const div = document.createElement('div');
  div.className = cls;
  if (msg) {
    const isOwn = String(msg.clientId) === String(clientId);
    div.className = 'msg-bubble ' + (isOwn ? 'own' : 'other');
    const time = new Date(msg.time).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    div.innerHTML = `<div class="msg-meta">${escHtml(msg.name || `Client ${msg.clientId}`)} · Server ${msg.fromServer} · ${time}</div>${escHtml(msg.text)}`;
  } else {
    div.textContent = text;
  }
  appendRaw(div);
}

function appendRaw(el) {
  const chat = document.getElementById('chat');
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function enableInput(on) {
  document.getElementById('input').disabled    = !on;
  document.getElementById('send-btn').disabled = !on;
}

/* ─── Join flow ───────────────────────────────────────────────── */
function handleJoin() {
  const name = document.getElementById('join-name').value.trim();
  const srv  = document.getElementById('join-server').value;
  const err  = document.getElementById('join-error');

  if (!name) { err.textContent = 'Нэрээ оруулна уу'; return; }
  err.textContent = '';
  userName   = name;
  currentSrv = srv;

  sessionStorage.setItem(SESS_KEY, JSON.stringify({ name, srv: currentSrv }));
  showChat();
  connect();
}

function showChat() {
  document.getElementById('join-overlay').style.display = 'none';
  document.getElementById('client-main').style.display  = 'flex';
  document.getElementById('username-tag').textContent    = userName;
  updateSrvLabel();
}

function showJoin(errorMsg) {
  document.getElementById('client-main').style.display  = 'none';
  document.getElementById('join-overlay').style.display = 'flex';
  if (errorMsg) document.getElementById('join-error').textContent = errorMsg;
}

/* ─── Socket connection ───────────────────────────────────────── */
function connect() {
  updateSrvLabel();
  setStatus('connecting');

  sock = io(SERVER_URLS[currentSrv], {
    query: { clientId, name: userName },
    reconnection: false
  });

  sock.on('connect', () => {
    const saved = JSON.parse(sessionStorage.getItem(SESS_KEY) || '{}');
    saved.srv = currentSrv;
    sessionStorage.setItem(SESS_KEY, JSON.stringify(saved));

    document.getElementById('topbar-server').value = currentSrv;
    setStatus('online');
    addSys(`Connected to Server ${currentSrv}`);
    addGif();
    enableInput(true);
    document.getElementById('conn-btn').textContent = 'Disconnect';
    document.getElementById('conn-btn').classList.add('connected');
  });

  sock.on('auth-error', msg => {
    sessionStorage.removeItem(SESS_KEY);
    sock = null;
    showJoin(msg || 'Буруу код');
  });

  sock.on('kicked', msg => {
    sessionStorage.removeItem(SESS_KEY);
    addSys(`⚠ ${msg}`);
    disconnect(false);
    setTimeout(() => showJoin('Admin танд холболт цуцаллаа'), 1000);
  });

  sock.on('message', msg => appendChat(null, msg));

  sock.on('server-down', data => {
    addSys(`⚠ Server down! Reconnecting to Server ${data.redirect}...`);
    currentSrv = data.redirect;
    disconnect(false);
    setTimeout(() => connect(), 800);
  });

  sock.on('disconnect', () => {
    if (sock) {
      setStatus('offline');
      enableInput(false);
      document.getElementById('conn-btn').textContent = 'Connect';
      document.getElementById('conn-btn').classList.remove('connected');
      sock = null;
    }
  });

  sock.on('connect_error', err => {
    setStatus('offline');
    addSys(`Connection failed: ${err && err.message ? err.message : 'server unavailable'}`);
    showJoin('Холболт амжилтгүй боллоо. Сервер ажиллаж байгаа эсэхийг шалгана уу.');
    sock = null;
  });
}

function disconnect(clearSess = true) {
  if (clearSess) sessionStorage.removeItem(SESS_KEY);
  if (sock) { sock.disconnect(); sock = null; }
  setStatus('offline');
  enableInput(false);
  document.getElementById('conn-btn').textContent = 'Connect';
  document.getElementById('conn-btn').classList.remove('connected');
}

function toggleConnect() {
  if (sock) {
    disconnect();
  } else {
    const saved = JSON.parse(sessionStorage.getItem(SESS_KEY) || 'null');
    if (saved && saved.name) connect();
    else showJoin();
  }
}

function sendMsg() {
  const input = document.getElementById('input');
  const text  = input.value.trim();
  if (!text || !sock) return;
  sock.emit('message', { text });
  input.value = '';
  input.focus();
}

/* ─── Event listeners ─────────────────────────────────────────── */
document.getElementById('join-btn').onclick    = handleJoin;
document.getElementById('join-name').onkeydown = e => { if (e.key === 'Enter') handleJoin(); };
document.getElementById('conn-btn').onclick    = toggleConnect;
document.getElementById('send-btn').onclick    = sendMsg;
document.getElementById('input').onkeydown     = e => { if (e.key === 'Enter') sendMsg(); };

/* ─── Pre-fill name/server from URL ───────────────────────────── */
if (urlName) document.getElementById('join-name').value = urlName;
document.getElementById('join-server').value = currentSrv;
document.getElementById('join-sub').textContent = `→ Server ${currentSrv} · :${SRV_PORT[currentSrv]}`;

/* ─── Auto-reconnect on refresh (sessionStorage is per-tab) ───── */
const savedJoin = JSON.parse(sessionStorage.getItem(SESS_KEY) || 'null');
if (savedJoin && savedJoin.name) {
  userName   = savedJoin.name;
  currentSrv = savedJoin.srv || ORIGINAL_SRV[clientId];
  document.getElementById('join-name').value = userName;
  showChat();
  connect();
} else {
  document.getElementById('join-overlay').style.display = 'flex';
}
