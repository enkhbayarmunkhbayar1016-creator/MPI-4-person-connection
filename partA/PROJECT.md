# PROJECT.md — MPI 4-Person Distributed Chat System

## Сэдэв
Real-time distributed chat system with admin control panel.

## Зорилго
4 хүртэлх хэрэглэгч хоёр тусдаа сервер (Server A, Server B) дээр нэгэн зэрэг холбогдож, бодит цагийн мессеж солилцох боломжтой систем. Админ нь серверүүдийг удирдаж, хэрэглэгчдийг хянах боломжтой.

## Scope
**Багтах:**
- REST API: login, register, logout, admin CRUD
- Socket.IO namespace: /server-a, /server-b, /admin
- Message relay between Server A ↔ Server B (250ms delay)
- Admin panel: server toggle, client kick, live stats
- GIF/sticker support in chat
- Dark/light mode UI

**Багтахгүй:**
- Message persistence (database)
- File upload
- Mobile native app
- End-to-end encryption

## Tech Stack
- Runtime: Node.js 18+
- Framework: Express 4
- Real-time: Socket.IO 4
- Frontend: Vanilla JS + HTML/CSS (no framework)
- Deploy: Render.com

## Багийн гишүүн
- Энхбаяр Мунхбаяр — хөгжүүлэгч
