const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const WEB_PORT = process.env.PORT || 3000;

/* ── Web server ─────────────────────────────────────────────────── */
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
const webHttp = http.createServer(app);
const webIo   = new Server(webHttp, { cors: { origin: '*', methods: ['GET', 'POST'] } });

/* ── Admin auth ─────────────────────────────────────────────────── */
const admins  = new Map([['admin', 'admin123']]);
const sessions = new Map();
const clients  = new Map();
let   nextClientId = 1;

function mkToken() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function requireAuth(req, res, next) {
  const tok = req.headers['x-admin-token'];
  if (!tok || !sessions.has(tok)) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  req.adminUser = sessions.get(tok);
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (admins.get(username) === password) {
    const token = mkToken();
    sessions.set(token, username);
    res.json({ token, username, role: 'admin' });
  } else if (clients.has(username)) {
    const { id } = clients.get(username);
    res.json({ role: 'client', username, clientId: id });
  } else {
    res.status(401).json({ error: 'Буруу нэвтрэх мэдээлэл' });
  }
});

app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Нэр оруулна уу' });
  if (role === 'admin') {
    if (!password) return res.status(400).json({ error: 'Нууц үг оруулна уу' });
    if (admins.has(username)) return res.status(400).json({ error: 'Энэ нэр аль хэдийн байна' });
    admins.set(username, password);
    pushLog({ text: `Admin "${username}" бүртгүүллээ`, type: 'online', time: Date.now() });
  } else {
    if (clients.has(username)) return res.status(400).json({ error: 'Энэ нэр аль хэдийн байна' });
    const id = nextClientId;
    nextClientId = (nextClientId % 4) + 1;
    clients.set(username, { id });
  }
  res.json({ ok: true, role: role || 'client' });
});

app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers['x-admin-token']);
  res.json({ ok: true });
});

app.get('/api/admins', requireAuth, (req, res) => {
  res.json([...admins.keys()]);
});

app.post('/api/admins', requireAuth, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Мэдээлэл дутуу' });
  if (admins.has(username)) return res.status(400).json({ error: 'Энэ нэр аль хэдийн байна' });
  admins.set(username, password);
  pushLog({ text: `Admin "${username}" нэмэгдлээ (by ${req.adminUser})`, type: 'online', time: Date.now() });
  res.json({ ok: true });
});

app.delete('/api/admins/:username', requireAuth, (req, res) => {
  const { username } = req.params;
  if (username === req.adminUser) return res.status(400).json({ error: 'Өөрийгөө устгах боломжгүй' });
  if (!admins.has(username)) return res.status(404).json({ error: 'Олдсонгүй' });
  admins.delete(username);
  for (const [tok, user] of sessions) if (user === username) sessions.delete(tok);
  pushLog({ text: `Admin "${username}" устгагдлаа (by ${req.adminUser})`, type: 'offline', time: Date.now() });
  res.json({ ok: true });
});

/* ── Shared state ───────────────────────────────────────────────── */
const state = {
  A: { online: true, clients: new Map() },
  B: { online: true, clients: new Map() }
};
const messages = [];
const RELAY_MS = 250;

const adminNs = webIo.of('/admin');
const nsA     = webIo.of('/server-a');
const nsB     = webIo.of('/server-b');

function getStats() {
  const mapClients = srv =>
    [...state[srv].clients.entries()].map(([sid, info]) => ({ sid, ...info }));
  return {
    serverA: { online: state.A.online, clientCount: state.A.clients.size, clients: mapClients('A') },
    serverB: { online: state.B.online, clientCount: state.B.clients.size, clients: mapClients('B') },
    messages: messages.slice(-50)
  };
}

function pushStats()    { adminNs.emit('stats',      getStats()); }
function pushLog(entry) { adminNs.emit('system-log', entry); }

/* ── Socket namespace logic ─────────────────────────────────────── */
function attachServer(ns, srv, otherNs) {
  ns.on('connection', socket => {
    const { clientId, name } = socket.handshake.query;

    if (!state[srv].online) {
      socket.emit('server-down', { redirect: srv === 'A' ? 'B' : 'A' });
      socket.disconnect();
      return;
    }

    const displayName = (name || '').trim() || `Client ${clientId}`;
    state[srv].clients.set(socket.id, { clientId, name: displayName });
    pushStats();
    pushLog({ text: `${displayName} (C${clientId}) connected to Server ${srv}`, type: 'connect', time: Date.now() });

    socket.on('message', data => {
      const msg = {
        id: Date.now() + Math.random(),
        clientId, name: displayName,
        text: data.text, 
        type: data.type || 'text',
        fromServer: srv, 
        time: Date.now()
      };
      messages.push(msg);
      if (messages.length > 100) messages.shift();

      ns.emit('message', msg);
      setTimeout(() => otherNs.emit('message', msg), RELAY_MS);
      adminNs.emit('message', msg);
      pushLog({ text: `${displayName} → Srv ${srv} → relay → Srv ${srv === 'A' ? 'B' : 'A'}`, type: 'relay', time: Date.now() });
    });

    socket.on('disconnect', () => {
      state[srv].clients.delete(socket.id);
      pushStats();
      pushLog({ text: `${displayName} (C${clientId}) disconnected from Server ${srv}`, type: 'disconnect', time: Date.now() });
    });
  });
}

attachServer(nsA, 'A', nsB);
attachServer(nsB, 'B', nsA);

/* ── Admin namespace ────────────────────────────────────────────── */
adminNs.on('connection', socket => {
  socket.emit('stats', getStats());

  socket.on('toggle-server', ({ server, online }) => {
    state[server].online = online;
    if (!online) {
      (server === 'A' ? nsA : nsB).emit('server-down', { redirect: server === 'A' ? 'B' : 'A' });
      state[server].clients.clear();
    }
    pushStats();
    pushLog({ text: `Server ${server} ${online ? 'ONLINE' : 'OFFLINE'}`, type: online ? 'online' : 'offline', time: Date.now() });
  });

  socket.on('kick-client', ({ sid, srv }) => {
    const target = (srv === 'A' ? nsA : nsB).sockets.get(sid);
    if (target) {
      target.emit('kicked', 'Admin таныг холбооноос салгалаа');
      target.disconnect();
    }
  });
});

/* ── Start ──────────────────────────────────────────────────────── */
if (require.main === module) {
  webHttp.listen(WEB_PORT, () => console.log(`Server running on port ${WEB_PORT}`));
}

module.exports = { app, webHttp };
