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

/* ─── Theme ───────────────────────────────────────────────────── */
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = isLight ? '☀️' : '🌙';
  });
}

document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
  btn.textContent = localStorage.getItem('theme') === 'light' ? '☀️' : '🌙';
});

/* ─── Tab ─────────────────────────────────────────────────────── */
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
}

/* ─── Auth tab switch ─────────────────────────────────────────── */
function switchAuthTab(tab) {
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'flex' : 'none';
  document.getElementById('tab-login-btn').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register-btn').classList.toggle('active', tab === 'register');
}

function onLoginRoleChange(role) {
  const passEl = document.getElementById('login-pass');
  if (role === 'client') {
    passEl.style.display = 'none';
    passEl.value = '';
  } else {
    passEl.style.display = '';
  }
}

function onRoleChange(role) {
  const passEl = document.getElementById('reg-pass');
  if (role === 'client') {
    passEl.style.display = 'none';
    passEl.value = '';
  } else {
    passEl.style.display = '';
  }
}

/* ─── Admin auth ──────────────────────────────────────────────── */
let adminToken = localStorage.getItem('adminToken') || '';
let adminUser  = localStorage.getItem('adminUser')  || '';

async function apiFetch(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const role     = document.getElementById('login-role') ? document.getElementById('login-role').value : 'admin';
  const errEl    = document.getElementById('login-error');
  if (!username) { errEl.textContent = 'Нэрээ оруулна уу'; return; }
  if (role === 'admin' && !password) { errEl.textContent = 'Нууц үг оруулна уу'; return; }
  errEl.textContent = '';

  const data = await apiFetch('POST', '/api/login', { username, password });
  if (data.role === 'admin' && data.token) {
    adminToken = data.token;
    adminUser  = data.username;
    localStorage.setItem('adminToken', adminToken);
    localStorage.setItem('adminUser',  adminUser);
    showDashboard();
  } else if (data.role === 'client') {
    window.location.href = `/client.html?id=${data.clientId}&name=${encodeURIComponent(data.username)}`;
  } else {
    errEl.textContent = data.error || 'Нэвтрэх амжилтгүй';
  }
}

async function doLogout() {
  await apiFetch('POST', '/api/logout');
  adminToken = ''; adminUser = '';
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  document.getElementById('dashboard').style.display    = 'none';
  document.getElementById('admin-login-overlay').style.display = 'flex';
}

function showDashboard() {
  document.getElementById('admin-login-overlay').style.display = 'none';
  document.getElementById('dashboard').style.display    = 'block';
  document.getElementById('logged-as').textContent = `👤 ${adminUser}`;
  connectAdminSocket();
  loadAdminList();
}

// Try token from storage on load
window.addEventListener('load', async () => {
  if (adminToken) {
    const data = await apiFetch('GET', '/api/admins');
    if (data.error) {
      adminToken = ''; adminUser = '';
      localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser');
    } else {
      showDashboard();
      return;
    }
  }
  document.getElementById('admin-login-overlay').style.display = 'flex';
});

