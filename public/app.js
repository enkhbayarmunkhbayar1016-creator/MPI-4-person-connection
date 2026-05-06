/* ─── Particles ───────────────────────────────────────────────── */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = ['#00d4ff', '#a855f7', '#00ff88', '#ff8800'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[i % colors.length]};
      animation-duration:${10 + Math.random()*20}s;
      animation-delay:${Math.random()*15}s;
    `;
    container.appendChild(p);
  }
})();

/* ─── Tab ─────────────────────────────────────────────────────── */
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
}

/* ─── Socket connections ──────────────────────────────────────── */
const BASE = window.location.origin;

// client id -> socket
const sockets = {};
// client id -> which namespace
const clientNs = { 1: '/server-a', 2: '/server-a', 3: '/server-b', 4: '/server-b' };

// Admin socket for server control + stats
const adminSocket = io(BASE + '/admin');

adminSocket.on('stats', updateStats);
adminSocket.on('system-log', appendLog);

function updateStats(stats) {
  // Server A
  const aOnline = stats.serverA.online;
  const bOnline = stats.serverB.online;

  document.getElementById('count-a').textContent = stats.serverA.clientCount;
  document.getElementById('count-b').textContent = stats.serverB.clientCount;

  setServerUI('A', aOnline);
  setServerUI('B', bOnline);
}

function setServerUI(srv, online) {
  const ind = document.getElementById('ind-' + srv.toLowerCase());
  const card = document.getElementById('card-server-' + srv.toLowerCase());
  const btn = document.getElementById('btn-' + srv.toLowerCase());

  ind.className = 'server-indicator' + (online ? '' : ' offline');
  card.className = 'server-card' + (online ? '' : ' offline');

  if (online) {
    btn.className = 'toggle-btn btn-kill';
    btn.innerHTML = `<span>Kill Server ${srv}</span>`;
    btn.onclick = () => toggleServer(srv);
  } else {
    btn.className = 'toggle-btn btn-start';
    btn.innerHTML = `<span>Start Server ${srv}</span>`;
    btn.onclick = () => toggleServer(srv);
  }
}

function toggleServer(srv) {
  const card = document.getElementById('card-server-' + srv.toLowerCase());
  const isOnline = !card.classList.contains('offline');
  adminSocket.emit('toggle-server', { server: srv, online: !isOnline });

  if (isOnline) {
    // Kick clients off this server in the UI
    [1, 2, 3, 4].forEach(id => {
      const ns = clientNs[id];
      if ((srv === 'A' && ns === '/server-a') || (srv === 'B' && ns === '/server-b')) {
        if (sockets[id]) {
          addSysMsg(id, `⚠ Server ${srv} is down — disconnected`);
          disconnectClient(id);
          // Try reconnect to the other server
          const fallback = srv === 'A' ? '/server-b' : '/server-a';
          clientNs[id] = fallback;
          document.querySelector(`#panel-${id} .client-server`).textContent =
            `→ Server ${srv === 'A' ? 'B' : 'A'} (failover)`;
          setTimeout(() => connectClient(id), 600);
        }
      }
    });
  }
}

/* ─── Client connect / disconnect ─────────────────────────────── */
function toggleClient(id) {
  if (sockets[id]) {
    disconnectClient(id);
  } else {
    connectClient(id);
  }
}

function connectClient(id) {
  const ns = clientNs[id];
  const sock = io(BASE + ns, { query: { clientId: id }, reconnection: false });
  sockets[id] = sock;

  setClientStatus(id, 'connecting');

  sock.on('connect', () => {
    setClientStatus(id, 'online');
    addSysMsg(id, `Connected to ${ns === '/server-a' ? 'Server A' : 'Server B'}`);
    enableInput(id, true);
    document.getElementById('panel-' + id).classList.add('connected');
    const btn = document.getElementById('conn-btn-' + id);
    btn.textContent = 'Disconnect';
    btn.classList.add('connected');
  });

  sock.on('message', (msg) => receiveMsg(id, msg));

  sock.on('server-down', (data) => {
    addSysMsg(id, `⚠ Server down! Reconnecting to Server ${data.redirect}...`);
    const fallback = data.redirect === 'A' ? '/server-a' : '/server-b';
    clientNs[id] = fallback;
    document.querySelector(`#panel-${id} .client-server`).textContent =
      `→ Server ${data.redirect} (failover)`;
    disconnectClient(id);
    setTimeout(() => connectClient(id), 800);
  });

  sock.on('disconnect', () => {
    if (sockets[id]) {
      setClientStatus(id, 'offline');
      enableInput(id, false);
      document.getElementById('panel-' + id).classList.remove('connected');
      const btn = document.getElementById('conn-btn-' + id);
      btn.textContent = 'Connect';
      btn.classList.remove('connected');
      sockets[id] = null;
    }
  });

  sock.on('connect_error', () => {
    setClientStatus(id, 'offline');
    addSysMsg(id, 'Connection failed');
    sockets[id] = null;
  });
}

