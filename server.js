const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));

// Server state
const state = {
  serverA: { online: true, clients: new Map() },
  serverB: { online: true, clients: new Map() }
};

const messages = [];

function broadcast(event, data) {
  nsA.emit(event, data);
  nsB.emit(event, data);
  adminNs.emit(event, data);
}

function getStats() {
  return {
    serverA: { online: state.serverA.online, clientCount: state.serverA.clients.size },
    serverB: { online: state.serverB.online, clientCount: state.serverB.clients.size },
    messages: messages.slice(-50)
  };
}

// Namespace: Server A
const nsA = io.of('/server-a');
nsA.on('connection', (socket) => {
  const clientId = socket.handshake.query.clientId;

  if (!state.serverA.online) {
    socket.emit('server-down', { redirect: 'B' });
    socket.disconnect();
    return;
  }

  state.serverA.clients.set(socket.id, clientId);
  console.log(`[Server A] Client ${clientId} connected`);

  broadcast('stats', getStats());
  broadcast('system-log', {
    text: `Client ${clientId} connected to Server A`,
    type: 'connect',
    server: 'A',
    time: Date.now()
  });

  socket.on('message', (data) => {
    const msg = {
      id: Date.now() + Math.random(),
      clientId,
      text: data.text,
      fromServer: 'A',
      time: Date.now()
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();

    // Relay to Server B clients
    nsB.emit('message', msg);
    nsA.emit('message', msg);
    adminNs.emit('message', msg);

    broadcast('system-log', {
      text: `Client ${clientId} → Server A → Server B → All clients`,
      type: 'relay',
      server: 'A',
      time: Date.now()
    });
  });

  socket.on('disconnect', () => {
    state.serverA.clients.delete(socket.id);
    broadcast('stats', getStats());
    broadcast('system-log', {
      text: `Client ${clientId} disconnected from Server A`,
      type: 'disconnect',
      server: 'A',
      time: Date.now()
    });
  });
});

// Namespace: Server B
const nsB = io.of('/server-b');
nsB.on('connection', (socket) => {
  const clientId = socket.handshake.query.clientId;

  if (!state.serverB.online) {
    socket.emit('server-down', { redirect: 'A' });
    socket.disconnect();
    return;
  }

  state.serverB.clients.set(socket.id, clientId);
  console.log(`[Server B] Client ${clientId} connected`);

  broadcast('stats', getStats());
  broadcast('system-log', {
    text: `Client ${clientId} connected to Server B`,
    type: 'connect',
    server: 'B',
    time: Date.now()
  });

  socket.on('message', (data) => {
    const msg = {
      id: Date.now() + Math.random(),
      clientId,
      text: data.text,
      fromServer: 'B',
      time: Date.now()
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();

    nsA.emit('message', msg);
    nsB.emit('message', msg);
    adminNs.emit('message', msg);

    broadcast('system-log', {
      text: `Client ${clientId} → Server B → Server A → All clients`,
      type: 'relay',
      server: 'B',
      time: Date.now()
    });
  });

  socket.on('disconnect', () => {
    state.serverB.clients.delete(socket.id);
    broadcast('stats', getStats());
    broadcast('system-log', {
      text: `Client ${clientId} disconnected from Server B`,
      type: 'disconnect',
      server: 'B',
      time: Date.now()
    });
  });
});

// Admin namespace
const adminNs = io.of('/admin');
adminNs.on('connection', (socket) => {
  socket.emit('stats', getStats());

  socket.on('toggle-server', ({ server, online }) => {
    if (server === 'A') {
      state.serverA.online = online;
      if (!online) {
        nsA.emit('server-down', { redirect: 'B' });
        state.serverA.clients.clear();
      }
      broadcast('system-log', {
        text: `Server A ${online ? 'ONLINE' : 'OFFLINE'} — ${online ? 'восстановлен' : 'клиентүүд В рүү шилжинэ'}`,
        type: online ? 'online' : 'offline',
        server: 'A',
        time: Date.now()
      });
    } else {
      state.serverB.online = online;
      if (!online) {
        nsB.emit('server-down', { redirect: 'A' });
        state.serverB.clients.clear();
      }
      broadcast('system-log', {
        text: `Server B ${online ? 'ONLINE' : 'OFFLINE'}`,
        type: online ? 'online' : 'offline',
        server: 'B',
        time: Date.now()
      });
    }
    broadcast('stats', getStats());
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Lab4 Distributed System running on port ${PORT}`);
});