document.getElementById('login-btn').onclick  = doLogin;
document.getElementById('logout-btn').onclick = doLogout;
document.getElementById('login-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };

/* ─── Register ────────────────────────────────────────────────── */
async function doRegister() {
  const username = document.getElementById('reg-user').value.trim();
  const password = document.getElementById('reg-pass').value;
  const role     = document.getElementById('reg-role').value;
  const errEl    = document.getElementById('reg-error');
  if (!username) { errEl.textContent = 'Нэрээ оруулна уу'; return; }
  if (role === 'admin' && !password) { errEl.textContent = 'Нууц үг оруулна уу'; return; }
  errEl.textContent = '';

  const data = await apiFetch('POST', '/api/register', { username, password, role });
  if (data.ok) {
    errEl.style.color = '#00ff88';
    errEl.textContent = 'Амжилттай бүртгэгдлээ! Нэвтэрнэ үү.';
    document.getElementById('reg-user').value = '';
    document.getElementById('reg-pass').value = '';
    setTimeout(() => {
      switchAuthTab('login');
      errEl.textContent = ''; errEl.style.color = '';
      document.getElementById('login-user').value = username;
      document.getElementById('login-pass').focus();
    }, 1500);
  } else {
    errEl.textContent = data.error || 'Бүртгэл амжилтгүй';
  }
}

document.getElementById('reg-btn').onclick = doRegister;
document.getElementById('reg-pass').onkeydown = e => { if (e.key === 'Enter') doRegister(); };

/* ─── Admin management ────────────────────────────────────────── */
let adminMgmtOpen = false;

function toggleAdminMgmt() {
  adminMgmtOpen = !adminMgmtOpen;
  document.getElementById('admin-mgmt-body').style.display  = adminMgmtOpen ? 'block' : 'none';
  document.getElementById('admin-mgmt-arrow').textContent   = adminMgmtOpen ? '▴' : '▾';
}

async function loadAdminList() {
  const list = await apiFetch('GET', '/api/admins');
  if (!Array.isArray(list)) return;
  const el = document.getElementById('admin-list');
  el.innerHTML = list.map(u => `
    <div class="admin-list-row">
      <span class="admin-list-name">${escHtml(u)}</span>
      ${u === adminUser ? '<span class="admin-you-tag">you</span>' :
        `<button class="kick-btn" onclick="deleteAdmin('${escHtml(u)}')">✕ Устгах</button>`}
    </div>`).join('');
}

async function addAdmin() {
  const username = document.getElementById('new-admin-user').value.trim();
  const password = document.getElementById('new-admin-pass').value;
  const errEl    = document.getElementById('admin-mgmt-error');
  if (!username || !password) { errEl.textContent = 'Мэдээлэл дутуу'; return; }
  const res = await apiFetch('POST', '/api/admins', { username, password });
  if (res.ok) {
    document.getElementById('new-admin-user').value = '';
    document.getElementById('new-admin-pass').value = '';
    errEl.textContent = '';
    loadAdminList();
  } else {
    errEl.textContent = res.error || 'Алдаа гарлаа';
  }
}

async function deleteAdmin(username) {
  if (!confirm(`"${username}" admin-ийг устгах уу?`)) return;
  const res = await apiFetch('DELETE', `/api/admins/${encodeURIComponent(username)}`);
  if (res.ok) loadAdminList();
  else alert(res.error || 'Алдаа гарлаа');
}

/* ─── Admin socket ────────────────────────────────────────────── */
let adminSocket = null;
let currentRoomCode = '';

function connectAdminSocket() {
  if (adminSocket) return;
  adminSocket = io(window.location.origin + '/admin');

  adminSocket.on('stats',      updateStats);
  adminSocket.on('system-log', appendLog);
  adminSocket.on('room-code',  code => {
    currentRoomCode = code;
    document.getElementById('room-code-display').textContent = code;
  });
  adminSocket.on('message', () => {
    const link = document.getElementById('ab-link');
    link.classList.add('active');
    setTimeout(() => link.classList.remove('active'), 1200);
  });
}

function updateStats(stats) {
  document.getElementById('count-a').textContent = stats.serverA.clientCount;
  document.getElementById('count-b').textContent = stats.serverB.clientCount;
  setServerUI('A', stats.serverA.online);
  setServerUI('B', stats.serverB.online);
  renderClientList('a', stats.serverA.clients, 'A');
  renderClientList('b', stats.serverB.clients, 'B');
}

function renderClientList(suffix, clients, srv) {
  const el = document.getElementById('clients-' + suffix);
  if (!clients || clients.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = clients.map(c => `
    <div class="connected-client-row">
      <span class="client-badge c${c.clientId}" style="width:22px;height:22px;font-size:9px">C${c.clientId}</span>
      <span class="connected-client-name">${escHtml(c.name)}</span>
      <button class="kick-btn" onclick="kickClient('${c.sid}','${srv}')">Kick</button>
    </div>`).join('');
}

function kickClient(sid, srv) {
  if (adminSocket) adminSocket.emit('kick-client', { sid, srv });
}

function setServerUI(srv, online) {
  const ind  = document.getElementById('ind-'  + srv.toLowerCase());
  const card = document.getElementById('card-server-' + srv.toLowerCase());
  const btn  = document.getElementById('btn-'  + srv.toLowerCase());
  ind.className  = 'server-indicator' + (online ? '' : ' offline');
  card.className = 'server-card'      + (online ? '' : ' offline');
  btn.className  = online ? 'toggle-btn btn-kill' : 'toggle-btn btn-start';
  btn.innerHTML  = `<span>${online ? 'Kill' : 'Start'} Server ${srv}</span>`;
}

function toggleServer(srv) {
  const isOnline = !document.getElementById('card-server-' + srv.toLowerCase()).classList.contains('offline');
  if (adminSocket) adminSocket.emit('toggle-server', { server: srv, online: !isOnline });
}

function resetCode() {
  if (adminSocket) adminSocket.emit('reset-code');
}

function openClient(id) {
  const code = currentRoomCode || document.getElementById('room-code-display').textContent;
  const codeParam = (code && code !== '----') ? `&code=${encodeURIComponent(code)}` : '';
  window.open(`/client.html?id=${id}${codeParam}`, `client-${id}`);
}

/* ─── System Log ──────────────────────────────────────────────── */
function appendLog(entry) {
  const box = document.getElementById('system-log');
  const el  = document.createElement('div');
  el.className = 'log-entry ' + (entry.type || '');
  const time = new Date(entry.time).toLocaleTimeString('mn-MN', { hour12: false });
  el.innerHTML = `<span class="log-time">[${time}]</span><span class="log-text">${escHtml(entry.text)}</span>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function clearLog() { document.getElementById('system-log').innerHTML = ''; }

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ─── Part II — Heat Simulation ──────────────────────────────── */
let heatChart = null, simData = null;

function runHeatSim() {
  const N     = parseInt(document.getElementById('heat-n').value)      || 4096;
  const iters = parseInt(document.getElementById('heat-iter').value)   || 1000;
  const C     = parseFloat(document.getElementById('heat-c').value)    || 0.25;
  const Tl    = parseFloat(document.getElementById('heat-tleft').value) || 100;
  document.getElementById('run-label').textContent = 'Simulating...';

  const P = 4, lN = Math.floor(N / P);
  let procs = Array.from({ length: P }, () => new Float64Array(lN).fill(0));
  procs[0][0] = Tl;
  const t0 = performance.now();
  let iter = 0;

  function step() {
    const lG = new Float64Array(P), rG = new Float64Array(P);
    for (let r = 0; r < P; r++) {
      lG[r] = r > 0     ? procs[r-1][lN-1] : Tl;
      rG[r] = r < P - 1 ? procs[r+1][0]    : 0;
    }
    const nx = procs.map(p => new Float64Array(p));
    for (let r = 0; r < P; r++) for (let i = 0; i < lN; i++) {
      if (r === 0 && i === 0)      { nx[r][i] = Tl; continue; }
      if (r === P-1 && i === lN-1) { nx[r][i] = 0;  continue; }
      const l = i === 0    ? lG[r] : procs[r][i-1];
      const x = i === lN-1 ? rG[r] : procs[r][i+1];
      nx[r][i] = procs[r][i] + C * (l - 2 * procs[r][i] + x);
    }
    procs = nx;
  }

  function batch() {
    for (let b = 0; b < 50 && iter < iters; b++, iter++) step();
    for (let r = 0; r < P; r++) {
      const pct = Math.min(100, iter / iters * 100).toFixed(0);
      document.getElementById('prog-' + r).innerHTML =
        `<span style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#00d4ff,#a855f7);border-radius:3px;transition:width 0.1s"></span>`;
    }
    if (iter < iters) { requestAnimationFrame(batch); return; }

    const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
    const full = new Float64Array(N);
    for (let r = 0; r < P; r++) full.set(procs[r], r * lN);
    simData = full;
    renderHeat(full, N, elapsed, iters, C, Tl);
    document.getElementById('run-label').textContent = '▶ Simulate';
  }
  requestAnimationFrame(batch);
}