function disconnectClient(id) {
  if (sockets[id]) {
    sockets[id].disconnect();
    sockets[id] = null;
  }
  setClientStatus(id, 'offline');
  enableInput(id, false);
  document.getElementById('panel-' + id).classList.remove('connected');
  const btn = document.getElementById('conn-btn-' + id);
  btn.textContent = 'Connect';
  btn.classList.remove('connected');
}

function setClientStatus(id, state) {
  const el = document.getElementById('status-' + id);
  const dot = el.querySelector('.dot');
  const txt = el.querySelector('.status-text');
  dot.className = 'dot ' + (state === 'online' ? 'online' : state === 'connecting' ? 'reconnecting' : 'offline');
  txt.textContent = state === 'online' ? 'Connected' : state === 'connecting' ? 'Connecting...' : 'Disconnected';
}

function enableInput(id, on) {
  document.getElementById('input-' + id).disabled = !on;
  document.getElementById('send-' + id).disabled = !on;
}

/* ─── Messaging ───────────────────────────────────────────────── */
function sendMsg(id) {
  const input = document.getElementById('input-' + id);
  const text = input.value.trim();
  if (!text || !sockets[id]) return;
  sockets[id].emit('message', { text });
  input.value = '';
  input.focus();
  animateSVGLink();
}

