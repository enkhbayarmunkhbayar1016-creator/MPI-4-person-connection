# Part B — Build (Хэрэгжилт)

MPI 4-Person Distributed Chat System — Socket.IO + Express real-time messaging platform.

## Features

1. **Real-time chat** — Socket.IO-р Server A болон Server B хооронд мессеж relay
2. **Admin panel** — сервер toggle, client kick, live stats dashboard
3. **Auth system** — admin нэвтрэх, token-based session, client бүртгэл
4. **Dark/Light mode** — UI theme toggle, localStorage persist
5. **Sticker & GIF support** — Tenor GIF болон sticker мессеж

## Quick Start

```bash
npm install
npm start        # port 3000
npm run dev      # nodemon hot-reload
npm test         # 11 unit tests
```

## Project Structure

```
src/
  server.js        # Express + Socket.IO server
  public/
    index.html     # Admin panel
    client.html    # Client chat UI
    app.js         # Admin frontend logic
    client.js      # Client frontend logic
    style.css      # Shared styles
tests/
  server.test.js   # Jest + Supertest unit tests
ai-sessions/       # AI session logs
openapi.yaml       # REST API spec
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/login | Admin/client нэвтрэх |
| POST | /api/register | Шинэ хэрэглэгч бүртгэх |
| POST | /api/logout | Гарах |
| GET | /api/admins | Admin жагсаалт |
| POST | /api/admins | Admin нэмэх |
| DELETE | /api/admins/:username | Admin устгах |

## Socket Namespaces

- `/admin` — Admin dashboard
- `/server-a` — Server A clients
- `/server-b` — Server B clients