function renderHeat(temp, N, elapsed, iters, C, Tl) {
  const canvas = document.getElementById('rod-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * devicePixelRatio || 800;
  canvas.height = 60 * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.offsetWidth || 800, maxT = Math.max(...temp);
  for (let i = 0; i < N; i++) {
    ctx.fillStyle = tempColor(temp[i] / maxT);
    ctx.fillRect((i/N)*w, 0, Math.max(1, w/N)+1, 60);
  }
  const step = Math.max(1, Math.floor(N/512)), labels = [], data = [];
  for (let i = 0; i < N; i += step) { labels.push(i); data.push(temp[i].toFixed(4)); }
  if (heatChart) heatChart.destroy();
  heatChart = new Chart(document.getElementById('heat-chart').getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Temperature', data, borderColor: '#00d4ff',
      backgroundColor: 'rgba(0,212,255,0.08)', pointRadius: 0, borderWidth: 2, fill: true, tension: 0.3 }] },
    options: { responsive: true, animation: { duration: 600 },
      plugins: { legend: { labels: { color: '#e0e0ff', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: 'rgba(200,200,255,0.5)', maxTicksLimit: 12, font: { size: 10 } },
             grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Position', color: 'rgba(200,200,255,0.6)', font: { size: 11 } } },
        y: { ticks: { color: 'rgba(200,200,255,0.5)', font: { size: 10 } },
             grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Temperature', color: 'rgba(200,200,255,0.6)', font: { size: 11 } } }
      }
    }
  });
  document.getElementById('heat-stats').innerHTML = `
    <div class="stat-box"><div class="stat-val">${elapsed}s</div><div class="stat-lbl">Simulation Time</div></div>
    <div class="stat-box"><div class="stat-val">${maxT.toFixed(1)}°</div><div class="stat-lbl">Max Temperature</div></div>
    <div class="stat-box"><div class="stat-val">${iters}</div><div class="stat-lbl">Iterations</div></div>
    <div class="stat-box"><div class="stat-val">${C}</div><div class="stat-lbl">Coefficient C</div></div>`;
}

function tempColor(t) {
  if (t < 0.25) return `rgb(0,${Math.round(t*4*212)},255)`;
  if (t < 0.5)  { const f=(t-0.25)*4; return `rgb(0,${212+Math.round(f*43)},${Math.round(255*(1-f))})`; }
  if (t < 0.75) return `rgb(${Math.round((t-0.5)*4*255)},255,0)`;
  return `rgb(255,${Math.round(255*(1-(t-0.75)*4))},0)`;
}

function exportCSV() {
  if (!simData) { alert('Эхлээд симуляц ажиллуулна уу'); return; }
  let csv = 'position,temperature\n';
  for (let i = 0; i < simData.length; i++) csv += `${i},${simData[i].toFixed(4)}\n`;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'heat_output.csv'
  });
  a.click();
}

document.querySelector('.tab-btn:nth-child(2)').addEventListener('click', () => {
  if (!simData) setTimeout(runHeatSim, 300);
});