function receiveMsg(clientId, msg) {
  const chat = document.getElementById('chat-' + clientId);
  const isOwn = String(msg.clientId) === String(clientId);
  const div = document.createElement('div');
  div.className = 'msg-bubble ' + (isOwn ? 'own' : 'other');
  const time = new Date(msg.time).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  div.innerHTML = `<div class="msg-meta">Client ${msg.clientId} · ${msg.fromServer} · ${time}</div>${escHtml(msg.text)}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addSysMsg(clientId, text) {
  const chat = document.getElementById('chat-' + clientId);
  const div = document.createElement('div');
  div.className = 'msg-bubble sys';
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ─── System Log ──────────────────────────────────────────────── */
function appendLog(entry) {
  const box = document.getElementById('system-log');
  const el = document.createElement('div');
  el.className = 'log-entry ' + (entry.type || '');
  const time = new Date(entry.time).toLocaleTimeString('mn-MN', { hour12: false });
  el.innerHTML = `<span class="log-time">[${time}]</span><span class="log-text">${escHtml(entry.text)}</span>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function clearLog() {
  document.getElementById('system-log').innerHTML = '';
}

/* ─── SVG Animation ───────────────────────────────────────────── */
function animateSVGLink() {
  const link = document.getElementById('ab-link');
  link.classList.add('active');
  setTimeout(() => link.classList.remove('active'), 1200);
}

/* ─── Part II — Heat Distribution Simulation ──────────────────── */
let heatChart = null;
let simData = null;

function runHeatSim() {
  const N = parseInt(document.getElementById('heat-n').value) || 4096;
  const iterations = parseInt(document.getElementById('heat-iter').value) || 1000;
  const C = parseFloat(document.getElementById('heat-c').value) || 0.25;
  const Tleft = parseFloat(document.getElementById('heat-tleft').value) || 100;

  document.getElementById('run-label').textContent = 'Simulating...';

  // Use 4 "MPI processes" simulated sequentially
  const numProcs = 4;
  const localN = Math.floor(N / numProcs);

  // Initialize temperature array
  let temp = new Float64Array(N).fill(0);
  temp[0] = Tleft; // Left boundary (Rank 0 left end)

  const startTime = performance.now();

  // Simulate MPI-style with 4 chunks
  function step() {
    const next = new Float64Array(N);
    next[0] = Tleft; // fixed boundary
    next[N - 1] = 0; // fixed boundary

    for (let i = 1; i < N - 1; i++) {
      next[i] = temp[i] + C * (temp[i - 1] - 2 * temp[i] + temp[i + 1]);
    }
    return next;
  }

  // Run in chunks using setTimeout to keep UI responsive
  let iter = 0;
  const BATCH = 50;

  function runBatch() {
    for (let b = 0; b < BATCH && iter < iterations; b++, iter++) {
      temp = step();
    }

    // Update proc progress bars
    const pct = (iter / iterations * 100).toFixed(0);
    for (let r = 0; r < 4; r++) {
      const prog = document.getElementById('prog-' + r);
      const offset = r * (iterations / 4);
      const localPct = Math.min(100, Math.max(0, (iter - offset) / (iterations / 4) * 100));
      prog.style.setProperty('--w', localPct + '%');
      prog.style.cssText = `--w:${localPct}%; `;
      prog.querySelector ? null : null;
      prog.style.setProperty('width', '0'); // trigger via after pseudo
      prog.setAttribute('data-pct', localPct);
      prog.style.cssText = ``;
      // Direct width on ::after not possible via JS, use a width span trick
      prog.innerHTML = `<span style="display:block;height:100%;width:${localPct.toFixed(0)}%;background:linear-gradient(90deg,#00d4ff,#a855f7);border-radius:3px;transition:width 0.1s"></span>`;
    }

    if (iter < iterations) {
      requestAnimationFrame(runBatch);
    } else {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      simData = temp;
      renderHeatResults(temp, N, elapsed, iterations, C, Tleft);
      document.getElementById('run-label').textContent = '▶ Simulate';
    }
  }

  requestAnimationFrame(runBatch);
}

function renderHeatResults(temp, N, elapsed, iterations, C, Tleft) {
  // Rod canvas heatmap
  const canvas = document.getElementById('rod-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * window.devicePixelRatio || 800;
  canvas.height = 60 * window.devicePixelRatio || 60;
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const w = canvas.offsetWidth || 800;
  const h = 60;
  const maxT = Math.max(...temp);

  for (let i = 0; i < N; i++) {
    const x = (i / N) * w;
    const bw = Math.max(1, w / N);
    const t = temp[i] / maxT;
    ctx.fillStyle = tempColor(t);
    ctx.fillRect(x, 0, bw + 1, h);
  }

  // Chart — downsample for display
  const step = Math.max(1, Math.floor(N / 512));
  const labels = [], data = [];
  for (let i = 0; i < N; i += step) {
    labels.push(i);
    data.push(temp[i].toFixed(4));
  }

  if (heatChart) heatChart.destroy();
  const chartCtx = document.getElementById('heat-chart').getContext('2d');
  heatChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature',
        data,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.08)',
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 600 },
      plugins: {
        legend: { labels: { color: '#e0e0ff', font: { size: 11 } } }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(200,200,255,0.5)', maxTicksLimit: 12, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: 'Position', color: 'rgba(200,200,255,0.6)', font: { size: 11 } }
        },
        y: {
          ticks: { color: 'rgba(200,200,255,0.5)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: 'Temperature', color: 'rgba(200,200,255,0.6)', font: { size: 11 } }
        }
      }
    }
  });

  // Stats
  const statsEl = document.getElementById('heat-stats');
  statsEl.innerHTML = `
    <div class="stat-box"><div class="stat-val">${elapsed}s</div><div class="stat-lbl">Simulation Time</div></div>
    <div class="stat-box"><div class="stat-val">${maxT.toFixed(1)}°</div><div class="stat-lbl">Max Temperature</div></div>
    <div class="stat-box"><div class="stat-val">${iterations}</div><div class="stat-lbl">Iterations</div></div>
    <div class="stat-box"><div class="stat-val">${C}</div><div class="stat-lbl">Coefficient C</div></div>
  `;
}

function tempColor(t) {
  // Blue → Cyan → Green → Yellow → Red
  if (t < 0.25) {
    const r = 0, g = Math.round(t * 4 * 212), b = 255;
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.5) {
    const f = (t - 0.25) * 4;
    const r = 0, g = 212 + Math.round(f * 43), b = Math.round(255 * (1 - f));
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.75) {
    const f = (t - 0.5) * 4;
    return `rgb(${Math.round(f*255)},255,0)`;
  } else {
    const f = (t - 0.75) * 4;
    return `rgb(255,${Math.round(255*(1-f))},0)`;
  }
}

function exportCSV() {
  if (!simData) { alert('Эхлээд симуляц ажиллуулна уу'); return; }
  let csv = 'position,temperature\n';
  for (let i = 0; i < simData.length; i++) {
    csv += `${i},${simData[i].toFixed(4)}\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'heat_output.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Auto-run heat sim on first load of Part 2
document.querySelector('.tab-btn:nth-child(2)').addEventListener('click', () => {
  if (!simData) setTimeout(runHeatSim, 300);
});
